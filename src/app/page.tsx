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

// CHANGED: All images now come from /public/images/...
// Put these files in `public/images/` with these names (or change names here).
const EVENTS = [
  { id: "e1", title: "Childhood in Queens", date: "1987 (C) & 1992 (M)", desc: "We played in the same playgrounds in Elmhurst.", icon: <MapPin className="w-4 h-4" />, img: "/images/children.png", side: "left", path: "you", position: 0.08 }, // CHANGED
  { id: "e2", title: "Graduate school missed connection", date: "2017 (C) & 2022 (M)", desc: "Both of us went to Columbia University – both studying architecture briefly, before pivoting (him to engineering, her to be a school psychologist). We graduated five years apart from one another", icon: <Camera className="w-4 h-4" />, img: "/images/graduation.png", side: "right", path: "partner", position: 0.18 }, // CHANGED
  { id: "e3", title: "Missed connection #3", date: "December 2016 (C) & March 2017 (M)", desc: "both visited the Galápagos Islands for school programs, months apart, each of us meeting the eponymous Lonesome George at the Darwin Center - we felt his loneliness.", icon: <MapPin className="w-4 h-4" />, img: "/images/galapagos.jpg", side: "left", path: "you", position: 0.28 }, // CHANGED
  { id: "e4", title: "Missed connection #4", date: "2019", desc: "Melissa is Dominican; Constantine studied in the Dominican Republic during grad school. Constantine worked with FUNGLODE in the DR - he had made his mind up about Dominicanas.", icon: <MapPin className="w-4 h-4" />, img: "/images/dominican-republic.jpg", side: "left", path: "you", position: 0.28 }, // CHANGED
  { id: "e5", title: "Missed connection #5", date: "2019", desc: "We missed each other in the Galapagos Isles by a few months.", icon: <MapPin className="w-4 h-4" />, img: "/images/galapagos-2.jpg", side: "left", path: "you", position: 0.28 }, // CHANGED
  { id: "e6", title: "Missed connection #6 - Lonely Tutelage", date: "2022 & 2023", desc: "We were tutors and teaching in the Bronx but still didn't meet.", icon: <Camera className="w-4 h-4" />, img: "/images/bronx-teaching.jpg", side: "right", path: "partner", position: 0.45 }, // CHANGED
  { id: "e7", title: "First date (we finally meet)", date: "2022-06-18", desc: "The day we met, Constantine’s fridge and phone died – spooky omen / cosmic reset?.", icon: <Heart className="w-4 h-4" />, img: "/images/first-date.jpg", side: "merge", path: "merge", position: 0.62 }, // CHANGED
  { id: "e8", title: "The proposal: Central Park rowboats by the Loeb Boathouse, with friends in on the surprise.", date: "2025-07-19", desc: "", icon: <Heart className="w-4 h-4" />, img: "/images/proposal.jpg", side: "merge", path: "merge", position: 0.82 }, // CHANGED
  { id: "e9", title: "Constantine kept proposing....", date: "2025-07-19", desc: "He never gave up", icon: <Heart className="w-4 h-4" />, img: "/images/proposal-2.jpg", side: "merge", path: "merge", position: 0.82 }, // CHANGED
  { id: "e10", title: "Constantine kept proposing....", date: "2025-07-19", desc: "He never gave up", icon: <Heart className="w-4 h-4" />, img: "/images/proposal-3.jpg", side: "merge", path: "merge", position: 0.82 }, // CHANGED
  { id: "e11", title: "Constantine kept proposing....", date: "2025-07-19", desc: "He never gave up", icon: <Heart className="w-4 h-4" />, img: "/images/proposal-4.jpg", side: "merge", path: "merge", position: 0.82 }, // CHANGED
  { id: "e12", title: "Constantine kept proposing....", date: "2025-07-19", desc: "He never gave up", icon: <Heart className="w-4 h-4" />, img: "/images/proposal-5.jpg", side: "merge", path: "merge", position: 0.82 }, // CHANGED
  { id: "e13", title: "Constantine kept proposing....", date: "2025-07-19", desc: "He never gave up", icon: <Heart className="w-4 h-4" />, img: "/images/proposal-6.jpg", side: "merge", path: "merge", position: 0.82 }, // CHANGED
  { id: "e14", title: "Constantine & Melissa", date: "2025-07-19", desc: "You're Welcome.", icon: <Heart className="w-4 h-4" />, img: "/images/constantine-melissa.jpg", side: "merge", path: "merge", position: 0.82 }, // CHANGED
];

