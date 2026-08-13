import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CameraPanel({
  cameraUrl,
  online,
  onSave,
  onSnapshot,
}: {
  cameraUrl: string;
  online: boolean;
  onSave: (url: string) => void;
  onSnapshot: () => void;
}) {
  const [url, setUrl] = useState(cameraUrl);
  const [nonce, setNonce] = useState(0);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono">Live Kamera · ESP32-S3-CAM</p>
        <Button size="sm" variant="secondary" onClick={() => setNonce((n) => n + 1)}>
          Muat ulang
        </Button>
      </div>

      <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border bg-secondary/40">
        {cameraUrl ? (
          <img
            key={nonce}
            src={cameraUrl}
            alt="Live stream ESP32-S3-CAM"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Isi URL stream MJPEG kamera, contoh{" "}
              <span className="font-mono text-primary">http://192.168.1.20:81/stream</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://192.168.1.20:81/stream"
          className="h-9 flex-1 font-mono text-xs"
        />
        <Button size="sm" onClick={() => onSave(url)}>
          Simpan
        </Button>
        <Button size="sm" variant="outline" disabled={!online} onClick={onSnapshot}>
          Minta Snapshot
        </Button>
      </div>
    </div>
  );
}
