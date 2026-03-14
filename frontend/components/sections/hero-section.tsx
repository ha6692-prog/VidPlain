"use client"

import { useEffect, useRef } from "react"
import { ScrambleTextOnHover } from "@/components/ui/scramble-text"
import { SplitFlapText, SplitFlapMuteToggle, SplitFlapAudioProvider } from "@/components/ui/split-flap-text"
import { AnimatedNoise } from "@/components/ui/animated-noise"
import { BitmapChevron } from "@/components/ui/bitmap-chevron"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen flex items-center pl-6 md:pl-28 pr-6 md:pr-12">
      <AnimatedNoise opacity={0.03} />

      {/* Left vertical labels */}
      <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground -rotate-90 origin-left block whitespace-nowrap">
          VIDPLAIN
        </span>
      </div>

      {/* Main content */}
      <div ref={contentRef} className="flex-1 w-full">
        <SplitFlapAudioProvider>
          <div className="relative">
            <SplitFlapText text="VIDPLAIN" speed={80} />
            <div className="mt-4">
              <SplitFlapMuteToggle />
            </div>
          </div>
        </SplitFlapAudioProvider>

        <h2 className="font-[var(--font-bebas)] text-muted-foreground/60 text-[clamp(1rem,3vw,2rem)] mt-4 tracking-wide">
          AI-Powered Adaptive Learning
        </h2>

        <p className="mt-12 max-w-md font-mono text-sm text-muted-foreground leading-relaxed">
          Vidplain tracks your progress, strengthens your weak spots, and keeps you balanced with a built-in mental well-being companion.
        </p>

        <div className="mt-16 flex items-center gap-8">
          <a
            href="/auth?mode=signup"
            className="group inline-flex items-center gap-3 border border-foreground/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition-all duration-200"
          >
            <ScrambleTextOnHover text="Start Learning Free" as="span" duration={0.6} />
            <BitmapChevron className="transition-transform duration-[400ms] ease-in-out group-hover:rotate-45" />
          </a>
          <a
            href="#signals"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Explore Features
          </a>
        </div>
      </div>

      {/* Floating info tag */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12">
        <div className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          AI-Powered / Vidplain
        </div>
      </div>
    </section>
  )
}
