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

export type AccessLog = {
  id: string;
  name: string;
  status: "granted" | "denied";
  time: string;
  distance?: number | null;
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

export function loadSettings(): MqttSettings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<MqttSettings>>(SETTINGS_KEY, {}) };
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

export function logsToCsv(logs: AccessLog[]) {
  const head = ["no", "kejadian", "status", "waktu", "jarak_cm", "metode", "perangkat"];
  const rows = logs.map((l, i) => [
    String(logs.length - i),
    l.name,
    l.status === "granted" ? "TERBUKA" : "TERTUTUP",
    l.time,
    l.distance != null ? String(l.distance) : "",
    l.method ?? "",
    l.device ?? "",
  ]);
  return [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

/* ---------------- Auth (login lokal panel) ---------------- */

const AUTH_KEY = "sh.auth.session";
const AUTH_USER = "smarthome";
const AUTH_PASS = "smkn56jakarta";

export function checkCredentials(username: string, password: string) {
  return username.trim() === AUTH_USER && password === AUTH_PASS;
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_KEY) === "1";
}

export function setLoggedIn(v: boolean) {
  if (v) window.localStorage.setItem(AUTH_KEY, "1");
  else window.localStorage.removeItem(AUTH_KEY);
}
