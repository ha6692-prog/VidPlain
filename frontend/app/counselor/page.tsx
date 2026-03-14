"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatedNoise } from "@/components/ui/animated-noise"
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

function extractSseData(buffer: string): { events: string[]; remaining: string } {
    const events: string[] = []
    const parts = buffer.split("\n\n")
    const remaining = parts.pop() ?? ""

    for (const part of parts) {
        const data = part
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("")
        if (data) events.push(data)
    }

    return { events, remaining }
}

export default function CounselorPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hi, I am Mano. This is a safe space. How are you feeling today?" },
    ])
    const [input, setInput] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [conversationId, setConversationId] = useState<number | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])

    const chatEndRef = useRef<HTMLDivElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    const getUserEmail = (): string | null => {
        try {
            const userStr = localStorage.getItem("user")
            if (!userStr) return null
            return JSON.parse(userStr).email || null
        } catch {
            return null
        }
    }

    const loadConversations = useCallback(() => {
        const email = getUserEmail()
        if (!email) return
        fetch(`/django-api/conversations?email=${encodeURIComponent(email)}&bot_type=mental_health`)
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d)) setConversations(d)
            })
            .catch(() => { })
    }, [])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const startNewChat = () => {
        setConversationId(null)
        setMessages([{ role: "ai", content: "Hi, I am Mano. I am here to support you. What is on your mind?" }])
    }

    const loadConversation = (id: number) => {
        fetch(`/django-api/conversations/${id}`)
            .then((r) => r.json())
            .then((d) => {
                const mapped: Message[] = (d.messages || []).map((m: { role: string; content: string }) => ({
                    role: m.role === "user" ? "user" : "ai",
                    content: m.content,
                }))
                setConversationId(id)
                setMessages(mapped.length ? mapped : [{ role: "ai", content: "Conversation loaded." }])
            })
            .catch(() => { })
    }

    const sendSuggestion = (text: string) => {
        setInput(text)
    }

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (isStreaming) return
        if (!input.trim()) return

        const userMessage = input.trim()
        const email = getUserEmail()

        setMessages((prev) => [...prev, { role: "user", content: userMessage }, { role: "ai", content: "", streaming: true }])
        setInput("")
        setIsStreaming(true)

        const controller = new AbortController()
        abortRef.current = controller

        fetch("/django-api/chat/mental-health/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                message: userMessage,
                conversation_id: conversationId,
                language: "English",
            }),
            signal: controller.signal,
        })
            .then(async (res) => {
                if (!res.ok || !res.body) {
                    const fallback = await res.text().catch(() => "")
                    throw new Error(fallback || "Failed to get response")
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

                    for (const event of parsed.events) {
                        let payload: { token?: string; done?: boolean; conversation_id?: number; error?: string } | null = null
                        try {
                            payload = JSON.parse(event)
                        } catch {
                            payload = null
                        }
                        if (!payload) continue

                        if (payload.error) throw new Error(payload.error)

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
                            if (payload.conversation_id) setConversationId(payload.conversation_id)
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

                if (!doneFromServer) throw new Error("Incomplete stream response")
                loadConversations()
            })
            .catch((err) => {
                const msg = err?.name === "AbortError" ? "Response cancelled." : err?.message || "Request failed"
                setMessages((prev) => {
                    const next = [...prev]
                    const idx = next.length - 1
                    if (idx >= 0 && next[idx].role === "ai") {
                        next[idx] = { role: "ai", content: msg }
                    } else {
                        next.push({ role: "ai", content: msg })
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
        <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
            <AnimatedNoise opacity={0.03} />
            <div className="grid-bg fixed inset-0 opacity-20" aria-hidden="true" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[300px_1fr] min-h-screen">
                <aside className="hidden md:flex flex-col border-r border-border bg-secondary/10 p-5">
                    <Link href="/" className="inline-flex items-center gap-2 text-accent hover:text-foreground transition-colors font-mono text-sm uppercase mb-5">
                        <BitmapChevron className="rotate-180 w-4 h-4" />
                        Back to Home
                    </Link>
                    <h1 className="font-[var(--font-bebas)] text-4xl tracking-tight mb-1">MANO</h1>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">Mental Health Companion</p>

                    <button onClick={startNewChat} className="w-full bg-foreground text-background py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors mb-6">
                        New Chat
                    </button>

                    <div className="mb-4">
                        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Recent Conversations</h3>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                            {conversations.length === 0 && <p className="font-mono text-xs text-muted-foreground">No conversations yet.</p>}
                            {conversations.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => loadConversation(c.id)}
                                    className={`w-full text-left border px-3 py-2 font-mono text-xs truncate transition-colors ${conversationId === c.id ? "border-accent bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-accent/40"}`}
                                >
                                    {c.title || "Untitled"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2 font-mono text-xs uppercase tracking-widest">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors py-1">Dashboard</Link>
                        <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors py-1">AI Tutor</Link>
                        <Link href="/counselor" className="text-accent py-1">Counselor</Link>
                        <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors py-1">Profile</Link>
                    </div>
                </aside>

                <section className="flex flex-col min-h-screen">
                    <header className="px-5 md:px-8 py-4 border-b border-border bg-background/80 backdrop-blur">
                        <h2 className="font-[var(--font-bebas)] text-3xl md:text-4xl tracking-tight">Mano - Safe Space Chat</h2>
                        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-1">AI companion, not a replacement for professional care</p>
                    </header>

                    <div className="mx-5 md:mx-8 mt-4 border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 px-4 py-3 font-mono text-xs leading-relaxed">
                        If you are in crisis, call 988 (Suicide and Crisis Lifeline) or text HOME to 741741.
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                        {messages.length <= 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button onClick={() => sendSuggestion("I am feeling very stressed about exams.")} className="text-left border border-border bg-card hover:border-accent/50 transition-colors p-4">
                                    <h3 className="font-mono text-xs uppercase tracking-widest mb-1">Academic Stress</h3>
                                    <p className="text-sm text-muted-foreground">Feeling overwhelmed with studying or exams.</p>
                                </button>
                                <button onClick={() => sendSuggestion("I feel anxious and keep overthinking everything.")} className="text-left border border-border bg-card hover:border-accent/50 transition-colors p-4">
                                    <h3 className="font-mono text-xs uppercase tracking-widest mb-1">Anxiety and Worry</h3>
                                    <p className="text-sm text-muted-foreground">Support for racing thoughts and panic feelings.</p>
                                </button>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[90%] md:max-w-[75%] p-5 ${msg.role === "user" ? "bg-foreground text-background" : "bg-secondary/30 border border-border text-foreground"}`}>
                                    {msg.role === "ai" && <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Mano</p>}
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

                    <div className="p-5 md:p-8 border-t border-border bg-background/80 backdrop-blur">
                        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Share what is on your mind..."
                                className="flex-1 bg-secondary border border-border px-5 py-4 font-mono text-sm outline-none focus:border-accent transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={isStreaming}
                                className="bg-accent text-background px-6 py-4 font-mono text-xs uppercase tracking-widest hover:bg-foreground transition-colors disabled:opacity-60"
                            >
                                {isStreaming ? "Thinking..." : "Send"}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    )
}