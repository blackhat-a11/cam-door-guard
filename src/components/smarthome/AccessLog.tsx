import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logsToCsv, type DoorLog } from "@/lib/mqtt-config";

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" });
}

export function AccessLogTable({ logs, onClear }: { logs: DoorLog[]; onClear: () => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "close">("all");

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (filter === "all" || l.status === filter) &&
          l.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [logs, q, filter],
  );

  const exportCsv = () => {
    const blob = new Blob([logsToCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `riwayat-pintu-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const opened = logs.filter((l) => l.status === "open").length;
  const closed = logs.length - opened;

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-mono">Riwayat Aktivitas Pintu</p>
          <p className="mt-1 font-mono text-sm">
            <span className="text-success">{opened} terbuka</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-primary">{closed} tertutup</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari keterangan..."
            className="h-9 w-40 font-mono text-xs"
          />
          {(["all", "open", "close"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "secondary"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Semua" : f === "open" ? "Terbuka" : "Tertutup"}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={exportCsv}>
            Ekspor CSV
          </Button>
          <Button size="sm" variant="outline" onClick={onClear}>
            Hapus
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["#", "Keterangan", "Status", "Waktu", "Jarak", "LDR", "Pemicu", "Perangkat"].map(
                (h) => (
                  <th key={h} className="label-mono py-2 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada data. Riwayat muncul saat ESP32 mengirim event pintu.
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                    {filtered.length - i}
                  </td>
                  <td className="py-3 pr-4 font-medium">{l.name}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${
                        l.status === "open"
                          ? "bg-success/15 text-success"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {l.status === "open" ? "TERBUKA" : "TERTUTUP"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">{fmt(l.time)}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {l.distance != null ? `${Math.round(l.distance * 10) / 10} cm` : "—"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {l.ldr != null ? Math.round(l.ldr) : "—"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{l.method ?? "—"}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{l.device ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
