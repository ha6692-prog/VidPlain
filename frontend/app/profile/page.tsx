"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AnimatedNoise } from "@/components/ui/animated-noise"
import { BitmapChevron } from "@/components/ui/bitmap-chevron"

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("account")
    const [progressStats, setProgressStats] = useState<any>(null)
    const [userEmail, setUserEmail] = useState<string>("")
    const [selectedLanguage, setSelectedLanguage] = useState<string>("english")
    const [languageSaved, setLanguageSaved] = useState(false)

    useEffect(() => {
        const userStr = localStorage.getItem("user")
        if (userStr) {
            try {
                const user = JSON.parse(userStr)
                if (user.email) {
                    setUserEmail(user.email)
                    // Load preferred language from user data or API
                    if (user.preferredLanguage) {
                        setSelectedLanguage(user.preferredLanguage)
                    }
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/?email=${encodeURIComponent(user.email)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.success !== false) {
                                setProgressStats(data)
                                if (data.preferredLanguage) {
                                    setSelectedLanguage(data.preferredLanguage)
                                }
                            }
                        })
                        .catch(err => console.error("Error fetching progress:", err))
                }
            } catch (e) { }
        }
    }, [])

    const handleLanguageChange = async (language: string) => {
        setSelectedLanguage(language)
        setLanguageSaved(false)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/update-language/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, language }),
            })

            if (res.ok) {
                setLanguageSaved(true)
                // Update localStorage
                const userStr = localStorage.getItem("user")
                if (userStr) {
                    const user = JSON.parse(userStr)
                    user.preferredLanguage = language
                    localStorage.setItem("user", JSON.stringify(user))
                }
                setTimeout(() => setLanguageSaved(false), 3000)
            }
        } catch (err) {
            console.error("Error updating language:", err)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 p-6 md:p-12 font-sans pb-24">
            <AnimatedNoise />

            <header className="mb-12 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 z-10 relative gap-6 md:gap-0">
                <div>
                    <h1 className="text-4xl md:text-5xl font-mono uppercase tracking-tight mb-2">Profile & Settings</h1>
                    <p className="text-secondary-foreground font-mono text-sm uppercase">Manage your Vidplain account</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-accent hover:text-foreground transition-colors font-mono text-sm uppercase">
                        <BitmapChevron className="rotate-180 w-4 h-4" />
                        Back to Home
                    </Link>
                    <nav className="flex gap-4 sm:gap-6 font-mono text-sm uppercase">
                        <Link href="/dashboard" className="text-secondary-foreground hover:text-foreground transition-colors pb-1">Dashboard</Link>
                        <Link href="/chat" className="text-secondary-foreground hover:text-foreground transition-colors pb-1">AI Tutor</Link>
                        <Link href="/focus" className="text-secondary-foreground hover:text-foreground transition-colors pb-1">Focus</Link>
                        <Link href="/profile" className="text-foreground border-b border-accent pb-1">Profile</Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-5xl mx-auto grid md:grid-cols-4 gap-12 z-10 relative">

                {/* Sidebar Nav */}
                <aside className="md:col-span-1 border-r border-border pr-8 space-y-2">
                    {["account", "progress", "preferences", "billing", "system"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left font-mono uppercase px-4 py-3 text-sm transition-colors border ${activeTab === tab
                                ? "bg-foreground text-background border-foreground"
                                : "border-transparent text-secondary-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </aside>

                {/* Dynamic Content */}
                <div className="md:col-span-3">

                    {activeTab === "account" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Waitlist/Coming Soon state for Account Tab */}
                            <div className="py-20 text-center border border-border border-dashed space-y-4">
                                <div className="text-4xl text-secondary-foreground">👤</div>
                                <h3 className="font-mono text-lg uppercase">Account Management</h3>
                                <p className="text-secondary-foreground font-mono text-sm max-w-sm mx-auto">This feature will be launched soon. You'll be able to update your avatar, name, and profile details here.</p>
                            </div>

                            {/* 
                            <div className="border border-border p-8 bg-secondary/10 flex items-center gap-6">
                                <div className="w-20 h-20 bg-accent border-2 border-foreground flex items-center justify-center font-mono text-3xl text-background shrink-0">
                                    U
                                </div>
                                <div>
                                    <h2 className="font-mono text-2xl uppercase">Student User</h2>
                                    <p className="text-secondary-foreground font-mono text-sm uppercase mb-3">student@vidplain.com</p>
                                    <div className="flex gap-2">
                                        <button className="bg-foreground text-background px-4 py-2 font-mono text-xs uppercase hover:bg-accent hover:text-foreground transition-colors">
                                            Change Avatar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-mono text-xl uppercase border-b border-border pb-2">Personal Info</h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-mono text-xs uppercase text-secondary-foreground">Full Name</label>
                                        <input type="text" defaultValue="Student User" className="w-full bg-transparent border border-border p-3 font-mono focus:border-accent outline-none transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-mono text-xs uppercase text-secondary-foreground">Username</label>
                                        <input type="text" defaultValue="student42" className="w-full bg-transparent border border-border p-3 font-mono focus:border-accent outline-none transition-colors" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="font-mono text-xs uppercase text-secondary-foreground">Email</label>
                                        <input type="email" defaultValue="student@vidplain.com" disabled className="w-full bg-secondary border border-border p-3 font-mono text-secondary-foreground cursor-not-allowed" />
                                </div>
                                */}
                        </div>
                    )}

                    {activeTab === "progress" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="font-mono text-xl uppercase border-b border-border pb-2">Learning Progress</h3>
                            {progressStats ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="border border-border p-6 bg-background">
                                        <h4 className="font-mono text-sm uppercase text-secondary-foreground mb-2">Total Questions</h4>
                                        <p className="text-4xl font-mono">{progressStats.total_questions || 0}</p>
                                    </div>
                                    <div className="border border-border p-6 bg-background">
                                        <h4 className="font-mono text-sm uppercase text-secondary-foreground mb-2">Total Conversations</h4>
                                        <p className="text-4xl font-mono">{progressStats.total_conversations || 0}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-border border-dashed p-8 text-center bg-secondary/10">
                                    <p className="font-mono text-sm uppercase text-secondary-foreground">Loading progress...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "preferences" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="font-mono text-xl uppercase border-b border-border pb-2">Learning Preferences</h3>

                            {/* Language Selection */}
                            <div className="space-y-4 border border-border p-6 bg-background">
                                <div>
                                    <h4 className="font-mono text-sm uppercase mb-4">Preferred Language for AI Tutor</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { code: "english", label: "English 🇬🇧" },
                                            { code: "hindi", label: "हिन्दी 🇮🇳" },
                                            { code: "tamil", label: "தமிழ் 🇮🇳" },
                                            { code: "malayalam", label: "മലയാളം 🇮🇳" },
                                            { code: "telugu", label: "తెలుగు 🇮🇳" },
                                            { code: "kannada", label: "ಕನ್ನಡ 🇮🇳" },
                                        ].map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => handleLanguageChange(lang.code)}
                                                className={`p-3 border font-mono text-sm uppercase transition-colors ${selectedLanguage === lang.code
                                                        ? "bg-accent border-accent text-background"
                                                        : "border-border text-foreground hover:border-accent"
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                    {languageSaved && (
                                        <p className="text-accent text-sm font-mono mt-3">✓ Language saved successfully</p>
                                    )}
                                </div>
                            </div>

                            {/* Other Preferences */}
                            <div className="space-y-6 border border-border p-6 bg-background">
                                {[
                                    { title: "Weekly Goals", desc: "Receive email reminders for weekly study targets", active: true },
                                    { title: "AI Tutor Proactive Help", desc: "Allow AI to intervene when you're stuck", active: true },
                                    { title: "Public Leaderboard", desc: "Show my progress on the global leaderboard", active: false }
                                ].map((pref, i) => (
                                    <div key={i} className="flex justify-between items-center py-4 border-b border-border last:border-0 last:pb-0">
                                        <div>
                                            <h4 className="font-mono text-sm uppercase">{pref.title}</h4>
                                            <p className="text-secondary-foreground font-sans text-sm mt-1">{pref.desc}</p>
                                        </div>
                                        <button className={`w-12 h-6 border flex items-center px-1 transition-colors ${pref.active ? 'bg-accent border-accent' : 'bg-transparent border-border'}`}>
                                            <div className={`w-4 h-4 bg-foreground transition-transform ${pref.active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "system" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="font-mono text-xl uppercase border-b border-border pb-2">System & Security</h3>

                            <div className="border border-border p-6 bg-background space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-mono text-sm uppercase">Sign out of all sessions</h4>
                                        <p className="text-secondary-foreground text-sm mt-1 mb-0">Revoke access from all other devices and browsers.</p>
                                    </div>
                                    <button className="border border-border bg-secondary hover:bg-foreground hover:text-background px-4 py-2 font-mono text-xs uppercase transition-colors shrink-0">
                                        Sign Out All
                                    </button>
                                </div>
                            </div>

                            <div className="border border-red-900/30 bg-red-950/10 p-6 space-y-4 relative overflow-hidden">
                                <div>
                                    <h4 className="font-mono text-sm uppercase text-red-500">Danger Zone</h4>
                                    <p className="text-secondary-foreground text-sm mt-1 mb-4">Permanently delete your account and all associated learning data.</p>
                                </div>
                                <button className="border border-red-900 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 font-mono text-xs uppercase transition-colors relative z-10">
                                    Delete Account
                                </button>
                                <div className="absolute right-0 bottom-0 text-[10rem] leading-none text-red-500/5 font-mono select-none pointer-events-none">
                                    !
                                </div>
                            </div>

                        </div>
                    )}

                    {(activeTab === "billing") && (
                        <div className="py-20 text-center border border-border border-dashed space-y-4">
                            <div className="text-4xl text-secondary-foreground">⊘</div>
                            <h3 className="font-mono text-lg uppercase">Billing Portal</h3>
                            <p className="text-secondary-foreground font-mono text-sm">Integration coming soon.</p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    )
}
