import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

/** ---------- Types ---------- **/
export type RoiInputs = {
  // These five accept string while typing to allow empty values
  householdSize: number | string;
  electricityPrice: number | string; // SEK per kWh
  systemCost: number | string; // upfront before grant
  grant: number | string; // upfront grant deduction
  kwhPerPerson: number | string; // per year

  // Leave the rest numeric
  maintenance: number; // yearly
  savingsRatio: number; // 0-1
  horizonYears: number;
};

/** ---------- Defaults ---------- **/
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

/** ---------- Helpers ---------- **/
function currency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Allow Swedish comma, return number | undefined
function parseNum(v: string | number | undefined): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function clampInt(n: number | undefined, min: number) {
  if (n === undefined) return undefined;
  return Math.max(min, Math.floor(n));
}

function clampMin(n: number | undefined, min: number) {
  if (n === undefined) return undefined;
  return Math.max(min, n);
}

/** ---------- Component ---------- **/
export default function RoiCalculator({ className }: { className?: string }) {
  const [form, setForm] = useState<RoiInputs>(defaultInputs);

  const derived = useMemo(() => {
    const householdSize = clampInt(parseNum(form.householdSize), 1);
    const electricityPrice = clampMin(parseNum(form.electricityPrice), 0.1);
    const systemCost = clampInt(parseNum(form.systemCost), 0) ?? 0;
    const grant = clampInt(parseNum(form.grant), 0) ?? 0;
    const kwhPerPerson = clampInt(parseNum(form.kwhPerPerson), 500);

    // Guard: if required inputs are missing, return safe zeros
    if (
      householdSize === undefined ||
      electricityPrice === undefined ||
      kwhPerPerson === undefined
    ) {
      const years = Array.from({ length: (Number(form.horizonYears) || 0) + 1 }, (_, i) => i);
      return {
        annualHotWaterKwh: 0,
        annualHotWaterCost: 0,
        annualSavings: 0,
        netAnnualSavings: 0,
        upfront: Math.max(systemCost - grant, 0),
        paybackYears: Infinity,
        data: years.map((year) => ({ year, value: 0 })),
        tenYearRoi: 0,
      };
    }

    const annualHotWaterKwh = householdSize * kwhPerPerson;
    const annualHotWaterCost = annualHotWaterKwh * electricityPrice;
    const annualSavings = annualHotWaterCost * form.savingsRatio;
    const netAnnualSavings = Math.max(annualSavings - form.maintenance, 0);
    const upfront = Math.max(systemCost - grant, 0);

    const paybackYears = netAnnualSavings > 0 ? upfront / netAnnualSavings : Infinity;

    const years = Array.from({ length: form.horizonYears + 1 }, (_, i) => i);
    let cumulative = -upfront;
    const data = years.map((year) => {
      if (year > 0) cumulative += netAnnualSavings;
      return { year, value: Math.round(cumulative) };
    });

    const tenYearRoi = upfront > 0 ? (netAnnualSavings * 10 - upfront) / upfront : 0;

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
      {/* Inputs */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Beräkna din besparing</CardTitle>
            <CardDescription>
              Justera siffrorna för att matcha ditt hem och din förbrukning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Antal personer */}
              <div>
                <Label
                  htmlFor="household"
                  className="flex items-end min-h-[2.8rem] !leading-tight mb-1"
                >
                  Antal personer
                </Label>
                <Input
                  id="household"
                  type="text"
                  inputMode="numeric"
                  value={form.householdSize ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, householdSize: e.target.value })
                  }
                  onBlur={() =>
                    setForm((f) => {
                      const n = clampInt(parseNum(f.householdSize), 1);
                      return { ...f, householdSize: n === undefined ? "" : n };
                    })
                  }
                  className="h-10"
                />
              </div>

              {/* Elpris */}
              <div>
                <Label htmlFor="price">
                  Elpris inkl. skatt, moms och tariffer (kr/kWh)
                </Label>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  value={form.electricityPrice ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, electricityPrice: e.target.value })
                  }
                  onBlur={() =>
                    setForm((f) => {
                      const n = clampMin(parseNum(f.electricityPrice), 0.1);
                      return { ...f, electricityPrice: n === undefined ? "" : n };
                    })
                  }
                  className="h-10"
                />
              </div>

              {/* Systemkostnad */}
              <div>
                <Label htmlFor="system">Systemkostnad (kr)</Label>
                <Input
                  id="system"
                  type="text"
                  inputMode="numeric"
                  value={form.systemCost ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, systemCost: e.target.value })
                  }
                  onBlur={() =>
                    setForm((f) => {
                      const n = clampInt(parseNum(f.systemCost), 0);
                      return { ...f, systemCost: n === undefined ? "" : n };
                    })
                  }
                  className="h-10"
                />
              </div>

              {/* Bidrag */}
              <div>
                <Label htmlFor="grant">Bidrag (kr)</Label>
                <Input
                  id="grant"
                  type="text"
                  inputMode="numeric"
                  value={form.grant ?? ""}
                  onChange={(e) => setForm({ ...form, grant: e.target.value })}
                  onBlur={() =>
                    setForm((f) => {
                      const n = clampInt(parseNum(f.grant), 0);
                      return { ...f, grant: n === undefined ? "" : n };
                    })
                  }
                  className="h-10"
                />
              </div>

              {/* Varmvatten */}
              <div>
                <Label htmlFor="kwh">Varmvatten (kWh/person·år)</Label>
                <Input
                  id="kwh"
                  type="text"
                  inputMode="numeric"
                  value={form.kwhPerPerson ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, kwhPerPerson: e.target.value })
                  }
                  onBlur={() =>
                    setForm((f) => {
                      const n = clampInt(parseNum(f.kwhPerPerson), 500);
                      return { ...f, kwhPerPerson: n === undefined ? "" : n };
                    })
                  }
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="md:col-span-3 space-y-6">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Resultat</CardTitle>
            <CardDescription>Sammanställning baserad på dina uppgifter.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Årlig besparing" value={currency(derived.netAnnualSavings)} />
              <Stat
                label="Återbetalning"
                value={
                  isFinite(derived.paybackYears)
                    ? `${derived.paybackYears.toFixed(1)} år`
                    : "–"
                }
              />
              <Stat label="Uppstarts-kostnad" value={currency(derived.upfront)} />
              <Stat
                label="Besparing 10 år"
                value={`${Math.round(derived.tenYearRoi * 100)}%`}
              />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={derived.data}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => currency(value)}
                    labelFormatter={(l) => `År ${l}`}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--brand))"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground">
              Beräkningen är en uppskattning och ska ses som vägledning. Faktiska resultat
              påverkas av användning, klimat och energipriser.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/** ---------- Stat ---------- **/
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
        {unit && <span className="ml-1 text-base sm:text-lg">{unit}</span>}
      </p>
    </div>
  );
}
