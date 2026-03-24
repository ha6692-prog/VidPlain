"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { BitmapChevron } from "@/components/ui/bitmap-chevron"
import { AIResponseContent } from "@/components/ui/ai-response-content"

interface Message {
    role: "user" | "ai"
    content: string
    streaming?: boolean
}

interface Conversation {
    id: number
    title: string
    updated_at: string
}

interface SubjectOption {
    id: number
    name: string
    current_chapter: string
}

const LEVELS = ["beginner", "intermediate", "advanced"] as const

function extractSseData(buffer: string): { events: string[]; remaining: string } {
    const events: string[] = []
    const parts = buffer.split("\n\n")
    const remaining = parts.pop() ?? ""

    for (const part of parts) {
        const lines = part.split("\n")
        const data = lines
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("")
        if (data) events.push(data)
    }

    return { events, remaining }
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hi there! I'm your Vidplain AI Tutor. Pick a subject above or tell me what you'd like to learn!" }
    ])
    const [input, setInput] = useState("")
    const [subjects, setSubjects] = useState<SubjectOption[]>([])
    const [activeSubject, setActiveSubject] = useState("")
    const [newSubjectInput, setNewSubjectInput] = useState("")
    const [showNewSubject, setShowNewSubject] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [conversationId, setConversationId] = useState<number | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [level, setLevel] = useState<string>("intermediate")
    // Feedback state
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackRating, setFeedbackRating] = useState(0)
    const [feedbackComment, setFeedbackComment] = useState("")
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const [feedbackHover, setFeedbackHover] = useState(0)

    const messageCountRef = useRef(0)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    const getUserEmail = (): string | null => {
        try {
            const userStr = localStorage.getItem("user")
            if (!userStr) return null
            return JSON.parse(userStr).email || null
        } catch { return null }
    }

    const loadConversations = useCallback(() => {
        const email = getUserEmail()
        if (!email) return
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/?email=${encodeURIComponent(email)}&bot_type=tutor`)
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setConversations(d) })
            .catch(() => { })
    }, [])

    // Load subjects & conversations
    useEffect(() => {
        const email = getUserEmail()
        if (!email) return
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.subjects) setSubjects(data.subjects)
            })
            .catch(err => console.error("Error loading subjects:", err))
    }, [])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const trackActivity = (subjectName: string) => {
        const email = getUserEmail()
        if (!email || !subjectName) return

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/track-activity/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                activity_type: "ai_tutor_session",
                subject_name: subjectName,
            }),
        }).catch(err => console.error("Track activity error:", err))
    }

    const createOrUpdateSubject = (subjectName: string) => {
        const email = getUserEmail()
        if (!email || !subjectName) return

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name: subjectName }),
        })
            .then(res => res.json())
            .then(data => {
                // Refresh subjects list
                setSubjects(prev => {
                    const existing = prev.find(s => s.name === data.name)
                    if (existing) return prev.map(s => s.name === data.name ? data : s)
                    return [...prev, data]
                })
            })
            .catch(err => console.error("Subject update error:", err))
    }

    const handleSelectSubject = (name: string) => {
        setActiveSubject(name)
        setMessages([
            { role: "ai", content: `Great! Let's continue studying **${name}**. What would you like to focus on?` }
        ])
        messageCountRef.current = 0
        createOrUpdateSubject(name)
    }

    const handleAddNewSubject = () => {
        const name = newSubjectInput.trim()
        if (!name) return
        setNewSubjectInput("")
        setShowNewSubject(false)
        setActiveSubject(name)
        createOrUpdateSubject(name)
        setMessages([
            { role: "ai", content: `Great! I've added **${name}** as a new subject. Let's start learning! What would you like to know?` }
        ])
        messageCountRef.current = 0
    }

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (isStreaming) return
        if (!input.trim()) return

        const userMsg = input.trim()
        setMessages(prev => [...prev, { role: "user", content: userMsg }])
        setInput("")
        messageCountRef.current += 1

        // If no subject selected, try auto-detect from first message
        if (!activeSubject) {
            const subjectGuess = userMsg.length > 3 ? userMsg.split(" ").slice(0, 3).join(" ") : userMsg
            setActiveSubject(subjectGuess)
            createOrUpdateSubject(subjectGuess)
        }

        // Track activity every 5 messages
        if (messageCountRef.current % 5 === 0 && activeSubject) {
            trackActivity(activeSubject)
        }

        const email = getUserEmail()
        const effectiveSubject = activeSubject || (userMsg.length > 3 ? userMsg.split(" ").slice(0, 3).join(" ") : userMsg)

        setIsStreaming(true)
        setMessages(prev => [...prev, { role: "ai", content: "", streaming: true }])

        const controller = new AbortController()
        abortRef.current = controller

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/stream/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                question: userMsg,
                conversation_id: conversationId,
                subject: effectiveSubject,
                level,
                language: "English",
            }),
            signal: controller.signal,
        })
            .then(async (res) => {
                if (!res.ok || !res.body) {
                    const fallback = await res.text().catch(() => "")
                    throw new Error(fallback || "Failed to get AI response")
                }

                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ""
                let doneFromServer = false

                while (true) {
                    const { value, done } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const parsed = extractSseData(buffer)
                    buffer = parsed.remaining

                    for (const rawEvent of parsed.events) {
                        let payload: { token?: string; done?: boolean; conversation_id?: number; error?: string } | null = null
                        try {
                            payload = JSON.parse(rawEvent)
                        } catch {
                            payload = null
                        }
                        if (!payload) continue

                        if (payload.error) {
                            throw new Error(payload.error)
                        }

                        if (payload.token) {
                            setMessages((prev) => {
                                const next = [...prev]
                                const idx = next.length - 1
                                if (idx >= 0 && next[idx].role === "ai") {
                                    next[idx] = {
                                        role: "ai",
                                        content: (next[idx].content || "") + payload.token,
                                        streaming: true,
                                    }
                                }
                                return next
                            })
                        }

                        if (payload.done) {
                            doneFromServer = true
                            if (payload.conversation_id) {
                                setConversationId(payload.conversation_id)
                            }
                        }
                    }
                }

                setMessages((prev) => {
                    const next = [...prev]
                    const idx = next.length - 1
                    if (idx >= 0 && next[idx].role === "ai") {
                        next[idx] = { role: "ai", content: next[idx].content || "" }
                    }
                    return next
                })

                if (!doneFromServer) {
                    throw new Error("Incomplete stream response")
                }

                loadConversations()
            })
            .catch((err) => {
                const errorText = err?.name === "AbortError" ? "Response cancelled." : (err?.message || "AI request failed")
                setMessages((prev) => {
                    const next = [...prev]
                    const idx = next.length - 1
                    if (idx >= 0 && next[idx].role === "ai") {
                        next[idx] = { role: "ai", content: errorText }
                    } else {
                        next.push({ role: "ai", content: errorText })
                    }
                    return next
                })
            })
            .finally(() => {
                setIsStreaming(false)
                abortRef.current = null
            })
    }

    return (
        <div className="flex h-screen bg-background text-foreground selection:bg-accent/30 font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-border bg-secondary/10 flex flex-col hidden md:flex z-10 h-full">
                <div className="p-6 border-b border-border">
                    <Link href="/" className="inline-flex items-center gap-2 text-accent hover:text-foreground transition-colors font-mono text-sm uppercase mb-6">
                        <BitmapChevron className="rotate-180 w-4 h-4" />
                        Back to Home
                    </Link>
                    <h1 className="text-2xl font-mono uppercase tracking-tight">AI Tutor</h1>
                </div>

                <div className="p-4 border-b border-border space-y-2">
                    <button
                        onClick={() => {
                            setActiveSubject("")
                            setMessages([{ role: "ai", content: "Hi there! I'm your Vidplain AI Tutor. Pick a subject above or tell me what you'd like to learn!" }])
                            messageCountRef.current = 0
                        }}
                        className="w-full bg-foreground text-background py-3 font-mono uppercase text-sm hover:bg-accent hover:text-foreground transition-colors"
                    >
                        + New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <h3 className="font-mono text-xs uppercase text-secondary-foreground mb-4">Your Subjects</h3>
                    {subjects.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleSelectSubject(s.name)}
                            className={`w-full text-left p-3 text-sm font-mono border transition-colors truncate ${activeSubject === s.name
                                ? "bg-secondary border-accent text-foreground"
                                : "border-transparent hover:bg-secondary hover:border-border"
                                }`}
                        >
                            {s.name}
                        </button>
                    ))}
                    {showNewSubject ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleAddNewSubject() }} className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newSubjectInput}
                                onChange={(e) => setNewSubjectInput(e.target.value)}
                                placeholder="Subject name..."
                                autoFocus
                                className="flex-1 bg-transparent border border-border px-3 py-2 text-sm font-mono outline-none focus:border-accent"
                            />
                            <button type="submit" className="text-accent font-mono text-sm px-2">Add</button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowNewSubject(true)}
                            className="w-full text-left p-3 text-sm font-mono text-accent hover:bg-secondary border border-dashed border-border transition-colors"
                        >
                            + Add Subject
                        </button>
                    )}
                </div>

                {/* Global App Nav in Sidebar */}
                <div className="p-4 border-t border-border flex flex-col gap-2 font-mono text-sm uppercase">
                    <Link href="/dashboard" className="text-secondary-foreground hover:text-foreground transition-colors py-2">Dashboard</Link>
                    <Link href="/chat" className="text-foreground flex items-center gap-2 py-2">
                        <div className="w-1.5 h-1.5 bg-accent"></div>
                        AI Tutor
                    </Link>
                    <Link href="/counselor" className="text-secondary-foreground hover:text-foreground transition-colors py-2">Counselor</Link>
                    <Link href="/focus" className="text-secondary-foreground hover:text-foreground transition-colors py-2">Focus</Link>
                    <Link href="/profile" className="text-secondary-foreground hover:text-foreground transition-colors py-2">Profile</Link>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col z-10 relative">
                {/* Mobile Header */}
                <div className="md:hidden p-4 border-b border-border flex justify-between items-center bg-background">
                    <h1 className="text-xl font-mono uppercase">AI Tutor</h1>
                    <Link href="/" className="text-sm font-mono text-accent">Home</Link>
                </div>

                {/* Active Subject Banner */}
                {activeSubject && (
                    <div className="px-6 py-3 border-b border-border bg-accent/5 font-mono text-xs uppercase tracking-widest text-accent">
                        Studying: {activeSubject}
                    </div>
                )}

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[85%] md:max-w-[70%] p-6 ${msg.role === "user"
                                    ? "bg-foreground text-background font-mono"
                                    : "bg-secondary/30 border border-border text-foreground"
                                    }`}
                            >
                                {msg.role === "ai" && <div className="font-mono text-xs text-accent uppercase mb-2">Vidplain AI</div>}
                                {msg.role === "ai" ? (
                                    <AIResponseContent
                                        content={msg.content}
                                        streaming={!!msg.streaming}
                                        className="leading-relaxed space-y-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-accent/10"
                                    />
                                ) : (
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-border bg-background/80 backdrop-blur">
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="flex-1 bg-secondary border border-border px-6 py-4 outline-none focus:border-accent transition-colors font-mono"
                        />
                        <button
                            type="submit"
                            disabled={isStreaming}
                            className="bg-accent text-background px-8 py-4 font-mono uppercase hover:bg-foreground transition-colors"
                        >
                            {isStreaming ? "Thinking..." : "Send"}
                        </button>
                    </form>
                    <div className="text-center mt-4">
                        <p className="font-mono text-[10px] text-secondary-foreground uppercase">AI can make mistakes. Verify important information.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
