import type { DeviceState } from "@/lib/use-smart-home";

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className="mt-4 flex h-16 items-end gap-[3px]">
      {(data.length ? data : Array.from({ length: 24 }, () => 0)).slice(-24).map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t ${tone} animate-bar-rise transition-all duration-500`}
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function UltrasonicPanel({ state }: { state: DeviceState }) {
  const d = state.distance;
  const near = d != null && d <= 20;
  const pct = d == null ? 0 : Math.max(0, Math.min(100, 100 - (d / 200) * 100));

  return (
    <div className="panel overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <p className="label-mono">Sensor Ultrasonic · HC-SR04</p>
        <span
          className={`font-mono text-[11px] ${near ? "text-warning" : "text-muted-foreground"}`}
        >
          {d == null ? "MENUNGGU DATA" : near ? "OBJEK DEKAT" : "AMAN"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative grid size-24 shrink-0 place-items-center">
          <span className="absolute inset-0 rounded-full border border-primary/30 animate-sonar" />
          <span
            className="absolute inset-0 rounded-full border border-primary/30 animate-sonar"
            style={{ animationDelay: "0.6s" }}
          />
          <span
            className="absolute inset-0 rounded-full border border-primary/30 animate-sonar"
            style={{ animationDelay: "1.2s" }}
          />
          <span
            className={`size-8 rounded-full ${near ? "bg-warning" : "bg-primary"} glow-primary transition-colors`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            key={d ?? "none"}
            className={`animate-value-pop font-mono text-4xl font-semibold ${near ? "text-warning" : "text-primary"}`}
          >
            {d == null ? "—" : d.toFixed(1)}
            <span className="ml-1 text-base text-muted-foreground">cm</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${near ? "bg-warning" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Jarak objek di depan pintu · skala 0–200 cm
          </p>
        </div>
      </div>

      <Spark data={state.distanceHistory} tone="bg-primary/60" />
    </div>
  );
}

export function LdrPanel({ state }: { state: DeviceState }) {
  const v = state.ldr;
  const pct = v == null ? 0 : Math.max(0, Math.min(100, (v / 4095) * 100));
  const dark = v != null && pct < 35;

  return (
    <div className="panel overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <p className="label-mono">Sensor Cahaya · LDR</p>
        <span className={`font-mono text-[11px] ${dark ? "text-primary" : "text-warning"}`}>
          {v == null ? "MENUNGGU DATA" : dark ? "GELAP" : "TERANG"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative grid size-24 shrink-0 place-items-center">
          <span
            className={`absolute size-20 rounded-full transition-all duration-700 ${dark ? "bg-primary/10" : "bg-warning/20 animate-glow-pulse"}`}
          />
          <span
            className={`size-10 rounded-full transition-all duration-700 ${dark ? "bg-muted-foreground/50" : "bg-warning glow-primary"}`}
            style={{ transform: `scale(${0.7 + (pct / 100) * 0.6})` }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            key={v ?? "none"}
            className={`animate-value-pop font-mono text-4xl font-semibold ${dark ? "text-primary" : "text-warning"}`}
          >
            {v == null ? "—" : Math.round(v)}
            <span className="ml-1 text-base text-muted-foreground">adc</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-warning transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Intensitas cahaya {Math.round(pct)}% · nilai mentah 0–4095
          </p>
        </div>
      </div>

      <Spark data={state.ldrHistory} tone="bg-warning/60" />
    </div>
  );
}
