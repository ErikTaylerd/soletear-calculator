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

      <header className="container mx-auto py-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">SoletAer ROI Calculator</h1>
            <p className="mt-4 text-lg text-muted-foreground">Se hur mycket du kan spara när SoletAer täcker upp till 2/3 av dina varmvattenkostnader.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="hero">Börja räkna</Button>
              <Button variant="brand" asChild>
                <a href="#result">Läs resultat</a>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-brand-glow bg-gradient-brand">
            <p className="text-sm text-muted-foreground">Snabbguide</p>
            <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
              <li>Fyll i hushållets storlek och elpris.</li>
              <li>Justera täckningsgraden – standard 66%.</li>
              <li>Se årlig besparing, återbetalning och ROI.</li>
            </ul>
          </div>
        </div>
      </header>

      <main id="result" className="container mx-auto pb-16">
        <RoiCalculator />
      </main>
    </div>
  );
};

export default Index;
