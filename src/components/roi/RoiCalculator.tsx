import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";

export type RoiInputs = {
  householdSize: number;
  electricityPrice: number; // per kWh
  systemCost: number; // upfront before gran
  grant: number; // upfront grant deduction
  maintenance: number; // yearly
  savingsRatio: number; // 0-1
  kwhPerPerson: number; // per year
  horizonYears: number;
};

const defaultInputs: RoiInputs = {
  householdSize: 3,
  electricityPrice: 1.95, // SEK / kWh - inkl. skatt, moms och tariffer
  systemCost: 29000,
  grant: 0,
  maintenance: 0, // No maintenance cost
  savingsRatio: 0.66, // "2/3 of hot water for free"
  kwhPerPerson: 1000,
  horizonYears: 15,
};

function currency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
}

export default function RoiCalculator({ className }: { className?: string }) {
  const [form, setForm] = useState<RoiInputs>(defaultInputs);

  const derived = useMemo(() => {
    const annualHotWaterKwh = form.householdSize * form.kwhPerPerson;
    const annualHotWaterCost = annualHotWaterKwh * form.electricityPrice;
    const annualSavings = annualHotWaterCost * form.savingsRatio;
    const netAnnualSavings = Math.max(annualSavings - form.maintenance, 0);
    const upfront = Math.max(form.systemCost - form.grant, 0);

    const paybackYears = netAnnualSavings > 0 ? upfront / netAnnualSavings : Infinity;

    const years = Array.from({ length: form.horizonYears + 1 }, (_, i) => i);
    let cumulative = -upfront;
    const data = years.map((year) => {
      if (year > 0) cumulative += netAnnualSavings;
      return { year, value: Math.round(cumulative) };
    });

    const tenYearRoi = upfront > 0 ? ((netAnnualSavings * 10 - upfront) / upfront) : 0;

    return {
      annualHotWaterKwh,
      annualHotWaterCost,
      annualSavings,
      netAnnualSavings,
      upfront,
      paybackYears,
      data,
      tenYearRoi,
    };
  }, [form]);

  return (
    <section className={cn("grid gap-8 md:grid-cols-5", className)} aria-labelledby="roi-heading">
      <div className="md:col-span-2 space-y-6">
        <header>
          <h2 id="roi-heading" className="text-2xl font-semibold tracking-tight">Beräkna din besparing</h2>
          <p className="text-muted-foreground mt-1">Uppskatta besparingar och återbetalningstid baserat på ditt ushålls förutsättningar.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Antaganden</CardTitle>
            <CardDescription>Justera siffror för att matcha ditt hem och din förbrukning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="household">Antal personer</Label>
                <Input id="household" type="number" min={1} value={form.householdSize}
                  onChange={(e) => setForm({ ...form, householdSize: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="price">Elpris inkl. skatt, moms och tariffer (kr/kWh)</Label>
                <Input id="price" type="number" step="0.01" min={0.1} value={form.electricityPrice}
                  onChange={(e) => setForm({ ...form, electricityPrice: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="system">Systemkostnad (kr)</Label>
                <Input id="system" type="number" min={0} value={form.systemCost}
                  onChange={(e) => setForm({ ...form, systemCost: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="grant">Bidrag (kr)</Label>
                <Input id="grant" type="number" min={0} value={form.grant}
                  onChange={(e) => setForm({ ...form, grant: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="kwh">Varmvatten (kWh/person·år)</Label>
                <Input id="kwh" type="number" min={500} value={form.kwhPerPerson}
                  onChange={(e) => setForm({ ...form, kwhPerPerson: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <Label>Andel som SoletAer täcker ({Math.round(form.savingsRatio * 100)}%)</Label>
              <Slider value={[Math.round(form.savingsRatio * 100)]}
                onValueChange={(v) => setForm({ ...form, savingsRatio: v[0] / 100 })}
                min={40} max={85} step={1}
                className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Standard: 66% enligt budskapet ”2/3 av varmvattnet gratis”.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3 space-y-6">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Resultat</CardTitle>
            <CardDescription>Sammanställning baserad på dina uppgifter.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Årlig besparing" value={currency(derived.netAnnualSavings)} />
              <Stat label="Återbetalning" value={isFinite(derived.paybackYears) ? `${derived.paybackYears.toFixed(1)} år` : "–"} />
              <Stat label="Uppstarts-kostnad" value={currency(derived.upfront)} />
              <Stat label="ROI efter 10 år" value={`${Math.round(derived.tenYearRoi * 100)}%`} />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={derived.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                  <Tooltip formatter={(value: number) => currency(value)} labelFormatter={(l) => `År ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--brand))" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">Beräkningen är en uppskattning och ska ses som vägledning. Faktiska resultat påverkas av användning, klimat och energipriser.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  // Normalize to a string and replace NBSPs with normal spaces
  let str = String(value).replace(/\u00A0/g, " ").trim();

  // Try to extract a trailing '%' first (no space between number and unit)
  let unit: string | null = null;
  let num = str;

  const percent = str.match(/^(.+?)(%)$/);
  if (percent) {
    num = percent[1].trim();
    unit = percent[2];
  } else {
    // Otherwise split on normal spaces; last token is the unit
    const parts = str.split(" ");
    if (parts.length > 1) {
      unit = parts.pop() || null;
      num = parts.join(" ");
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-card shadow-sm min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
   <p className="mt-1 text-xl font-semibold leading-tight">
  <span className="whitespace-nowrap">{num}</span>
  {unit && (
    <span className="ml-1 text-base sm:text-lg">{unit}</span>
  )}
</p>
    </div>
  );
}

