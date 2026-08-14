import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MqttClient } from "mqtt";
import { toast } from "sonner";
import {
  loadLogs,
  loadSettings,
  saveLogs,
  saveSettings,
  type AccessLog,
  type MqttSettings,
} from "./mqtt-config";

export type ConnState = "idle" | "connecting" | "online" | "offline" | "error";

export type DeviceHealth = {
  lastSeen: number | null;
  rssi: number | null;
  uptime: number | null;
  ip: string | null;
};

export type DeviceState = {
  door: "open" | "closed" | "unknown";
  doorCount: number;
  led: boolean;
  servo: [number, number, number];
  distance: number | null;
  distanceHistory: number[];
  ldr: number | null;
  ldrHistory: number[];
  lastEvent: string | null;
  lastSeen: string | null;
  health: { esp32: DeviceHealth };
};

const emptyHealth: DeviceHealth = { lastSeen: null, rssi: null, uptime: null, ip: null };

const initialState: DeviceState = {
  door: "unknown",
  doorCount: 0,
  led: false,
  servo: [90, 90, 90],
  distance: null,
  distanceHistory: [],
  ldr: null,
  ldrHistory: [],
  lastEvent: null,
  lastSeen: null,
  health: { esp32: { ...emptyHealth } },
};

const truthy = (v: string) => ["1", "on", "true", "open", "high"].includes(v.trim().toLowerCase());

function beep(pattern: "alert" | "ok" = "alert") {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = pattern === "alert" ? 880 : 520;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.31);
  } catch {
    /* audio optional */
  }
}

