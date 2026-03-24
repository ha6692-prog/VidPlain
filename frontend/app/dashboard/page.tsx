"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ArrowDownLeft } from "lucide-react"

interface SubjectData {
    id: number
    name: string
    status: string
    progress: number
    current_chapter: string
}

interface ActivityData {
    id: number
    activity_type: string
    subject_name: string
    created_at: string
}

interface DashboardData {
    subjects: SubjectData[]
    activities: ActivityData[]
    latest_mood: { mood: number } | null
    overall_progress: number
    user_name: string
    membership: string
    continue_subject: SubjectData | null
}

const STATUS_LABELS: Record<string, string> = {
    on_track: "On Track",
    needs_review: "Needs Review",
    behind: "Behind",
}

const ACTIVITY_LABELS: Record<string, string> = {
    completed_quiz: "Completed Quiz",
    ai_tutor_session: "AI Tutor Session",
    new_subject: "New Subject Added",
    completed_chapter: "Completed Chapter",
    focus_session: "Focus Session",
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return "Yesterday"
    return `${days}d ago`
}

export default function DashboardPage() {
    const [activeMood, setActiveMood] = useState<number | null>(null)
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const moods = ["😣", "😟", "😐", "🙂", "😄"]

    useEffect(() => {
        const userStr = localStorage.getItem("user")
        if (!userStr) {
            setLoading(false)
            return
        }
        try {
            const user = JSON.parse(userStr)
            if (!user.email) { setLoading(false); return }

            fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/?email=${encodeURIComponent(user.email)}`)
                .then(res => {
                    if (res.status === 404) {
                        // User not found in DB - clear local storage and redirect to auth
                        localStorage.removeItem("user")
                        window.location.href = "/auth"
                        throw new Error("User not found")
                    }
                    return res.json()
                })
                .then((d: DashboardData) => {
                    setData(d)
                    if (d.latest_mood !== null) setActiveMood(d.latest_mood.mood)
                })
                .catch(err => console.error("Dashboard fetch error:", err))
                .finally(() => setLoading(false))
        } catch { setLoading(false) }
    }, [])

    const handleMoodSelect = (idx: number) => {
        setActiveMood(idx)
        const userStr = localStorage.getItem("user")
        if (!userStr) return
        try {
            const user = JSON.parse(userStr)
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/mood/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, mood: idx }),
            }).catch(err => console.error("Mood save error:", err))
        } catch { }
    }

    const userName = data?.user_name || "User"
    const membership = data?.membership || "Free Member"
    const overallProgress = data?.overall_progress ?? 0
    const subjects = data?.subjects ?? []
    const activities = data?.activities ?? []
    const continueSubject = data?.continue_subject

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="grid-bg fixed inset-0 opacity-10 pointer-events-none" aria-hidden="true" />

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 py-8">
                {/* ═══ TOP HEADER ═══ */}
                <header className="flex items-start justify-between mb-2">
                    <div>
                        <h1 className="font-[var(--font-bebas)] text-[clamp(3rem,6vw,5rem)] leading-none tracking-tight uppercase">
                            Dashboard
                        </h1>
                        <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest mt-1">
                            Welcome back, {userName.split(" ")[0]}
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="font-mono text-sm text-accent hover:text-foreground transition-colors uppercase tracking-wider flex items-center gap-2 pt-2"
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </header>

                {/* ═══ NAVIGATION ═══ */}
                <nav className="flex gap-8 border-b border-border mb-10 pt-2">
                    <Link
                        href="/dashboard"
                        className="font-mono text-sm uppercase tracking-widest text-accent pb-3 border-b-2 border-accent"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/chat"
                        className="font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors pb-3 border-b-2 border-transparent"
                    >
                        AI Tutor
                    </Link>
                    <Link
                        href="/focus"
                        className="font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors pb-3 border-b-2 border-transparent"
                    >
                        Focus
                    </Link>
                    <Link
                        href="/counselor"
                        className="font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors pb-3 border-b-2 border-transparent"
                    >
                        Counselor
                    </Link>
                    <Link
                        href="/profile"
                        className="font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors pb-3 border-b-2 border-transparent"
                    >
                        Profile
                    </Link>
                </nav>

                {/* ═══ MAIN GRID: Content + Sidebar ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
                    {/* ─── LEFT COLUMN ─── */}
                    <div className="space-y-10">
                        {/* Continue Learning Card */}
                        {continueSubject ? (
                            <div className="border border-border bg-card p-8">
                                <h2 className="font-[var(--font-bebas)] text-3xl uppercase tracking-wide mb-2">
                                    Continue {continueSubject.name}
                                </h2>
                                <p className="font-mono text-sm text-muted-foreground mb-6">
                                    {continueSubject.current_chapter || `Progress: ${continueSubject.progress}%`}
                                </p>
                                <Link
                                    href="/chat"
                                    className="inline-flex items-center gap-3 bg-foreground text-background px-6 py-3 font-mono text-sm uppercase tracking-widest hover:bg-accent hover:text-background transition-colors"
                                >
                                    Resume Learning <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="border border-border border-dashed bg-card p-8 text-center">
                                <p className="font-mono text-sm text-muted-foreground mb-4">
                                    No subjects yet. Start a conversation in AI Tutor to begin learning!
                                </p>
                                <Link
                                    href="/chat"
                                    className="inline-flex items-center gap-3 bg-foreground text-background px-6 py-3 font-mono text-sm uppercase tracking-widest hover:bg-accent hover:text-background transition-colors"
                                >
                                    Start Learning <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}

                        {/* Active Subjects */}
                        <div>
                            <h2 className="font-mono text-base text-accent uppercase tracking-widest mb-6">
                                Active Subjects
                            </h2>
                            {subjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subjects.map((subject) => (
                                        <div
                                            key={subject.id}
                                            className="border border-border bg-card p-6 hover:border-accent/50 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-5">
                                                <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                                                    {subject.name}
                                                </h3>
                                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-1">
                                                    {STATUS_LABELS[subject.status] || subject.status}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary mb-3">
                                                <div
                                                    className="h-full bg-accent transition-all duration-700"
                                                    style={{ width: `${subject.progress}%` }}
                                                />
                                            </div>
                                            <div className="text-right font-mono text-sm text-muted-foreground">
                                                {subject.progress}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-border border-dashed p-8 text-center">
                                    <p className="font-mono text-sm text-muted-foreground">
                                        No active subjects. Use the AI Tutor to start learning a topic!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── RIGHT SIDEBAR ─── */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="border border-border bg-card p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-accent flex items-center justify-center shrink-0">
                                    <span className="font-[var(--font-bebas)] text-3xl text-background">
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                                        {userName}
                                    </h3>
                                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                                        {membership}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                    Overall Progress
                                </span>
                                <span className="font-mono text-xs text-accent font-bold">{overallProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary">
                                <div className="h-full bg-accent transition-all duration-700" style={{ width: `${overallProgress}%` }} />
                            </div>
                        </div>

                        {/* Mood Tracker */}
                        <div className="border border-border bg-card p-6">
                            <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-5">
                                How are you feeling?
                            </h4>
                            <div className="flex justify-between">
                                {moods.map((emo, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleMoodSelect(idx)}
                                        className={`text-2xl transition-all duration-200 hover:scale-125 ${activeMood === idx
                                            ? "scale-110 grayscale-0"
                                            : "grayscale opacity-40 hover:grayscale-0 hover:opacity-100"
                                            }`}
                                    >
                                        {emo}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="border border-border bg-card p-6">
                            <h4 className="font-mono text-base text-accent uppercase tracking-widest mb-5">
                                Recent Activity
                            </h4>
                            <div className="space-y-4">
                                {activities.length > 0 ? activities.map((act) => (
                                    <div key={act.id} className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-accent mt-1.5 shrink-0" />
                                        <div>
                                            <h5 className="font-mono text-sm font-bold uppercase tracking-wider">
                                                {ACTIVITY_LABELS[act.activity_type] || act.activity_type}
                                            </h5>
                                            <p className="font-mono text-xs text-muted-foreground mt-1">
                                                {act.subject_name} &bull; {timeAgo(act.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="font-mono text-xs text-muted-foreground">No recent activity yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
