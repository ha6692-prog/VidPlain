import { HeroSection } from "@/components/sections/hero-section"
import { SignalsSection } from "@/components/sections/signals-section"
import { WorkSection } from "@/components/sections/work-section"
import { PrinciplesSection } from "@/components/sections/principles-section"
import { ColophonSection } from "@/components/sections/colophon-section"
import { SideNav } from "@/components/ui/side-nav"

export default function Page() {
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
