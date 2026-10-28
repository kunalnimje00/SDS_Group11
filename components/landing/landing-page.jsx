import { LandingNav } from "./landing-nav";
import { HeroSection } from "./hero-section";
import { ValueSection } from "./value-section";
import { StepsSection } from "./steps-section";
import { StudentPreview } from "./student-preview";
import { ManagerPreview } from "./manager-preview";
import { FulfillmentSection } from "./fulfillment-section";
import { FinalCallToAction, LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNav />
      <main id="main-content">
        <div className="landing-shell"><HeroSection /></div>
        <ValueSection />
        <StepsSection />
        <StudentPreview />
        <ManagerPreview />
        <FulfillmentSection />
        <FinalCallToAction />
      </main>
      <LandingFooter />
    </div>
  );
}
