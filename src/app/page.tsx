"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Camera } from "lucide-react";

// -----------------------------------------
// 1) CONFIG
// -----------------------------------------
const COLORS = {
  you: "#4F46E5",
  partner: "#EC4899",
  merge: "#10B981",
  grid: "#E5E7EB",
};

const EVENTS = [
  {
    id: "e1",
    title: "Childhood on the coast",
    date: "1990s",
    desc: "Weekend soccer, salty hair, and an unreasonable number of popsicles.",
    icon: <MapPin className="w-4 h-4" />,
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    side: "left",
    path: "you",
    position: 0.08,
  },
  {
    id: "e2",
    title: "Graduate school nights",
    date: "2016–2018",
    desc: "Coffee, code, and late trains. We were two stops apart and never knew.",
    icon: <Camera className="w-4 h-4" />,
    img: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200",
    side: "right",
    path: "partner",
    position: 0.18,
  },
  {
    id: "e3",
    title: "Missed connection #1",
    date: "2019",
    desc: "Same concert, same rainstorm, different umbrellas.",
    icon: <MapPin className="w-4 h-4" />,
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200",
    side: "left",
    path: "you",
    position: 0.28,
  },
  {
    id: "e4",
    title: "First DM",
    date: "2021",
    desc: "A meme about sourdough. Predictable, in retrospect.",
    icon: <Camera className="w-4 h-4" />,
    img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=1200",
    side: "right",
    path: "partner",
    position: 0.45,
  },
  {
    id: "e5",
    title: "First date (we finally meet)",
    date: "2022-06-18",
    desc: "Two trains. One table by the window. Everything clicked.",
    icon: <Heart className="w-4 h-4" />,
    img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200",
    side: "merge",
    path: "merge",
    position: 0.62,
  },
  {
    id: "e6",
    title: "The proposal",
    date: "2025-01-14",
    desc: "A snowy overlook, numb fingers, warm yes.",
    icon: <Heart className="w-4 h-4" />,
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200",
    side: "merge",
    path: "merge",
    position: 0.82,
  },
];

const X_CENTER_PCT = 0.28;      // same as before
const MEET_T = 0.78;            // fraction of SVG height where paths should meet (0..1)

// -----------------------------------------
// 2) SVG PATHS (undulating lines)
// -----------------------------------------
function buildWavyPath(
  width: number,
  height: number,
  phase = 0,
  amplitude = 60,
  frequency = 2
) {
  const steps = 40;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;              // 0..1 over THIS path
    const y = t * height;             // this path’s bottom == meet Y
    const xCenter = width * X_CENTER_PCT;

    // Linear taper: amplitude -> 0 at t=1 (the meet)
    const taper = 1 - t;
    const wave = Math.sin(t * Math.PI * frequency + phase) * amplitude * Math.max(0, taper);

    const x = xCenter + wave;
    pts.push([x, y]);
  }

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    d += ` L ${x} ${y}`;
  }
  return d;
}

function buildPartnerPath(width: number, height: number) {
  return buildWavyPath(width, height * 0.8, Math.PI / 2, 110, 2.4);
}
function buildYouPath(width: number, height: number) {
  return buildWavyPath(width, height * 0.8, 0, 90, 2.1);
}
function buildMergePath(width: number, height: number) {
  const yStart = height * MEET_T;
  const yEnd = height * 0.98;
  const x = width * X_CENTER_PCT;
  return `M ${x} ${yStart} C ${x + 60} ${yStart + 40}, ${x - 40} ${yEnd - 40}, ${x} ${yEnd}`;
}


