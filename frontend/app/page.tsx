"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HeroSection } from "@/components/sections/hero-section"
import { SignalsSection } from "@/components/sections/signals-section"
import { WorkSection } from "@/components/sections/work-section"
import { PrinciplesSection } from "@/components/sections/principles-section"
import { ColophonSection } from "@/components/sections/colophon-section"
import { SideNav } from "@/components/ui/side-nav"

export default function Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.email) {
          // User is logged in, redirect to chat
          router.push("/chat")
          return
        }
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <main className="relative min-h-screen">
      <SideNav />
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10">
        <HeroSection />
        <SignalsSection />
        <WorkSection />
        <PrinciplesSection />
        <ColophonSection />
      </div>
    </main>
  )
}
