"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Camera } from "lucide-react";

// -----------------------------------------
// 1) CONFIG
// -----------------------------------------
const COLORS = {
  you: "#0d00ffff",
  partner: "#cd28ffff",
  merge: "#035e40ff",
  grid: "#E5E7EB",
};

const EVENTS = [
  { id: "e1", title: "Childhood on the coast", date: "1990s", desc: "Weekend soccer, salty hair, and an unreasonable number of popsicles.", icon: <MapPin className="w-4 h-4" />, img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200", side: "left", path: "you", position: 0.08 },
  { id: "e2", title: "Graduate school nights", date: "2016–2018", desc: "Coffee, code, and late trains. We were two stops apart and never knew.", icon: <Camera className="w-4 h-4" />, img: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200", side: "right", path: "partner", position: 0.18 },
  { id: "e3", title: "Missed connection #1", date: "2019", desc: "Same concert, same rainstorm, different umbrellas.", icon: <MapPin className="w-4 h-4" />, img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200", side: "left", path: "you", position: 0.28 },
  { id: "e4", title: "First DM", date: "2021", desc: "A meme about sourdough. Predictable, in retrospect.", icon: <Camera className="w-4 h-4" />, img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=1200", side: "right", path: "partner", position: 0.45 },
  { id: "e5", title: "First date (we finally meet)", date: "2022-06-18", desc: "Two trains. One table by the window. Everything clicked.", icon: <Heart className="w-4 h-4" />, img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200", side: "merge", path: "merge", position: 0.62 },
  { id: "e6", title: "The proposal", date: "2025-01-14", desc: "A snowy overlook, numb fingers, warm yes.", icon: <Heart className="w-4 h-4" />, img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200", side: "merge", path: "merge", position: 0.82 },
];

const X_CENTER_PCT = 0.28;

// -----------------------------------------
// 2) SVG PATHS
// -----------------------------------------
function buildWavyPath(width: number, height: number, phase = 0, amplitude = 240, frequency = 2) {
  const steps = 40;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * height;
    const xCenter = width * X_CENTER_PCT;
    const taper = 1 - t;
    const wave = Math.sin(t * Math.PI * frequency + phase) * amplitude * Math.max(0, taper);
    const x = xCenter + wave;
    pts.push([x, y]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  return d;
}

function buildPartnerPath(width: number, height: number) {
  return buildWavyPath(width, height * 0.8, Math.PI / 2, 150, 3.2);
}
function buildYouPath(width: number, height: number) {
  return buildWavyPath(width, height * 0.8, 0, 125, 2.5);
}

// Smooth, undulating merge using Catmull–Rom -> cubic Bézier
function buildMergeWavyFromStart(
  width: number,
  svgHeight: number,
  startY: number,
  startX: number,          // NEW: exact merge-start X (p.x)
  amplitude = 70,
  frequency = 2.2,
  phase = 0,               // phase offset in radians
  steps = 100,             // sampling density
  tension = 0.5            // Catmull–Rom tension (0..1)
) {
  const xCenter = width * X_CENTER_PCT;
  const yEnd = svgHeight - 20;
  const ySpan = Math.max(1, yEnd - startY);

  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = startY + t * ySpan;
    const taper = 1 - t;
    const wave = Math.sin(t * Math.PI * frequency + phase) * amplitude * taper;
    const x = i === 0 ? startX : xCenter + wave; // NEW: first point matches the join X exactly
    pts.push([x, y]);
  }

  if (pts.length < 2) return "";
  const P = (k: number) => pts[Math.max(0, Math.min(pts.length - 1, k))];

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) * (tension / 6);
    const c1y = p1[1] + (p2[1] - p0[1]) * (tension / 6);
    const c2x = p2[0] - (p3[0] - p1[0]) * (tension / 6);
    const c2y = p2[1] - (p3[1] - p1[1]) * (tension / 6);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// -----------------------------------------
// 3) COMPONENT
// -----------------------------------------
export default function WeddingTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const youPathRef = useRef<SVGPathElement | null>(null);

  // NEW: anchor for the "First date" card
  const firstDateRef = useRef<HTMLDivElement | null>(null); // NEW

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // NEW: compute the intended card position (fallback) BEFORE we use it
  const firstDatePos =
    EVENTS.find((e) => e.title.toLowerCase().includes("first date"))?.position ?? 0.62; // NEW

  // NEW: measured merge-start progress (fallback to firstDatePos)
  const [mergeStartProgress, setMergeStartProgress] = useState(firstDatePos); // NEW

  // NEW: measure where the First-date card actually sits in the section (0..1)
  function measureMergeStart() {
    const container = containerRef.current;
    const anchor = firstDateRef.current;
    if (!container || !anchor) return;

    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
    const scrollable = container.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const p = (anchorTop - containerTop) / scrollable; // normalized 0..1
    setMergeStartProgress(Math.max(0, Math.min(0.99, p)));
  }

  // NEW: re-measure on mount and on resize (images/layout can shift)
  useEffect(() => {
    if (!mounted) return;
    measureMergeStart();
    const onResize = () => measureMergeStart();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted]); // NEW

  // ---- Motion hooks ----
  const MERGE_START = mergeStartProgress;   // NEW: use measured value
  const MERGE_END = 0.95;                   // or 1.0 to finish exactly at end

  // Pre-merge paths finish right when the merge begins
  const pathProgress = useTransform(scrollYProgress, [0, MERGE_START], [0, 1]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.1, 1], [0, 1, 1]);

  const mergePathProgress = useTransform(scrollYProgress, [MERGE_START, MERGE_END], [0, 1]);
  const meetOpacity = useTransform(mergePathProgress, [0, 0.1], [0, 1]);
  const mergeOpacity = useTransform(mergePathProgress, [0, 0.02], [0, 1]);

  // Layout constants
  const SVG_WIDTH = 900;
  const MEET_Y = 1800;
  const MERGE_LENGTH = 1600;
  const SVG_HEIGHT = MEET_Y + MERGE_LENGTH;
  const PATH_HEIGHT = MEET_Y;

  const youPath = buildYouPath(SVG_WIDTH, PATH_HEIGHT);
  const partnerPath = buildPartnerPath(SVG_WIDTH, PATH_HEIGHT);

  // Merge path built from geometry
  const [mergeD, setMergeD] = useState<string>("");
  const [mergeStart, setMergeStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!mounted || !youPathRef.current) return;

    const el = youPathRef.current;
    const len = el.getTotalLength();
    const p = el.getPointAtLength(len); // merge start

    const d = buildMergeWavyFromStart(
      SVG_WIDTH,
      SVG_HEIGHT,
      p.y,
      p.x,       // startX aligns X perfectly
      70,        // amplitude
      5,         // frequency
      Math.PI,   // phase
      120,       // steps
      0.5        // tension
    );

    setMergeD(d);
    setMergeStart({ x: p.x, y: p.y });
  }, [mounted, SVG_WIDTH, SVG_HEIGHT]);

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-6xl font-semibold tracking-tight">
            Our paths to forever
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Scroll to watch two stories undulate, crisscross, and finally meet.
          </motion.p>
        </div>
      </section>

      {/* Timeline Section */}
      <section ref={containerRef} className="relative min-h-[450vh]">
        {/* Sticky left column with SVG paths */}
        <div className="sticky top-0 h-screen pointer-events-none" suppressHydrationWarning>
          <div className="absolute inset-0 flex justify-center">
            {mounted && (
              <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="h-full">
                <defs>
                  {/* NEW cloth pattern */}
                  <pattern id="cloth" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="4" height="8" fill="white" />
                  </pattern>
                  <mask id="clothMask">
                    <rect width="100%" height="100%" fill="url(#cloth)" />
                  </mask>

                  {/* NEW fabric filter */}
                  <filter id="fabricTexture" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
                  </filter>

                   {/* NEW smoky filter */}
<filter id="smokyStroke"
        x="-30%" y="-30%" width="160%" height="160%"
        filterUnits="objectBoundingBox"
        color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" seed="7" result="noise">
    <animate attributeName="baseFrequency" values="0.016;0.028;0.02" dur="12s" repeatCount="indefinite"/>
  </feTurbulence>

  <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="alphaWide"/>
  <feDisplacementMap in="alphaWide" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="wispyAlpha"/>

  <feGaussianBlur in="wispyAlpha" stdDeviation="12" result="smokeAlpha"/>

  <feFlood flood-color="#cd28ff" flood-opacity="1" result="smokeColor"/>
  <feComposite in="smokeColor" in2="smokeAlpha" operator="in" result="coloredSmoke"/>

  <feComponentTransfer in="coloredSmoke" result="coloredSmoke">
    <feFuncA type="gamma" exponent="1.4" amplitude="0.9" offset="0"/>
  </feComponentTransfer>

  <feMerge>
    <feMergeNode in="coloredSmoke"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>

                  {/* Existing glow filter */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Faint vertical grid for elegance */}
                {[0.28, 0.62].map((xPct, i) => (
                  <line key={i} x1={SVG_WIDTH * xPct} x2={SVG_WIDTH * xPct} y1={0} y2={SVG_HEIGHT} stroke={COLORS.grid} strokeDasharray="4 8" />
                ))}

                {/* Partner path */}
                <motion.path
                  d={partnerPath}
                  fill="none"
                  stroke={COLORS.partner}
                  strokeWidth={14}
                  filter="url(#smokyStroke)"
                  style={{ pathLength: pathProgress }}
                />

                {/* Your path */}
                <motion.path
                  d={youPath}
                  fill="none"
                  stroke={COLORS.you}
                  strokeWidth={14}
                  filter="url(#fabricTexture)"  // << NEW
                  //filter="url(#glow)"      // keep glow if you want
                  style={{ pathLength: pathProgress }}
                />

                {/* Merge path (post-meet) */}
                {mergeD && (
                  <motion.path
                    d={mergeD}
                    fill="none"
                    stroke={COLORS.merge}
                    strokeWidth={8}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#glow)"
                    style={{ pathLength: mergePathProgress, opacity: mergeOpacity }}
                  />
                )}

                {/* Meet point (at merge start) */}
                {mergeStart && (
                  <motion.g style={{ opacity: meetOpacity }}>
                    <circle cx={mergeStart.x} cy={mergeStart.y} r={10} fill={COLORS.merge} />
                    <text x={mergeStart.x + 16} y={mergeStart.y + 4} className="fill-gray-500 text-[12px]">
                      First date
                    </text>
                  </motion.g>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Right column: story cards */}
        <div className="relative max-w-5xl mx-auto px-6">
          {EVENTS.map((e) => {
            const isFirstDate = e.title.toLowerCase().includes("first date"); // NEW
            return (
              <motion.div
                key={e.id}
                style={{ opacity: cardOpacity }}
                className={`relative w-full md:w-[58ch] ${e.side === "left" ? "md:ml-[5%]" : e.side === "right" ? "md:ml-[40%]" : "md:ml-[22%]"}`}
              >
                <div style={{ height: `${Math.max(10, Math.round(e.position * 120))}vh` }} />
                {/* NEW: zero-height anchor to measure this card's position */}
                {isFirstDate && <div ref={firstDateRef} style={{ height: 0 }} aria-hidden />}

                <Card className="shadow-lg border-0 rounded-2xl">
                  <CardContent className="p-5 md:p-7">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        {e.icon}
                        {e.date}
                      </span>
                    </div>
                    <h3 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{e.title}</h3>
                    <p className="mt-2 text-gray-600 leading-relaxed">{e.desc}</p>
                    <div className="mt-4 overflow-hidden rounded-xl">
                      {/* NEW: re-measure after image load in case layout shifts */}
                      <img src={e.img} alt="" className="w-full h-56 object-cover" onLoad={isFirstDate ? measureMergeStart : undefined} />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: e.path === "you" ? COLORS.you : e.path === "partner" ? COLORS.partner : COLORS.merge }}
                      />
                      <span className="text-sm text-gray-500">
                        {e.path === "you" ? "Your path" : e.path === "partner" ? "Partner's path" : "Together"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Spacer to allow full path animation */}
          <div className="h-[120vh]" />
        </div>
      </section>

      {/* CTA / Wedding details */}
      <section className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Save the Date</h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            June 14, 2026 · Asbury Park, NJ · Ceremony on the boardwalk, reception to follow.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a href="#rsvp" className="px-5 py-3 rounded-2xl bg-black text-white font-medium shadow-lg">RSVP</a>
            <a href="#travel" className="px-5 py-3 rounded-2xl bg-white text-black font-medium shadow border">Travel</a>
          </div>
        </div>
      </section>
    </div>
  );
}
