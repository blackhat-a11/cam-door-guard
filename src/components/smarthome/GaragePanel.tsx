import { Button } from "@/components/ui/button";
import type { DeviceState } from "@/lib/use-smart-home";

export function GaragePanel({
  state,
  online,
  onCommand,
}: {
  state: DeviceState;
  online: boolean;
  onCommand: (cmd: "open" | "close") => void;
}) {
  const open = state.servo[0] >= 90;
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mono">Pintu Garasi · Servo 1</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {open ? "TERBUKA" : "TERTUTUP"}
          </h2>
        </div>
        <span
          className={`mt-1 size-4 rounded-full ${open ? "bg-success pulse-ring" : "bg-primary"}`}
          aria-hidden
        />
      </div>

      <div className="relative mt-5 h-36 overflow-hidden rounded-xl border border-border bg-secondary/40">
        <div
          className="absolute inset-x-3 top-3 origin-top rounded-md border-2 border-primary/60 bg-card transition-transform duration-700 ease-in-out"
          style={{
            height: "calc(100% - 1.5rem)",
            transform: open ? "scaleY(0.12)" : "scaleY(1)",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute inset-x-2 h-4 rounded border border-border/70"
              style={{ top: `${8 + i * 22}%` }}
            />
          ))}
        </div>
        <span
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-mono text-[11px] ${
            open ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
          }`}
        >
          {open ? "GARASI TERBUKA" : "GARASI TERTUTUP"}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button className="flex-1" disabled={!online} onClick={() => onCommand("open")}>
          Buka Garasi
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!online}
          onClick={() => onCommand("close")}
        >
          Tutup Garasi
        </Button>
      </div>
    </div>
  );
}