export function useSmartHome() {
  const [settings, setSettings] = useState<MqttSettings>(loadSettings);
  const [conn, setConn] = useState<ConnState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<DeviceState>(initialState);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [traffic, setTraffic] = useState<{ topic: string; payload: string; at: string }[]>([]);
  const [, setTick] = useState(0);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const pushLog = useCallback((log: AccessLog) => {
    setLogs((prev) => {
      const next = [log, ...prev].slice(0, 300);
      saveLogs(next);
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    saveLogs([]);
  }, []);

  const handleMessage = useCallback(
    (topic: string, payloadBuf: Uint8Array) => {
      const payload = new TextDecoder().decode(payloadBuf);
      const at = new Date().toISOString();
      setTraffic((prev) => [{ topic, payload: payload.slice(0, 300), at }, ...prev].slice(0, 80));

      const base = loadSettings().base.replace(/\/$/, "");
      const key = topic.startsWith(base + "/") ? topic.slice(base.length + 1) : topic;

      const servoMatch = key.match(/^servo\/([123])\/state$/);
      if (servoMatch) {
        const idx = Number(servoMatch[1]) - 1;
        const val = Number(payload);
        if (!Number.isNaN(val)) {
          setState((s) => {
            const servo = [...s.servo] as [number, number, number];
            servo[idx] = Math.max(0, Math.min(180, val));
            return { ...s, servo };
          });
        }
        return;
      }

      if (/^esp32\/(heartbeat|status)$/.test(key)) {
        let info: Record<string, unknown> = {};
        try {
          info = JSON.parse(payload) as Record<string, unknown>;
        } catch {
          info = {};
        }
        setState((s) => ({
          ...s,
          health: {
            esp32: {
              lastSeen: Date.now(),
              rssi: typeof info["rssi"] === "number" ? info["rssi"] : s.health.esp32.rssi,
              uptime: typeof info["uptime"] === "number" ? info["uptime"] : s.health.esp32.uptime,
              ip: info["ip"] ? String(info["ip"]) : s.health.esp32.ip,
            },
          },
        }));
        return;
      }

      switch (key) {
        case "led/state":
          setState((s) => ({ ...s, led: truthy(payload) }));
          return;
        case "sensor/ultrasonic":
        case "ultrasonic/state": {
          const v = Number(payload.replace(/[^0-9.\-]/g, ""));
          if (Number.isNaN(v)) return;
          setState((s) => ({
            ...s,
            distance: v,
            distanceHistory: [...s.distanceHistory, v].slice(-40),
          }));
          return;
        }
        case "sensor/ldr":
        case "ldr/state": {
          const v = Number(payload.replace(/[^0-9.\-]/g, ""));
          if (Number.isNaN(v)) return;
          setState((s) => ({ ...s, ldr: v, ldrHistory: [...s.ldrHistory, v].slice(-40) }));
          return;
        }
        case "door/state": {
          const open = truthy(payload);
          setState((s) => ({ ...s, door: open ? "open" : "closed" }));
          return;
        }
        case "door/count":
          if (!Number.isNaN(Number(payload))) {
            setState((s) => ({ ...s, doorCount: Number(payload) }));
          }
          return;
        case "door/event": {
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(payload) as Record<string, unknown>;
          } catch {
            parsed = { name: payload };
          }
          const name = String(parsed["name"] ?? parsed["event"] ?? "Aktivitas pintu");
          const statusRaw = String(parsed["status"] ?? parsed["state"] ?? "").toLowerCase();
          const status: AccessLog["status"] =
            statusRaw.includes("close") || statusRaw.includes("tutup") ? "denied" : "granted";
          const dist = parsed["distance"];
          pushLog({
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name,
            status,
            time: String(parsed["time"] ?? at),
            distance: typeof dist === "number" ? dist : null,
            device: parsed["device"] ? String(parsed["device"]) : "ESP32",
            method: parsed["method"] ? String(parsed["method"]) : "sensor",
            raw: payload.slice(0, 500),
          });
          setState((s) => ({
            ...s,
            lastEvent: name,
            lastSeen: at,
            doorCount: status === "granted" ? s.doorCount + 1 : s.doorCount,
            door: status === "granted" ? "open" : "closed",
          }));
          if (status === "granted") {
            beep("ok");
            toast.success(`Pintu terbuka · ${name}`);
          } else {
            toast.info(`Pintu tertutup · ${name}`);
          }
          return;
        }
        default:
          return;
      }
    },
    [pushLog],
  );

  const disconnect = useCallback(() => {
    clientRef.current?.end(true);
    clientRef.current = null;
    setConn("idle");
  }, []);

  const connect = useCallback(
    async (next?: MqttSettings) => {
      const cfg = next ?? settings;
      saveSettings(cfg);
      setSettings(cfg);
      setError(null);
      clientRef.current?.end(true);
      setConn("connecting");
      try {
        const mqtt = (await import("mqtt")).default;
        const client = mqtt.connect(cfg.url, {
          clientId: `smarthome-app-${Math.random().toString(16).slice(2, 10)}`,
          ...(cfg.username ? { username: cfg.username } : {}),
          ...(cfg.password ? { password: cfg.password } : {}),
          reconnectPeriod: 3000,
          connectTimeout: 8000,
          clean: true,
        });
        clientRef.current = client;
        client.on("connect", () => {
          setConn("online");
          setError(null);
          client.subscribe(`${cfg.base.replace(/\/$/, "")}/#`, { qos: 0 });
          toast.success("Terhubung ke broker MQTT");
        });
        client.on("reconnect", () => setConn("connecting"));
        client.on("close", () => setConn((c) => (c === "online" ? "offline" : c)));
        client.on("error", (e: Error) => {
          setConn("error");
          setError(e.message);
        });
        client.on("message", (topic: string, payload: Uint8Array) => handleMessage(topic, payload));
      } catch (e) {
        setConn("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [settings, handleMessage],
  );

  const publish = useCallback(
    (subTopic: string, payload: string) => {
      const client = clientRef.current;
      const topic = `${settings.base.replace(/\/$/, "")}/${subTopic}`;
      if (!client || conn !== "online") {
        toast.error("Belum terhubung ke broker MQTT");
        return false;
      }
      client.publish(topic, payload, { qos: 0 });
      setTraffic((prev) =>
        [{ topic: `→ ${topic}`, payload, at: new Date().toISOString() }, ...prev].slice(0, 80),
      );
      return true;
    },
    [settings.base, conn],
  );

  const setServo = useCallback(
    (index: 0 | 1 | 2, value: number) => {
      setState((s) => {
        const servo = [...s.servo] as [number, number, number];
        servo[index] = value;
        return { ...s, servo };
      });
      publish(`servo/${index + 1}/set`, String(value));
    },
    [publish],
  );

  const toggleLed = useCallback(
    (on: boolean) => {
      setState((s) => ({ ...s, led: on }));
      publish("led/set", on ? "1" : "0");
    },
    [publish],
  );

  const doorCommand = useCallback(
    (cmd: "open" | "close") => {
      publish("door/set", cmd);
      setState((s) => ({
        ...s,
        door: cmd === "open" ? "open" : "closed",
        doorCount: cmd === "open" ? s.doorCount + 1 : s.doorCount,
        lastEvent: cmd === "open" ? "Buka manual (aplikasi)" : "Tutup manual (aplikasi)",
        lastSeen: new Date().toISOString(),
      }));
      beep(cmd === "open" ? "ok" : "alert");
      pushLog({
        id: `${Date.now()}-manual`,
        name: cmd === "open" ? "Buka manual (aplikasi)" : "Tutup manual (aplikasi)",
        status: cmd === "open" ? "granted" : "denied",
        time: new Date().toISOString(),
        distance: null,
        device: "App",
        method: "manual",
      });
    },
    [publish, pushLog],
  );

  const stats = useMemo(() => {
    const granted = logs.filter((l) => l.status === "granted").length;
    const denied = logs.length - granted;
    const hourly = Array.from({ length: 24 }, () => 0);
    const byName = new Map<string, number>();
    for (const l of logs) {
      const d = new Date(l.time);
      if (!Number.isNaN(d.getTime())) hourly[d.getHours()] = (hourly[d.getHours()] ?? 0) + 1;
      if (l.status === "granted") byName.set(l.name, (byName.get(l.name) ?? 0) + 1);
    }
    const peak = hourly.indexOf(Math.max(...hourly));
    const today = logs.filter(
      (l) => new Date(l.time).toDateString() === new Date().toDateString(),
    ).length;
    return {
      granted,
      denied,
      total: logs.length,
      hourly,
      today,
      peakHour: logs.length ? peak : null,
      topVisitors: [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [logs]);

  const now = Date.now();
  const deviceOnline = {
    esp32: state.health.esp32.lastSeen != null && now - state.health.esp32.lastSeen < 30000,
  };

  useEffect(() => {
    return () => {
      clientRef.current?.end(true);
    };
  }, []);

  return {
    settings,
    setSettings,
    conn,
    error,
    state,
    logs,
    stats,
    traffic,
    deviceOnline,
    connect,
    disconnect,
    publish,
    setServo,
    toggleLed,
    doorCommand,
    clearLogs,
  };
}
