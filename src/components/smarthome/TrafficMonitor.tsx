export function TrafficMonitor({
  traffic,
}: {
  traffic: { topic: string; payload: string; at: string }[];
}) {
  return (
    <div className="panel p-5">
      <p className="label-mono">Monitor MQTT Realtime</p>
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto font-mono text-[11px]">
        {traffic.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">Menunggu pesan...</p>
        ) : (
          traffic.map((t, i) => (
            <div key={`${t.at}-${i}`} className="flex gap-2 border-b border-border/40 py-1.5">
              <span className="shrink-0 text-muted-foreground">
                {new Date(t.at).toLocaleTimeString("id-ID")}
              </span>
              <span className="shrink-0 text-primary">{t.topic}</span>
              <span className="truncate text-foreground/80">{t.payload}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
