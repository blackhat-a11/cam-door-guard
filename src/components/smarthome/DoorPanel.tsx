import { Button } from "@/components/ui/button";
import type { DeviceState } from "@/lib/use-smart-home";

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" });
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
          <p className="label-mono">Pintu Utama · ESP32-S3-CAM</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {state.door === "unknown" ? "Status tidak diketahui" : isOpen ? "TERBUKA" : "TERKUNCI"}
          </h2>
        </div>
        <span
          className={`mt-1 size-4 rounded-full ${
            isOpen ? "bg-success pulse-ring" : state.door === "closed" ? "bg-primary" : "bg-muted-foreground"
          }`}
          aria-hidden
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/50 p-3">
          <p className="label-mono">Total buka pintu</p>
          <p className="font-mono text-3xl font-semibold text-primary">{state.doorCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/50 p-3">
          <p className="label-mono">Wajah terakhir</p>
          <p className="truncate text-lg font-semibold">{state.lastFace ?? "—"}</p>
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
          Kunci
        </Button>
      </div>
    </div>
  );
}
