import SEO from "@/components/SEO";
import RoiCalculator from "@/components/roi/RoiCalculator";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SoletAer ROI Calculator | Estimate Payback & Savings"
        description="Calculate ROI and payback period for SoletAer solar hot water. Adjust assumptions and see savings and cashflow over time."
        canonical={typeof window !== 'undefined' ? window.location.href : undefined}
      />



      <main id="result" className="container mx-auto pb-16">
        <RoiCalculator />
      </main>
    </div>
  );
};

export default Index;
