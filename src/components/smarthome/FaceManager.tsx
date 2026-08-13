import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AccessLog, FaceProfile } from "@/lib/mqtt-config";

export function FaceManager({
  faces,
  logs,
  online,
  onAdd,
  onToggle,
  onDelete,
}: {
  faces: FaceProfile[];
  logs: AccessLog[];
  online: boolean;
  onAdd: (v: { name: string; role: string; note?: string }) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Penghuni");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), role: role.trim() || "Penghuni", note: note.trim() });
    setName("");
    setNote("");
  };

  const countFor = (n: string) =>
    logs.filter((l) => l.status === "granted" && l.name.toLowerCase() === n.toLowerCase()).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <div className="panel h-fit p-5">
        <p className="label-mono">Tambah Wajah Baru</p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="label-mono">Nama</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rizky Firdaus" />
          </div>
          <div className="space-y-1.5">
            <Label className="label-mono">Peran</Label>
            <div className="flex flex-wrap gap-2">
              {["Penghuni", "Keluarga", "Tamu", "Admin"].map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={role === r ? "default" : "secondary"}
                  onClick={() => setRole(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="label-mono">Catatan (opsional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. akses jam kerja" />
          </div>
          <Button className="w-full" disabled={!online || !name.trim()} onClick={submit}>
            Daftarkan Wajah
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Aplikasi mengirim perintah enroll ke ESP32-S3-CAM lewat topik{" "}
            <span className="font-mono text-primary">face/enroll</span>. Arahkan wajah ke kamera
            setelah menekan tombol.
          </p>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-baseline justify-between">
          <p className="label-mono">Wajah Terdaftar</p>
          <span className="font-mono text-xs text-muted-foreground">{faces.length} orang</span>
        </div>

        {faces.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Belum ada wajah terdaftar.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {faces.map((f) => (
              <div key={f.id} className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/15 font-mono text-sm text-primary">
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="label-mono">
                        {f.role} · slot {f.slot}
                      </p>
                    </div>
                  </div>
                  <Switch checked={f.active} onCheckedChange={() => onToggle(f.id)} />
                </div>
                {f.note ? (
                  <p className="mt-2 text-xs text-muted-foreground">{f.note}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {countFor(f.name)}× masuk
                  </span>
                  <Button size="sm" variant="outline" onClick={() => onDelete(f.id)}>
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
