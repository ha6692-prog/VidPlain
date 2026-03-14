"use client"

import { useEffect, useMemo, useState } from "react"
import { renderSimpleMarkdown } from "@/lib/format-ai"

interface QuizOption {
    key: string
    text: string
}

interface QuizQuestion {
    id: number
    prompt: string
    options: QuizOption[]
    correctKey?: string
}

type ContentBlock =
    | { type: "markdown"; text: string }
    | { type: "quiz"; question: QuizQuestion }

function tryParseQuestionStart(line: string): string | null {
    const match = line.match(/^Q\s*\d+\s*[:.)-]?\s*(.*)$/i)
    if (!match) return null
    return (match[1] || "").trim()
}

function parseBlocks(content: string): ContentBlock[] {
    const lines = content.split(/\r?\n/)
    const blocks: ContentBlock[] = []
    let markdownBuffer: string[] = []
    let nextQuizId = 1

    const flushMarkdown = () => {
        const text = markdownBuffer.join("\n").trim()
        if (text) blocks.push({ type: "markdown", text })
        markdownBuffer = []
    }

    let i = 0
    while (i < lines.length) {
        const questionStart = tryParseQuestionStart(lines[i].trim())

        if (!questionStart) {
            markdownBuffer.push(lines[i])
            i += 1
            continue
        }

        const startIndex = i
        const options: QuizOption[] = []
        let correctKey: string | undefined
        let prompt = questionStart
        i += 1

        while (i < lines.length) {
            const line = lines[i].trim()
            if (tryParseQuestionStart(line) && options.length >= 2) break

            const optionMatch = line.match(/^([A-Da-d])[).:\-]\s*(.*)$/)
            if (optionMatch) {
                options.push({ key: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() })
                i += 1
                continue
            }

            const answerMatch = line.match(/^Answer\s*[:\-]\s*([A-Da-d])\b/i)
            if (answerMatch) {
                correctKey = answerMatch[1].toUpperCase()
                i += 1
                continue
            }

            if (line && options.length === 0 && !line.startsWith("---")) {
                prompt = `${prompt} ${line}`.trim()
            }

            i += 1
        }

        if (options.length >= 2 && correctKey) {
            flushMarkdown()
            blocks.push({
                type: "quiz",
                question: {
                    id: nextQuizId++,
                    prompt,
                    options,
                    correctKey,
                },
            })
        } else {
            markdownBuffer.push(...lines.slice(startIndex, i))
        }
    }

    flushMarkdown()
    return blocks
}

export function AIResponseContent({
    content,
    streaming,
    className,
}: {
    content: string
    streaming?: boolean
    className?: string
}) {
    const [revealedQuizIds, setRevealedQuizIds] = useState<Record<number, true>>({})
    const blocks = useMemo(() => parseBlocks(content || ""), [content])

    useEffect(() => {
        setRevealedQuizIds({})
    }, [content])

    if (streaming) {
        return (
            <>
                <div
                    className={className}
                    dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(content) }}
                />
                <span className="inline-block w-2 h-4 bg-accent/70 animate-pulse align-middle" aria-hidden="true" />
            </>
        )
    }

    return (
        <div className="space-y-4">
            {blocks.map((block, idx) => {
                if (block.type === "markdown") {
                    return (
                        <div
                            key={`md-${idx}`}
                            className={className}
                            dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(block.text) }}
                        />
                    )
                }

                const q = block.question
                const revealed = !!revealedQuizIds[q.id]
                const correctOption = q.options.find((opt) => opt.key === q.correctKey)

                return (
                    <div key={`quiz-${q.id}`} className="border border-accent/30 bg-accent/5 p-4 space-y-3">
                        <p className="font-mono text-xs uppercase tracking-widest text-accent">Quick Quiz</p>
                        <p className="font-mono text-sm leading-relaxed">{q.prompt}</p>

                        {!revealed ? (
                            <div className="space-y-2">
                                {q.options.map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setRevealedQuizIds((prev) => ({ ...prev, [q.id]: true }))}
                                        className="w-full text-left border border-border bg-background/70 px-3 py-2 font-mono text-sm hover:border-accent transition-colors"
                                    >
                                        {opt.key}) {opt.text}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-green-500/40 bg-green-500/10 px-3 py-2 font-mono text-sm text-green-700 dark:text-green-300">
                                Correct answer: {correctOption ? `${correctOption.key}) ${correctOption.text}` : "Not available"}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}