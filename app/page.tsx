import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TheIdea } from "@/components/landing/TheIdea";
import { SocialProof } from "@/components/landing/SocialProof";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * The landing page (Phase 8) — built to the Claude Design "NeverComes Landing"
 * screen, split-hero direction. Section anchors (#top/#how/#idea/#proof) are
 * owned here so the header/footer nav and in-section CTAs stay in sync.
 */
export default function Home() {
  return (
    <>
      <LandingHeader />
      <main id="top">
        <Hero />
        <div id="how">
          <HowItWorks />
        </div>
        <div id="idea">
          <TheIdea />
        </div>
        <div id="proof">
          <SocialProof />
        </div>
        <ClosingCta />
      </main>
      <LandingFooter />
    </>
  );
}
