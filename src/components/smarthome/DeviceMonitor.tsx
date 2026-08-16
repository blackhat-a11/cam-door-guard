import type { DeviceState } from "@/lib/use-smart-home";

function fmtUptime(sec: number | null) {
  if (sec == null) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}j ${m}m`;
}

export function DeviceMonitor({
  state,
  deviceOnline,
}: {
  state: DeviceState;
  deviceOnline: { esp32: boolean };
}) {
  const health = state.health.esp32;
  const online = deviceOnline.esp32;

  return (
    <div className="panel space-y-3 p-5">
      <p className="label-mono">Monitor Perangkat</p>
      <div className="rounded-xl border border-border bg-secondary/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`size-3 rounded-full ${online ? "bg-success pulse-ring" : "bg-muted-foreground"}`}
            />
            <div>
              <p className="text-sm font-medium">ESP32 Utama</p>
              <p className="label-mono">3 servo · LED · ultrasonic · LDR</p>
            </div>
          </div>
          <span
            className={`font-mono text-[11px] ${online ? "text-success" : "text-muted-foreground"}`}
          >
            {online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
          <div>
            <p className="label-mono">RSSI</p>
            <p>{health.rssi != null ? `${health.rssi} dBm` : "—"}</p>
          </div>
          <div>
            <p className="label-mono">Uptime</p>
            <p>{fmtUptime(health.uptime)}</p>
          </div>
          <div>
            <p className="label-mono">IP</p>
            <p className="truncate">{health.ip ?? "—"}</p>
          </div>
        </div>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">
        Kirim heartbeat tiap 10 detik ke topik <span className="text-primary">esp32/heartbeat</span>
        .
      </p>
    </div>
  );
}
