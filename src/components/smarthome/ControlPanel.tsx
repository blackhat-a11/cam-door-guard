import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { DeviceState } from "@/lib/use-smart-home";

const SERVO_LABELS = ["Servo 1 · Pintu Garasi", "Servo 2 · Pintu Daun Kiri", "Servo 3 · Pintu Daun Kanan"];

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
    <div className="panel animate-fade-up p-5">
      <p className="label-mono">Kontrol Servo · ESP32</p>
      <div className="mt-4 space-y-6">
        {state.servo.map((val, i) => (
          <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{SERVO_LABELS[i]}</span>
              <span key={val} className="animate-value-pop font-mono text-sm text-primary">
                {val}°
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="relative grid size-14 shrink-0 place-items-center rounded-full border border-border bg-secondary/50">
                <span
                  className="absolute h-1 w-6 origin-left rounded-full bg-primary transition-transform duration-500 ease-out"
                  style={{ left: "50%", transform: `rotate(${val - 90}deg)` }}
                />
                <span className="size-2 rounded-full bg-primary" />
              </div>
              <Slider
                className="flex-1"
                value={[val]}
                min={0}
                max={180}
                step={1}
                disabled={!online}
                onValueChange={(v) => onServo(i as 0 | 1 | 2, v[0] ?? 0)}
              />
            </div>

            <div className="mt-2 flex gap-2">
              {[0, 90, 180].map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant="secondary"
                  disabled={!online}
                  className="transition-transform hover:scale-105 active:scale-95"
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
    <div className="panel animate-fade-up space-y-4 p-5">
      <p className="label-mono">Perangkat · ESP32</p>

      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-4 transition-transform duration-300 hover:-translate-y-0.5">
        <div className="flex items-center gap-3">
          <span
            className={`size-3 rounded-full transition-all duration-500 ${
              state.led ? "bg-warning glow-primary animate-glow-pulse" : "bg-muted-foreground"
            }`}
          />
          <div>
            <p className="text-sm font-medium">LED</p>
            <p className="label-mono">{state.led ? "Menyala" : "Mati"}</p>
          </div>
        </div>
        <Switch checked={state.led} disabled={!online} onCheckedChange={onLed} />
      </div>

      <p className="font-mono text-[11px] text-muted-foreground">
        Sensor ultrasonic dan LDR tampil di tab <span className="text-primary">Sensor</span>.
      </p>
    </div>
  );
}
