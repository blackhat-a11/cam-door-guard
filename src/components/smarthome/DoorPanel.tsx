import { Button } from "@/components/ui/button";
import type { DeviceState } from "@/lib/use-smart-home";

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" });
}

function DoorAnimation({ open }: { open: boolean }) {
  return (
    <div className="relative mx-auto mt-5 h-40 w-56 [perspective:900px]">
      <div className="absolute inset-0 rounded-xl border border-border bg-secondary/30" />
      <div
        className={`absolute inset-2 overflow-hidden rounded-lg transition-colors duration-700 ${
          open ? "bg-success/15" : "bg-background/60"
        }`}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${open ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage:
              "linear-gradient(180deg, color-mix(in oklab, var(--color-success) 30%, transparent), transparent)",
          }}
        />
      </div>
      <div
        className="absolute top-2 bottom-2 left-2 w-[calc(50%-0.5rem)] origin-left rounded-l-lg border border-primary/40 bg-card transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `rotateY(${open ? -78 : 0}deg)` }}
      >
        <span className="absolute top-1/2 right-2 size-2 -translate-y-1/2 rounded-full bg-primary" />
      </div>
      <div
        className="absolute top-2 right-2 bottom-2 w-[calc(50%-0.5rem)] origin-right rounded-r-lg border border-primary/40 bg-card transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `rotateY(${open ? 78 : 0}deg)` }}
      >
        <span className="absolute top-1/2 left-2 size-2 -translate-y-1/2 rounded-full bg-primary" />
      </div>
    </div>
  );
}

export function DoorPanel({
  state,
  online,
  onCommand,
}: {
  state: DeviceState;
  online: boolean;
  onCommand: (cmd: "open" | "close") => void;
}) {
  const isOpen = state.door === "open";
  return (
    <div
      className={`panel animate-fade-up p-5 transition-shadow duration-700 ${isOpen ? "glow-success" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mono">Pintu Utama · ESP32</p>
          <h2
            key={state.door}
            className="animate-value-pop mt-1 text-2xl font-semibold tracking-tight"
          >
            {state.door === "unknown" ? "Status tidak diketahui" : isOpen ? "TERBUKA" : "TERTUTUP"}
          </h2>
        </div>
        <span
          className={`mt-1 size-4 rounded-full transition-colors ${
            isOpen
              ? "bg-success pulse-ring"
              : state.door === "closed"
                ? "bg-primary"
                : "bg-muted-foreground"
          }`}
          aria-hidden
        />
      </div>

      <DoorAnimation open={isOpen} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/50 p-3 transition-transform duration-300 hover:-translate-y-0.5">
          <p className="label-mono">Total buka pintu</p>
          <p
            key={state.doorCount}
            className="animate-value-pop font-mono text-3xl font-semibold text-primary"
          >
            {state.doorCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/50 p-3 transition-transform duration-300 hover:-translate-y-0.5">
          <p className="label-mono">Aktivitas terakhir</p>
          <p className="truncate text-lg font-semibold">{state.lastEvent ?? "—"}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{fmt(state.lastSeen)}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          className="flex-1 transition-transform hover:scale-[1.03] active:scale-95"
          disabled={!online}
          onClick={() => onCommand("open")}
        >
          Buka Pintu
        </Button>
        <Button
          variant="outline"
          className="flex-1 transition-transform hover:scale-[1.03] active:scale-95"
          disabled={!online}
          onClick={() => onCommand("close")}
        >
          Tutup Pintu
        </Button>
      </div>
    </div>
  );
}
