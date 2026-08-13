const PUBLISH_TOPICS: [string, string, string][] = [
  ["servo/1/set", "0 - 180", "App -> ESP32: posisi servo 1"],
  ["servo/2/set", "0 - 180", "App -> ESP32: posisi servo 2"],
  ["servo/3/set", "0 - 180", "App -> ESP32: posisi servo 3"],
  ["led/set", "1 / 0", "App -> ESP32: nyalakan / matikan LED"],
  ["buzzer/set", "1 / 0", "App -> ESP32: buzzer on / off"],
  ["buzzer/beep", "1", "App -> ESP32: bunyi singkat"],
  ["door/set", "open / close", "App -> ESP32-CAM: buka / kunci pintu"],
  ["security/set", "armed / disarmed", "App -> ESP32: mode keamanan"],
  ["security/panic", "1 / 0", "App -> ESP32: tombol darurat, alarm penuh"],
  ["face/enroll", '{"slot":1,"name":"Rizky"}', "App -> ESP32-CAM: daftarkan wajah baru"],
  ["face/delete", '{"slot":1}', "App -> ESP32-CAM: hapus wajah"],
  ["face/active", '{"slot":1,"active":false}', "App -> ESP32-CAM: aktif / nonaktifkan wajah"],
  ["cam/snapshot", "1", "App -> ESP32-CAM: minta foto snapshot"],
];

const SUBSCRIBE_TOPICS: [string, string, string][] = [
  ["servo/1/state", "0 - 180", "ESP32 -> App: posisi servo aktual"],
  ["led/state", "1 / 0", "ESP32 -> App: status LED"],
  ["buzzer/state", "1 / 0", "ESP32 -> App: status buzzer"],
  ["sensor/ir", "1 / 0", "ESP32 -> App: sensor infrared"],
  ["door/state", "open / closed", "ESP32-CAM -> App: status pintu"],
  ["door/count", "angka", "ESP32-CAM -> App: total pintu terbuka"],
  [
    "door/event",
    '{"name":"Rizky","status":"granted","confidence":0.92,"time":"2026-08-13T12:00:00Z"}',
    "ESP32-CAM -> App: hasil pengenalan wajah (masuk ke riwayat)",
  ],
  ["security/state", "armed / disarmed", "ESP32 -> App: konfirmasi mode keamanan"],
  ["esp32/heartbeat", '{"rssi":-58,"uptime":1200,"ip":"192.168.1.10"}', "ESP32 -> App: status perangkat tiap 10 detik"],
  ["cam/heartbeat", '{"rssi":-61,"uptime":900,"ip":"192.168.1.20"}', "ESP32-CAM -> App: status perangkat tiap 10 detik"],
];

function Table({ rows, title }: { rows: [string, string, string][]; title: string }) {
  return (
    <div>
      <p className="label-mono">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map(([topic, payload, desc]) => (
          <div
            key={topic}
            className="rounded-xl border border-border bg-secondary/40 p-3 font-mono text-xs"
          >
            <p className="text-primary">{"{base}/" + topic}</p>
            <p className="mt-1 break-all text-foreground/80">payload: {payload}</p>
            <p className="mt-1 font-sans text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopicGuide({ base }: { base: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Kontrak Topik MQTT</h2>
        <span className="font-mono text-xs text-muted-foreground">base = {base}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Gunakan topik ini di kode Arduino kedua ESP32. Aplikasi subscribe ke{" "}
        <span className="font-mono text-primary">{base}/#</span>. Kirim state secara retained agar
        aplikasi langsung sinkron saat dibuka.
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Table title="Dikirim aplikasi (ESP32 subscribe)" rows={PUBLISH_TOPICS} />
        <Table title="Dikirim ESP32 (aplikasi subscribe)" rows={SUBSCRIBE_TOPICS} />
      </div>
    </div>
  );
}
