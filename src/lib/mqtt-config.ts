export type MqttSettings = {
  url: string;
  base: string;
  username: string;
  password: string;
  cameraUrl: string;
};

export const DEFAULT_SETTINGS: MqttSettings = {
  url: "wss://6f934067d9f749aea7b60ba9783820ec.s1.eu.hivemq.cloud:8884/mqtt",
  base: "smarthome",
  username: "",
  password: "",
  cameraUrl: "",
};

const SETTINGS_KEY = "sh.mqtt.settings";
const LOG_KEY = "sh.access.logs";
const FACE_KEY = "sh.faces";

export type AccessLog = {
  id: string;
  name: string;
  status: "granted" | "denied";
  time: string;
  confidence?: number | null;
  device?: string | null;
  method?: string | null;
  image?: string | null;
  raw?: string;
};

export type FaceProfile = {
  id: string;
  name: string;
  role: string;
  slot: number;
  note?: string;
  createdAt: string;
  active: boolean;
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

export function loadLogs(): AccessLog[] {
  return read<AccessLog[]>(LOG_KEY, []);
}

export function saveLogs(logs: AccessLog[]) {
  window.localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 300)));
}

export function loadFaces(): FaceProfile[] {
  return read<FaceProfile[]>(FACE_KEY, []);
}

export function saveFaces(faces: FaceProfile[]) {
  window.localStorage.setItem(FACE_KEY, JSON.stringify(faces));
}

export function logsToCsv(logs: AccessLog[]) {
  const head = ["no", "nama", "status", "waktu", "akurasi", "metode", "perangkat"];
  const rows = logs.map((l, i) => [
    String(logs.length - i),
    l.name,
    l.status === "granted" ? "DIBUKA" : "DITOLAK",
    l.time,
    l.confidence != null ? String(l.confidence) : "",
    l.method ?? "",
    l.device ?? "",
  ]);
  return [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
