import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MqttSettings } from "@/lib/mqtt-config";
import type { ConnState } from "@/lib/use-smart-home";

const statusMap: Record<ConnState, { text: string; dot: string }> = {
  idle: { text: "Belum terhubung", dot: "bg-muted-foreground" },
  connecting: { text: "Menghubungkan...", dot: "bg-warning animate-pulse" },
  online: { text: "Terhubung", dot: "bg-success pulse-ring" },
  offline: { text: "Terputus", dot: "bg-destructive" },
  error: { text: "Gagal terhubung", dot: "bg-destructive" },
};

export function ConnectionPanel({
  settings,
  conn,
  error,
  onConnect,
  onDisconnect,
}: {
  settings: MqttSettings;
  conn: ConnState;
  error: string | null;
  onConnect: (s: MqttSettings) => void;
  onDisconnect: () => void;
}) {
  const [form, setForm] = useState<MqttSettings>(settings);
  const [open, setOpen] = useState(false);
  const status = statusMap[conn];

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${status.dot}`} aria-hidden />
          <div>
            <p className="label-mono">Broker MQTT</p>
            <p className="font-mono text-sm break-all text-foreground">{settings.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-xs">
            {status.text}
          </span>
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Tutup" : "Pengaturan"}
          </Button>
          {conn === "online" ? (
            <Button variant="destructive" size="sm" onClick={onDisconnect}>
              Putuskan
            </Button>
          ) : (
            <Button size="sm" onClick={() => onConnect(form)}>
              Hubungkan
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {open ? (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="label-mono">WebSocket URL</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="wss://xxx.s1.eu.hivemq.cloud:8884/mqtt"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-mono">Base Topic</Label>
            <Input
              value={form.base}
              onChange={(e) => setForm({ ...form, base: e.target.value })}
              placeholder="smarthome"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-mono">Username</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-mono">Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="font-mono text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <Button size="sm" onClick={() => onConnect(form)}>
              Simpan &amp; Hubungkan Ulang
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
