import type React from "react"
import type { Metadata } from "next"
import { SmoothScroll } from "@/components/ui/smooth-scroll"
import "./globals.css"

export const metadata: Metadata = {
  title: "Vidplain — AI-Powered Learning",
  description:
    "Vidplain tracks your progress, strengthens your weak spots, and keeps you balanced with a built-in mental well-being companion.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Bebas+Neue:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <div className="noise-overlay" aria-hidden="true" />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  )
}
