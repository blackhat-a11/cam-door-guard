export type MqttSettings = {
  url: string;
  base: string;
  username: string;
  password: string;
};

export const DEFAULT_SETTINGS: MqttSettings = {
  url: "wss://broker.emqx.io:8084/mqtt",
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
  confidence?: number | null;
  device?: string | null;
  method?: string | null;
  image?: string | null;
  raw?: string;
};

export function loadSettings(): MqttSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const v = window.localStorage.getItem(SETTINGS_KEY);
    return v ? { ...DEFAULT_SETTINGS, ...JSON.parse(v) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: MqttSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadLogs(): AccessLog[] {
  if (typeof window === "undefined") return [];
  try {
    const v = window.localStorage.getItem(LOG_KEY);
    return v ? (JSON.parse(v) as AccessLog[]) : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs: AccessLog[]) {
  window.localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 300)));
}
