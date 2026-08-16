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
    <div className="relative mx-auto mt-5 h-44 w-full max-w-[240px] overflow-hidden rounded-xl border border-border bg-secondary/40">
      {/* lorong di balik pintu */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${open ? "opacity-100" : "opacity-0"}`}
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklch, var(--primary) 28%, transparent), transparent)",
        }}
      />
      {/* kusen */}
      <div className="absolute inset-4 rounded-lg border-2 border-border" />
      {/* daun pintu */}
      <div
        className="absolute inset-4 origin-left rounded-lg border-2 border-primary/60 bg-card shadow-lg transition-transform duration-700 ease-in-out"
        style={{
          transform: open ? "perspective(600px) rotateY(-72deg)" : "perspective(600px) rotateY(0deg)",
        }}
      >
        <span className="absolute top-1/2 right-3 size-2.5 -translate-y-1/2 rounded-full bg-primary" />
        <span className="absolute inset-x-4 top-5 h-10 rounded border border-border/70" />
        <span className="absolute inset-x-4 bottom-5 h-10 rounded border border-border/70" />
      </div>
      <span
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
          open ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
        }`}
      >
        {open ? "PINTU TERBUKA" : "PINTU TERTUTUP"}
      </span>
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
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mono">Pintu Utama · Servo 2 &amp; 3</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {state.door === "unknown" ? "Status tidak diketahui" : isOpen ? "TERBUKA" : "TERTUTUP"}
          </h2>
        </div>
        <span
          className={`mt-1 size-4 rounded-full ${
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
        <div className="rounded-xl border border-border bg-secondary/50 p-3">
          <p className="label-mono">Total buka pintu</p>
          <p className="font-mono text-3xl font-semibold text-primary">{state.doorCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/50 p-3">
          <p className="label-mono">Pemicu terakhir</p>
          <p className="truncate text-lg font-semibold">{state.lastTrigger ?? "—"}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{fmt(state.lastSeen)}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button className="flex-1" disabled={!online} onClick={() => onCommand("open")}>
          Buka Pintu
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!online}
          onClick={() => onCommand("close")}
        >
          Tutup Pintu
        </Button>
      </div>
    </div>
  );
}