// -----------------------------------------
// 3) COMPONENT
// -----------------------------------------
export default function WeddingTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Mount gate to avoid hydration mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ⬇️ All motion hooks called unconditionally (top-level), not inside JSX
  const pathProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.1, 1], [0, 1, 1]);
  // Start the merge right after the first-date card shows up
  const firstDatePos =
    EVENTS.find(e => e.title.toLowerCase().includes("first date"))?.position ?? 0.62;

  // Start merge just after the first-date scroll band.
  // Nudge the offset (+0.03) if you want it later/earlier.
  const MERGE_START       = Math.min(0.98, firstDatePos + 10.13);
  const MERGE_FADE_START  = Math.min(0.98, firstDatePos + 10.01);

  const mergePathProgress = useTransform(scrollYProgress, [MERGE_START, 1], [0, 1]);
  const meetOpacity       = useTransform(scrollYProgress, [MERGE_FADE_START, MERGE_START + 0.08], [0, 1]);


  // Layout constants
  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 2400;
  const PATH_HEIGHT = MEET_T * SVG_HEIGHT; // stop exactly at meet Y

  const youPath     = buildYouPath(SVG_WIDTH, PATH_HEIGHT);
  const partnerPath = buildPartnerPath(SVG_WIDTH, PATH_HEIGHT);
  const mergePath = buildMergePath(SVG_WIDTH, SVG_HEIGHT);

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight"
          >
            Our paths to forever
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Scroll to watch two stories undulate, crisscross, and finally meet.
          </motion.p>
        </div>
      </section>

      {/* Timeline Section */}
      <section ref={containerRef} className="relative min-h-[300vh]">
        {/* Sticky left column with SVG paths */}
        <div className="sticky top-0 h-screen pointer-events-none" suppressHydrationWarning>
          <div className="absolute inset-0 flex justify-center">
            {mounted && (
              <svg
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="h-full"
              >
                {/* Faint vertical grid for elegance */}
                {[0.28, 0.62].map((xPct, i) => (
                  <line
                    key={i}
                    x1={SVG_WIDTH * xPct}
                    x2={SVG_WIDTH * xPct}
                    y1={0}
                    y2={SVG_HEIGHT}
                    stroke={COLORS.grid}
                    strokeDasharray="4 8"
                  />
                ))}

                {/* Partner path */}
                <motion.path
                  d={partnerPath}
                  fill="none"
                  stroke={COLORS.partner}
                  strokeWidth={8}
                  strokeLinecap="round"
                  style={{ pathLength: pathProgress }}
                />

                {/* Your path */}
                <motion.path
                  d={youPath}
                  fill="none"
                  stroke={COLORS.you}
                  strokeWidth={8}
                  strokeLinecap="round"
                  style={{ pathLength: pathProgress }}
                />

                {/* Merge path (post-meet) */}
                <motion.path
                  d={mergePath}
                  fill="none"
                  stroke={COLORS.merge}
                  strokeWidth={10}
                  strokeLinecap="round"
                  style={{ pathLength: mergePathProgress }}
                />

                {/* Meet point */}
                <motion.g style={{ opacity: meetOpacity }}>
                <circle cx={SVG_WIDTH * X_CENTER_PCT} cy={SVG_HEIGHT * MEET_T} r={10} fill={COLORS.merge} />
                <text
                  x={SVG_WIDTH * X_CENTER_PCT + 16}
                  y={SVG_HEIGHT * MEET_T + 4}
                  className="fill-gray-500 text-[12px]"
                >
                  First date
                </text>
                </motion.g>
              </svg>
            )}
          </div>
        </div>

        {/* Right column: story cards */}
        <div className="relative max-w-5xl mx-auto px-6">
          {EVENTS.map((e) => (
            <motion.div
              key={e.id}
              style={{ opacity: cardOpacity }}
              className={`relative w-full md:w-[58ch] ${
                e.side === "left" ? "md:ml-[5%]" : e.side === "right" ? "md:ml-[40%]" : "md:ml-[22%]"
              }`}
            >
              <div style={{ height: `${Math.max(10, Math.round(e.position * 120))}vh` }} />
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
                    <img src={e.img} alt="" className="w-full h-56 object-cover" />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{
                        background:
                          e.path === "you"
                            ? COLORS.you
                            : e.path === "partner"
                            ? COLORS.partner
                            : COLORS.merge,
                      }}
                    />
                    <span className="text-sm text-gray-500">
                      {e.path === "you" ? "Your path" : e.path === "partner" ? "Partner's path" : "Together"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Spacer to allow full path animation */}
          <div className="h-[60vh]" />
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
            <a href="#rsvp" className="px-5 py-3 rounded-2xl bg-black text-white font-medium shadow-lg">
              RSVP
            </a>
            <a href="#travel" className="px-5 py-3 rounded-2xl bg-white text-black font-medium shadow border">
              Travel
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
