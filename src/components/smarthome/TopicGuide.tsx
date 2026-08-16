const SUB = [
  ["servo/1/set", "0-180", "Posisi servo 1 (pintu garasi)"],
  ["servo/2/set", "0-180", "Posisi servo 2 (daun pintu kiri)"],
  ["servo/3/set", "0-180", "Posisi servo 3 (daun pintu kanan)"],
  ["led/set", "1 / 0", "Nyalakan / matikan LED"],
  ["door/set", "open / close", "Perintah buka atau tutup pintu"],
  ["garage/set", "open / close", "Perintah buka atau tutup garasi"],
];

const PUB = [
  ["servo/1/state", "0-180", "Posisi aktual servo (kirim balik dari ESP32)"],
  ["servo/2/state", "0-180", "Posisi aktual servo 2"],
  ["servo/3/state", "0-180", "Posisi aktual servo 3"],
  ["led/state", "1 / 0", "Status LED"],
  ["sensor/ultrasonic", "42.5", "Jarak sensor ultrasonic dalam cm"],
  ["sensor/ldr", "1850", "Nilai analog LDR (0-4095)"],
  ["door/state", "open / close", "Status pintu terkini"],
  ["door/count", "12", "Total pintu terbuka (opsional, dari ESP32)"],
  [
    "door/event",
    '{"status":"open","trigger":"ultrasonic","distance":25,"ldr":1200}',
    "Event pintu untuk riwayat & statistik",
  ],
  ["esp32/heartbeat", '{"rssi":-56,"uptime":1200,"ip":"192.168.1.20"}', "Heartbeat tiap 10 detik"],
];

function Table({ rows, base, title }: { rows: string[][]; base: string; title: string }) {
  const b = base.replace(/\/$/, "");
  return (
    <div className="panel p-5">
      <p className="label-mono">{title}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Topik", "Payload", "Keterangan"].map((h) => (
                <th key={h} className="label-mono py-2 pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([topic, payload, desc]) => (
              <tr key={topic} className="border-b border-border/60 last:border-0 align-top">
                <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap text-primary">
                  {b}/{topic}
                </td>
                <td className="py-3 pr-4 font-mono text-xs break-all text-muted-foreground">
                  {payload}
                </td>
                <td className="py-3 pr-4 text-xs">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TopicGuide({ base }: { base: string }) {
  return (
    <div className="space-y-5">
      <Table base={base} title="Aplikasi → ESP32 (subscribe di Arduino)" rows={SUB} />
      <Table base={base} title="ESP32 → Aplikasi (publish dari Arduino)" rows={PUB} />
      <div className="panel p-5">
        <p className="label-mono">Catatan</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            ESP32 cukup subscribe <span className="font-mono text-primary">{base}/#</span> lalu
            proses topik yang dikenal.
          </li>
          <li>
            Kirim <span className="font-mono text-primary">door/event</span> setiap kali pintu
            terbuka atau tertutup agar riwayat &amp; statistik terisi otomatis.
          </li>
          <li>Gunakan koneksi TLS (port 8883 di Arduino, 8884 WebSocket di browser).</li>
        </ul>
      </div>
    </div>
  );
}
