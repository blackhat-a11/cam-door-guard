export type MqttSettings = {
  url: string;
  base: string;
  username: string;
  password: string;
};

export const DEFAULT_SETTINGS: MqttSettings = {
  url: "wss://6f934067d9f749aea7b60ba9783820ec.s1.eu.hivemq.cloud:8884/mqtt",
  base: "smarthome",
  username: "",
  password: "",
};

const SETTINGS_KEY = "sh.mqtt.settings";
const LOG_KEY = "sh.access.logs";

export type DoorLog = {
  id: string;
  name: string;
  status: "open" | "close";
  time: string;
  distance?: number | null;
  ldr?: number | null;
  device?: string | null;
  method?: string | null;
  raw?: string;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

// URL broker lama yang otomatis diganti ke default baru (HiveMQ Cloud)
const LEGACY_URLS = ["wss://broker.emqx.io:8084/mqtt", "ws://broker.emqx.io:8083/mqtt"];

export function loadSettings(): MqttSettings {
  const saved = read<Partial<MqttSettings>>(SETTINGS_KEY, {});
  if (saved.url && LEGACY_URLS.includes(saved.url)) delete saved.url;
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(s: MqttSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadLogs(): DoorLog[] {
  return read<DoorLog[]>(LOG_KEY, []);
}

export function saveLogs(logs: DoorLog[]) {
  window.localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 300)));
}

export function logsToCsv(logs: DoorLog[]) {
  const head = ["no", "keterangan", "status", "waktu", "jarak_cm", "ldr", "metode", "perangkat"];
  const rows = logs.map((l, i) => [
    String(logs.length - i),
    l.name,
    l.status === "open" ? "TERBUKA" : "TERTUTUP",
    l.time,
    l.distance != null ? String(l.distance) : "",
    l.ldr != null ? String(l.ldr) : "",
    l.method ?? "",
    l.device ?? "",
  ]);
  return [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
