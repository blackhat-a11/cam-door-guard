import type { DeviceState } from "@/lib/use-smart-home";

function Gauge({
  label,
  value,
  unit,
  pct,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  pct: number;
  hint: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-baseline justify-between">
        <p className="label-mono">{label}</p>
        <p className={`font-mono text-2xl font-semibold ${tone}`}>
          {value}
          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone.replace("text-", "bg-")}`}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SensorPanel({ state }: { state: DeviceState }) {
  const dist = state.distance;
  const ldr = state.ldr;
  const near = dist != null && dist <= 30;
  const dark = ldr != null && ldr < 400;

  return (
    <div className="panel space-y-3 p-5">
      <p className="label-mono">Sensor · Ultrasonic &amp; LDR</p>
      <Gauge
        label="Jarak ultrasonic"
        value={dist != null ? String(Math.round(dist * 10) / 10) : "—"}
        unit="cm"
        pct={dist != null ? 100 - Math.min(100, (dist / 200) * 100) : 0}
        hint={dist == null ? "Menunggu data sensor" : near ? "Objek dekat pintu" : "Area kosong"}
        tone={near ? "text-warning" : "text-primary"}
      />
      <Gauge
        label="Cahaya (LDR)"
        value={ldr != null ? String(Math.round(ldr)) : "—"}
        unit=""
        pct={ldr != null ? Math.min(100, (ldr / 4095) * 100) : 0}
        hint={ldr == null ? "Menunggu data sensor" : dark ? "Kondisi gelap" : "Kondisi terang"}
        tone={dark ? "text-warning" : "text-success"}
      />
    </div>
  );
}
