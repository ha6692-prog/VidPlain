function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

function formatInline(text: string): string {
    return text
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
}

export function renderSimpleMarkdown(source: string): string {
    const escaped = escapeHtml(source || "")
    const lines = escaped.split(/\r?\n/)

    const html: string[] = []
    let inUl = false
    let inOl = false

    const closeLists = () => {
        if (inUl) {
            html.push("</ul>")
            inUl = false
        }
        if (inOl) {
            html.push("</ol>")
            inOl = false
        }
    }

    for (const rawLine of lines) {
        const line = rawLine.trim()

        if (!line) {
            closeLists()
            html.push("<p></p>")
            continue
        }

        if (line.startsWith("### ")) {
            closeLists()
            html.push(`<h3>${formatInline(line.slice(4))}</h3>`)
            continue
        }

        if (line.startsWith("## ")) {
            closeLists()
            html.push(`<h2>${formatInline(line.slice(3))}</h2>`)
            continue
        }

        if (line.startsWith("# ")) {
            closeLists()
            html.push(`<h1>${formatInline(line.slice(2))}</h1>`)
            continue
        }

        const ulMatch = line.match(/^[-*]\s+(.*)$/)
        if (ulMatch) {
            if (!inUl) {
                closeLists()
                html.push("<ul>")
                inUl = true
            }
            html.push(`<li>${formatInline(ulMatch[1])}</li>`)
            continue
        }

        const olMatch = line.match(/^\d+\.\s+(.*)$/)
        if (olMatch) {
            if (!inOl) {
                closeLists()
                html.push("<ol>")
                inOl = true
            }
            html.push(`<li>${formatInline(olMatch[1])}</li>`)
            continue
        }

        closeLists()
        html.push(`<p>${formatInline(line)}</p>`)
    }

    closeLists()

    return html.join("\n")
}