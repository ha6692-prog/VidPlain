"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AnimatedNoise } from "@/components/ui/animated-noise"
import { BitmapChevron } from "@/components/ui/bitmap-chevron"

export default function FocusPage() {
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isActive, setIsActive] = useState(false)
    const [sessionCount, setSessionCount] = useState(0)

    const totalTime = 25 * 60
    const progress = ((totalTime - timeLeft) / totalTime) * 100

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            setIsActive(false)
            setSessionCount(prev => prev + 1)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isActive, timeLeft])

    const toggleTimer = () => setIsActive(!isActive)

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(25 * 60)
    }

    const setPreset = (mins: number) => {
        setIsActive(false)
        setTimeLeft(mins * 60)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 p-6 md:p-12 font-sans flex flex-col items-center pb-24">
            <AnimatedNoise />

            <header className="mb-12 w-full max-w-4xl flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 z-10 relative gap-6 md:gap-0">
                <div>
                    <h1 className="text-4xl md:text-5xl font-mono uppercase tracking-tight mb-2">Focus Time</h1>
                    <p className="text-secondary-foreground font-mono text-sm uppercase">Deep Work Session</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-accent hover:text-foreground transition-colors font-mono text-sm uppercase">
                        <BitmapChevron className="rotate-180 w-4 h-4" />
                        Back to Home
                    </Link>
                    <nav className="flex gap-4 sm:gap-6 font-mono text-sm uppercase">
                        <Link href="/dashboard" className="text-secondary-foreground hover:text-foreground transition-colors pb-1">Dashboard</Link>
                        <Link href="/chat" className="text-secondary-foreground hover:text-foreground transition-colors pb-1">AI Tutor</Link>
                        <Link href="/focus" className="text-foreground border-b border-accent pb-1">Focus</Link>
                        <Link href="/profile" className="text-secondary-foreground hover:text-foreground transition-colors pb-1">Profile</Link>
                    </nav>
                </div>
            </header>

            <main className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center z-10 relative">

                {/* Timer UI */}
                <div className="flex flex-col items-center border border-border bg-secondary/10 p-12 relative overflow-hidden">
                    {/* Circular Progress (Brutalist style) */}
                    <div className="relative w-64 h-64 flex items-center justify-center border-4 border-secondary rounded-full mb-8">
                        <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
                            <circle
                                cx="128"
                                cy="128"
                                r="124"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-accent transition-all duration-1000 ease-linear"
                                strokeDasharray={`${2 * Math.PI * 124}`}
                                strokeDashoffset={`${2 * Math.PI * 124 * (1 - progress / 100)}`}
                            />
                        </svg>
                        <div className="text-center font-mono">
                            <div className="text-5xl tracking-tighter">{formatTime(timeLeft)}</div>
                            <div className="text-sm text-secondary-foreground uppercase mt-2">
                                {isActive ? 'Session in progress' : 'Ready'}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <button onClick={() => setPreset(15)} className="px-4 py-2 text-xs font-mono border border-border hover:bg-foreground hover:text-background uppercase transition-colors">15m</button>
                        <button onClick={() => setPreset(25)} className="px-4 py-2 text-xs font-mono border border-border hover:bg-foreground hover:text-background uppercase transition-colors bg-secondary">25m</button>
                        <button onClick={() => setPreset(50)} className="px-4 py-2 text-xs font-mono border border-border hover:bg-foreground hover:text-background uppercase transition-colors">50m</button>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={toggleTimer}
                            className={`flex-1 py-4 font-mono uppercase transition-colors ${isActive ? 'bg-secondary border border-border text-foreground hover:border-accent' : 'bg-foreground text-background hover:bg-accent hover:text-foreground'}`}
                        >
                            {isActive ? 'Pause' : 'Start Focus'}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="px-6 py-4 font-mono uppercase bg-transparent border border-border hover:bg-secondary transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Stats & Info */}
                <div className="space-y-8">
                    <div className="border border-border p-6 bg-background group hover:border-accent transition-colors">
                        <h3 className="font-mono text-xl uppercase mb-2">Today's Focus</h3>
                        <p className="text-4xl font-mono text-accent mb-1">{sessionCount} <span className="text-lg text-foreground">sessions</span></p>
                        <p className="text-sm font-mono text-secondary-foreground uppercase">Total: {sessionCount * 25} minutes</p>
                    </div>

                    <div className="border border-border p-6 bg-secondary/20">
                        <h3 className="font-mono uppercase mb-4 text-sm text-secondary-foreground">Why deep work?</h3>
                        <p className="font-sans leading-relaxed text-sm">
                            Focus is the capacity to completely engage in the task at hand without distraction. Setting a dedicated timer helps wire your brain to concentrate for sustained periods, dropping cognitive friction and improving long-term retention.
                        </p>
                    </div>

                    {/* Abstract Deco */}
                    <div className="relative h-32 border border-border overflow-hidden bg-background">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                        <div className="absolute top-1/2 left-4 w-full border-t border-border -translate-y-1/2"></div>
                        <div className="absolute top-4 left-1/2 h-full border-l border-border -translate-x-1/2"></div>
                        <div className="absolute top-4 right-4 text-xs font-mono text-accent uppercase">* Optimize</div>
                    </div>
                </div>

            </main>
        </div>
    )
}
