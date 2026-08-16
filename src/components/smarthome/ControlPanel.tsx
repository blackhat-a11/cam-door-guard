import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { DeviceState } from "@/lib/use-smart-home";

const SERVO_LABELS = ["Servo 1 · Pintu Garasi", "Servo 2 · Pintu (Kiri)", "Servo 3 · Pintu (Kanan)"];

export function ServoPanel({
  state,
  online,
  onServo,
}: {
  state: DeviceState;
  online: boolean;
  onServo: (i: 0 | 1 | 2, v: number) => void;
}) {
  return (
    <div className="panel p-5">
      <p className="label-mono">Kontrol Servo · ESP32</p>
      <div className="mt-4 space-y-6">
        {state.servo.map((val, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{SERVO_LABELS[i]}</span>
              <span className="font-mono text-sm text-primary">{val}°</span>
            </div>
            <Slider
              className="mt-3"
              value={[val]}
              min={0}
              max={180}
              step={1}
              disabled={!online}
              onValueChange={(v) => onServo(i as 0 | 1 | 2, v[0] ?? 0)}
            />
            <div className="mt-2 flex gap-2">
              {[0, 90, 180].map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant="secondary"
                  disabled={!online}
                  onClick={() => onServo(i as 0 | 1 | 2, preset)}
                >
                  {preset}°
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DevicePanel({
  state,
  online,
  onLed,
}: {
  state: DeviceState;
  online: boolean;
  onLed: (on: boolean) => void;
}) {
  return (
    <div className="panel space-y-4 p-5">
      <p className="label-mono">Perangkat · ESP32</p>

      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-4">
        <div className="flex items-center gap-3">
          <span
            className={`size-3 rounded-full transition-colors ${state.led ? "bg-warning glow-primary" : "bg-muted-foreground"}`}
          />
          <div>
            <p className="text-sm font-medium">LED</p>
            <p className="label-mono">{state.led ? "Menyala" : "Mati"}</p>
          </div>
        </div>
        <Switch checked={state.led} disabled={!online} onCheckedChange={onLed} />
      </div>
    </div>
  );
}
