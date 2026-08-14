import type { DeviceState } from "@/lib/use-smart-home";

function fmtUptime(sec: number | null) {
  if (sec == null) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}j ${m}m`;
}

function Row({
  title,
  subtitle,
  online,
  health,
}: {
  title: string;
  subtitle: string;
  online: boolean;
  health: DeviceState["health"]["esp32"];
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`size-3 rounded-full ${online ? "bg-success pulse-ring" : "bg-muted-foreground"}`}
          />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="label-mono">{subtitle}</p>
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
  );
}

export function DeviceMonitor({
  state,
  deviceOnline,
}: {
  state: DeviceState;
  deviceOnline: { esp32: boolean; cam: boolean };
}) {
  return (
    <div className="panel space-y-3 p-5">
      <p className="label-mono">Monitor Perangkat</p>
      <Row
        title="ESP32 Utama"
        subtitle="3 servo · LED · buzzer · infrared"
        online={deviceOnline.esp32}
        health={state.health.esp32}
      />
      <Row
        title="ESP32-S3-CAM"
        subtitle="Face recognition · kunci pintu"
        online={deviceOnline.cam}
        health={state.health.cam}
      />
      <p className="font-mono text-[11px] text-muted-foreground">
        Kirim heartbeat tiap 10 detik ke topik <span className="text-primary">esp32/heartbeat</span>{" "}
        dan <span className="text-primary">cam/heartbeat</span>.
      </p>
    </div>
  );
}