const X_CENTER_PCT = 0.28;

// -----------------------------------------
// 2) SVG PATHS
// -----------------------------------------
type TaperFn = (t: number) => number; // t in [0..1]
const taperDown: TaperFn = (t) => 1 - t;
const taperDownCubic: TaperFn = (t) => 1 - Math.pow(t, 3);
const taperUp: TaperFn = (t) => t;
const taperUpCubic: TaperFn = (t) => Math.pow(t, 3);

type RampFn = (t: number) => number;
const rampLinear: RampFn = (t) => t;
const rampCubic: RampFn = (t) => t * t * t;

function buildWavyPath(
  width: number,
  height: number,
  phase = 0,
  amplitude = 240,
  frequency = 2,
  taperFn: TaperFn = taperDown
) {
  const steps = 40;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * height;
    const xCenter = width * X_CENTER_PCT;
    const taper = Math.max(0, taperFn(t));
    const wave = Math.sin(t * Math.PI * frequency + phase) * amplitude * taper;
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

function buildMergeWavyFromStart(
  width: number,
  svgHeight: number,
  startY: number,
  startX: number,
  amplitudeBase = 70,
  frequencyBase = 2.2,
  phase = 0,
  steps = 100,
  tension = 0.5,
  taperFn: TaperFn = (t) => t,
  ampRamp: RampFn = rampCubic,
  freqRamp: RampFn = rampLinear
) {
  const xCenter = width * X_CENTER_PCT;
  const yEnd = svgHeight - 20;
  const ySpan = Math.max(1, yEnd - startY);
  const N = Math.max(steps, 120);

  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = startY + t * ySpan;
    const taper = Math.max(0, taperFn(t));
    const amp = amplitudeBase * (1 + 1.2 * ampRamp(t));
    const freq = frequencyBase * (1 + 1.6 * freqRamp(t));
    const wave = Math.sin(t * Math.PI * freq + phase) * amp * taper;
    const x = i === 0 ? startX : xCenter + wave;
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
    const c2y = p2[1] - (p3[0] - p1[1]) * (tension / 6);
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

  const firstDateRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const firstDatePos =
    EVENTS.find((e) => e.title.toLowerCase().includes("first date"))?.position ?? 0.62;

  const [mergeStartProgress, setMergeStartProgress] = useState(firstDatePos);

  function measureMergeStart() {
    const container = containerRef.current;
    const anchor = firstDateRef.current;
    if (!container || !anchor) return;

    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
    const scrollable = container.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const p = (anchorTop - containerTop) / scrollable;
    setMergeStartProgress(Math.max(0, Math.min(0.99, p)));
  }

  useEffect(() => {
    if (!mounted) return;
    measureMergeStart();
    const onResize = () => measureMergeStart();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted]);

  const MERGE_START = mergeStartProgress;
  const MERGE_END = 0.95;

  const pathProgress = useTransform(scrollYProgress, [0, MERGE_START], [0, 1]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.1, 1], [0, 1, 1]);

  const mergePathProgress = useTransform(scrollYProgress, [MERGE_START, MERGE_END], [0, 1]);
  const meetOpacity = useTransform(mergePathProgress, [0, 0.1], [0, 1]);
  const mergeOpacity = useTransform(mergePathProgress, [0, 0.02], [0, 1]);

  const SVG_WIDTH = 900;
  const MEET_Y = 1800;
  const MERGE_LENGTH = 1600;
  const SVG_HEIGHT = MEET_Y + MERGE_LENGTH;
  const PATH_HEIGHT = MEET_Y;

  const youPath = buildWavyPath(SVG_WIDTH, PATH_HEIGHT, 0, 125, 2.5, taperDownCubic);
  const partnerPath = buildWavyPath(SVG_WIDTH, PATH_HEIGHT, Math.PI / 2, 150, 3.2, taperDownCubic);

  const [mergeD, setMergeD] = useState<string>("");
  const [mergeStart, setMergeStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!mounted || !youPathRef.current) return;

    const el = youPathRef.current;
    const len = el.getTotalLength();
    const p = el.getPointAtLength(len);

    const d = buildMergeWavyFromStart(
      SVG_WIDTH,
      SVG_HEIGHT,
      p.y,
      p.x,
      110,
      4.5,
      Math.PI,
      180,
      0.55,
      taperUpCubic,
      rampCubic,
      rampLinear
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
                  <pattern id="cloth" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="4" height="8" fill="white" />
                  </pattern>
                  <mask id="clothMask">
                    <rect width="100%" height="100%" fill="url(#cloth)" />
                  </mask>

                  <filter id="fabricTexture" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
                  </filter>

                  <filter id="smokyStrokeColorized"
                          x="-30%" y="-30%" width="160%" height="160%"
                          filterUnits="objectBoundingBox"
                          color-interpolation-filters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" seed="7" result="noise">
                      <animate attributeName="baseFrequency" values="0.015;0.03;0.02" dur="10s" repeatCount="indefinite"/>
                    </feTurbulence>
                    <feDisplacementMap in="SourceAlpha" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" result="displacedAlpha"/>
                    <feGaussianBlur in="displacedAlpha" stdDeviation="15" result="smokeAlpha"/>
                    <feFlood flood-color="currentColor" flood-opacity="1" result="tint"/>
                    <feComposite in="tint" in2="smokeAlpha" operator="in" result="coloredSmoke"/>
                    <feMerge>
                      <feMergeNode in="coloredSmoke"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>

                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {[0.28, 0.62].map((xPct, i) => (
                  <line key={i} x1={SVG_WIDTH * xPct} x2={SVG_WIDTH * xPct} y1={0} y2={SVG_HEIGHT} stroke={COLORS.grid} strokeDasharray="4 8" />
                ))}

                {/* Partner path */}
                <motion.path
                  d={partnerPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={20}
                  filter="url(#smokyStrokeColorized)"
                  style={{ color: COLORS.partner, pathLength: pathProgress }}
                />

                {/* Your path */}
                <motion.path
                  ref={youPathRef}
                  d={youPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={20}
                  filter="url(#smokyStrokeColorized)"
                  style={{ color: COLORS.you, pathLength: pathProgress }}
                />

                {/* Merge path (post-meet) */}
                {mergeD && (
                  <motion.path
                    d={mergeD}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={20}
                    filter="url(#smokyStrokeColorized)"
                    style={{ color: COLORS.merge, pathLength: mergePathProgress, opacity: mergeOpacity }}
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
            const isFirstDate = e.title.toLowerCase().includes("first date");
            return (
              <motion.div
                key={e.id}
                style={{ opacity: cardOpacity }}
                className={`relative w-full md:w-[58ch] ${e.side === "left" ? "md:ml-[5%]" : e.side === "right" ? "md:ml-[40%]" : "md:ml-[22%]"}`}
              >
                <div style={{ height: `${Math.max(10, Math.round(e.position * 120))}vh` }} />
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

                    {/* CHANGED: Intrinsic sizing, no fixed height, no crop. */}
                    <div className="mt-4 rounded-xl overflow-hidden">
                      <img
                        src={e.img}
                        alt=""
                        className="w-full h-auto" // CHANGED: keeps intrinsic ratio; no cropping
                        loading="lazy"            // NEW: better perf on long timelines
                        decoding="async"          // NEW: hint to decode off main thread
                        // Optional (recommended if you know intrinsic size to reduce CLS):
                        // width={1200}
                        // height={800}
                        onLoad={isFirstDate ? measureMergeStart : undefined}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: e.path === "you" ? COLORS.you : e.path === "partner" ? COLORS.partner : COLORS.merge }}
                      />
                      <span className="text-sm text-gray-500">
                        {e.path === "you" ? "Constantine's Path" : e.path === "partner" ? "Melissa's Path" : "Together"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          <div className="h-[120vh]" />
        </div>
      </section>

      {/* CTA / Wedding details */}
      <section className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Save the Date</h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            March 29, 2026 · Beacon, NY · Ceremony at the Roundhouse, reception to follow.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="https://melissa-x-constantine.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-black text-white font-medium shadow-lg"
            >
              RSVP HERE
            </a>
            <a
              href="https://roundhousebeacon.com/private-dining-and-events/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-white text-black font-medium shadow border"
            >
              VENUE INFO
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
