type Stats = {
  granted: number;
  denied: number;
  total: number;
  today: number;
  hourly: number[];
  peakHour: number | null;
  topVisitors: [string, number][];
};

function Card({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="panel p-4">
      <p className="label-mono">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-semibold ${tone ?? "text-foreground"}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StatsPanel({ stats, doorCount }: { stats: Stats; doorCount: number }) {
  const max = Math.max(1, ...stats.hourly);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total buka pintu" value={`${doorCount}×`} tone="text-primary" />
        <Card label="Akses diterima" value={String(stats.granted)} tone="text-success" />
        <Card label="Akses ditolak" value={String(stats.denied)} tone="text-destructive" />
        <Card
          label="Aktivitas hari ini"
          value={String(stats.today)}
          hint={stats.peakHour != null ? `Jam tersibuk: ${String(stats.peakHour).padStart(2, "0")}:00` : undefined}
        />
      </div>

      <div className="panel p-5">
        <p className="label-mono">Distribusi Akses per Jam</p>
        <div className="mt-5 flex h-40 items-end gap-1">
          {stats.hourly.map((v, h) => (
            <div key={h} className="group flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                {v}
              </span>
              <div
                className="w-full rounded-t bg-primary/70 transition-all group-hover:bg-primary"
                style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? "4px" : "2px" }}
              />
              <span className="font-mono text-[9px] text-muted-foreground">
                {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <p className="label-mono">Paling Sering Masuk</p>
        {stats.topVisitors.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data akses.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {stats.topVisitors.map(([name, count]) => (
              <div key={name}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="font-mono text-xs text-primary">{count}×</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(count / (stats.topVisitors[0]?.[1] ?? 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
