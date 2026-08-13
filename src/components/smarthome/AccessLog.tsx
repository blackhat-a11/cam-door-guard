import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccessLog } from "@/lib/mqtt-config";

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" });
}

export function AccessLogTable({
  logs,
  onClear,
}: {
  logs: AccessLog[];
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "granted" | "denied">("all");

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (filter === "all" || l.status === filter) &&
          l.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [logs, q, filter],
  );

  const granted = logs.filter((l) => l.status === "granted").length;
  const denied = logs.length - granted;

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-mono">Riwayat Akses Pintu</p>
          <p className="mt-1 font-mono text-sm">
            <span className="text-success">{granted} diterima</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-destructive">{denied} ditolak</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama..."
            className="h-9 w-40 font-mono text-xs"
          />
          {(["all", "granted", "denied"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "secondary"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Semua" : f === "granted" ? "Dikenal" : "Ditolak"}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={onClear}>
            Hapus
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["#", "Nama", "Status", "Waktu", "Akurasi", "Metode", "Perangkat"].map((h) => (
                <th key={h} className="label-mono py-2 pr-4 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada data. Riwayat muncul saat ESP32-S3-CAM mengirim event wajah.
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                    {filtered.length - i}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {l.image ? (
                        <img
                          src={l.image}
                          alt={`Snapshot ${l.name}`}
                          className="size-8 rounded-md object-cover"
                        />
                      ) : null}
                      <span className="font-medium">{l.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${
                        l.status === "granted"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {l.status === "granted" ? "DIBUKA" : "DITOLAK"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">{fmt(l.time)}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {l.confidence != null ? `${Math.round(l.confidence * 100) / 100}` : "—"}
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
