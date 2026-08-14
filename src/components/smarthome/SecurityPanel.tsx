import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { DeviceState } from "@/lib/use-smart-home";

export function SecurityPanel({
  state,
  online,
  onArm,
  onPanic,
}: {
  state: DeviceState;
  online: boolean;
  onArm: (on: boolean) => void;
  onPanic: (on: boolean) => void;
}) {
  return (
    <div
      className={`panel p-5 ${state.panic ? "border-destructive/70 glow-primary" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mono">Mode Keamanan</p>
          <h3 className="mt-1 text-xl font-semibold">
            {state.panic ? "PANIC AKTIF" : state.armed ? "ARMED" : "DISARMED"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.armed
              ? "Alarm otomatis saat wajah asing atau gerakan infrared."
              : "Pemantauan pasif, alarm tidak otomatis."}
          </p>
        </div>
        <Switch checked={state.armed} disabled={!online} onCheckedChange={onArm} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant={state.panic ? "secondary" : "destructive"}
          disabled={!online}
          onClick={() => onPanic(!state.panic)}
          className={state.panic ? "" : "pulse-ring"}
        >
          {state.panic ? "Matikan Panic" : "Tombol Darurat"}
        </Button>
        <Button variant="outline" disabled={!online} onClick={() => onArm(!state.armed)}>
          {state.armed ? "Nonaktifkan" : "Aktifkan"} Keamanan
        </Button>
      </div>
    </div>
  );
}
