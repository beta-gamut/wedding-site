"use client";
import { motion, useInView, useAnimation } from "framer-motion";
import React, { useEffect, useRef } from "react";

const variants = {
  hidden:  { opacity: 0, y: 20 },   // start slightly lower
  visible: { opacity: 1, y: 0 },    // ease upward into place
};

export function EventCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, {
    amount: 0.35,
    margin: "-10% 0px -10% 0px",
  });
  const controls = useAnimation();

  useEffect(() => {
    controls.start(inView ? "visible" : "hidden");
  }, [inView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{
        duration: 1.0,              // 👈 longer fade (1s)
        ease: "easeInOut",          // 👈 smoother easing
      }}
      className={className}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}