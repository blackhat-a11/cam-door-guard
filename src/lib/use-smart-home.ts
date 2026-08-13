import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MqttClient } from "mqtt";
import { toast } from "sonner";
import {
  loadFaces,
  loadLogs,
  loadSettings,
  saveFaces,
  saveLogs,
  saveSettings,
  type AccessLog,
  type FaceProfile,
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
  buzzer: boolean;
  ir: boolean;
  servo: [number, number, number];
  lastFace: string | null;
  lastSeen: string | null;
  armed: boolean;
  panic: boolean;
  health: { esp32: DeviceHealth; cam: DeviceHealth };
};

const emptyHealth: DeviceHealth = { lastSeen: null, rssi: null, uptime: null, ip: null };

const initialState: DeviceState = {
  door: "unknown",
  doorCount: 0,
  led: false,
  buzzer: false,
  ir: false,
  servo: [90, 90, 90],
  lastFace: null,
  lastSeen: null,
  armed: false,
  panic: false,
  health: { esp32: { ...emptyHealth }, cam: { ...emptyHealth } },
};

const truthy = (v: string) =>
  ["1", "on", "true", "open", "armed", "high"].includes(v.trim().toLowerCase());

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
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
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
  const [faces, setFaces] = useState<FaceProfile[]>([]);
  const [traffic, setTraffic] = useState<{ topic: string; payload: string; at: string }[]>([]);
  const [, setTick] = useState(0);
  const clientRef = useRef<MqttClient | null>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    setLogs(loadLogs());
    setFaces(loadFaces());
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

      const hbMatch = key.match(/^(esp32|cam)\/(heartbeat|status)$/);
      if (hbMatch) {
        const dev = hbMatch[1] as "esp32" | "cam";
        let info: Record<string, unknown> = {};
        try {
          info = JSON.parse(payload) as Record<string, unknown>;
        } catch {
          info = {};
        }
        setState((s) => ({
          ...s,
          health: {
            ...s.health,
            [dev]: {
              lastSeen: Date.now(),
              rssi: typeof info["rssi"] === "number" ? info["rssi"] : s.health[dev].rssi,
              uptime: typeof info["uptime"] === "number" ? info["uptime"] : s.health[dev].uptime,
              ip: info["ip"] ? String(info["ip"]) : s.health[dev].ip,
            },
          },
        }));
        return;
      }

      switch (key) {
        case "led/state":
          setState((s) => ({ ...s, led: truthy(payload) }));
          return;
        case "buzzer/state":
          setState((s) => ({ ...s, buzzer: truthy(payload) }));
          return;
        case "sensor/ir":
        case "ir/state": {
          const on = truthy(payload);
          setState((s) => ({ ...s, ir: on }));
          if (on && armedRef.current) {
            beep("alert");
            toast.warning("Gerakan terdeteksi sensor infrared", {
              description: "Mode keamanan aktif — periksa area pintu.",
            });
          }
          return;
        }
        case "door/state":
          setState((s) => ({ ...s, door: truthy(payload) ? "open" : "closed" }));
          return;
        case "door/count":
          if (!Number.isNaN(Number(payload))) {
            setState((s) => ({ ...s, doorCount: Number(payload) }));
          }
          return;
        case "security/state":
          setState((s) => ({ ...s, armed: truthy(payload) }));
          armedRef.current = truthy(payload);
          return;
        case "door/event":
        case "face/event": {
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(payload) as Record<string, unknown>;
          } catch {
            parsed = { name: payload };
          }
          const name = String(parsed["name"] ?? parsed["user"] ?? "Tidak dikenal");
          const statusRaw = String(parsed["status"] ?? parsed["access"] ?? "").toLowerCase();
          const known = parsed["known"];
          const status: AccessLog["status"] =
            statusRaw.includes("grant") ||
            statusRaw.includes("izin") ||
            statusRaw === "ok" ||
            known === true
              ? "granted"
              : statusRaw.includes("den") || statusRaw.includes("tolak") || known === false
                ? "denied"
                : name.toLowerCase().includes("unknown") ||
                    name.toLowerCase().includes("tidak dikenal")
                  ? "denied"
                  : "granted";
          const conf = parsed["confidence"];
          pushLog({
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name,
            status,
            time: String(parsed["time"] ?? at),
            confidence: typeof conf === "number" ? conf : null,
            device: parsed["device"] ? String(parsed["device"]) : "ESP32-S3-CAM",
            method: parsed["method"] ? String(parsed["method"]) : "face",
            image: parsed["image"] ? String(parsed["image"]) : null,
            raw: payload.slice(0, 500),
          });
          setState((s) => ({
            ...s,
            lastFace: name,
            lastSeen: at,
            doorCount: status === "granted" ? s.doorCount + 1 : s.doorCount,
            door: status === "granted" ? "open" : s.door,
          }));
          if (status === "granted") {
            beep("ok");
            toast.success(`Pintu dibuka untuk ${name}`);
          } else {
            beep("alert");
            toast.error("Wajah tidak dikenal — akses ditolak", {
              description: "Pintu tetap terkunci.",
            });
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

  const toggleBuzzer = useCallback(
    (on: boolean) => {
      setState((s) => ({ ...s, buzzer: on }));
      publish("buzzer/set", on ? "1" : "0");
    },
    [publish],
  );

  const setArmed = useCallback(
    (on: boolean) => {
      setState((s) => ({ ...s, armed: on }));
      armedRef.current = on;
      publish("security/set", on ? "armed" : "disarmed");
      toast[on ? "warning" : "success"](
        on ? "Mode keamanan AKTIF" : "Mode keamanan dimatikan",
      );
    },
    [publish],
  );

  const triggerPanic = useCallback(
    (on: boolean) => {
      setState((s) => ({ ...s, panic: on, buzzer: on ? true : s.buzzer }));
      publish("security/panic", on ? "1" : "0");
      if (on) {
        beep("alert");
        toast.error("PANIC MODE aktif — alarm dibunyikan!");
        pushLog({
          id: `${Date.now()}-panic`,
          name: "Tombol darurat ditekan",
          status: "denied",
          time: new Date().toISOString(),
          confidence: null,
          device: "App",
          method: "panic",
        });
      } else {
        toast.success("Panic mode dimatikan");
      }
    },
    [publish, pushLog],
  );

  const doorCommand = useCallback(
    (cmd: "open" | "close") => {
      publish("door/set", cmd);
      setState((s) => ({
        ...s,
        door: cmd === "open" ? "open" : "closed",
        doorCount: cmd === "open" ? s.doorCount + 1 : s.doorCount,
      }));
      if (cmd === "open") {
        pushLog({
          id: `${Date.now()}-manual`,
          name: "Buka manual (aplikasi)",
          status: "granted",
          time: new Date().toISOString(),
          confidence: null,
          device: "App",
          method: "manual",
        });
      }
    },
    [publish, pushLog],
  );

  const addFace = useCallback(
    (input: { name: string; role: string; note?: string }) => {
      setFaces((prev) => {
        const slot = prev.length ? Math.max(...prev.map((f) => f.slot)) + 1 : 1;
        const face: FaceProfile = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
          name: input.name,
          role: input.role,
          ...(input.note ? { note: input.note } : {}),
          slot,
          createdAt: new Date().toISOString(),
          active: true,
        };
        const next = [...prev, face];
        saveFaces(next);
        publish("face/enroll", JSON.stringify({ slot, name: face.name }));
        toast.success(`Perintah daftar wajah "${face.name}" dikirim (slot ${slot})`, {
          description: "Arahkan wajah ke ESP32-S3-CAM sampai LED konfirmasi.",
        });
        return next;
      });
    },
    [publish],
  );

  const toggleFace = useCallback(
    (id: string) => {
      setFaces((prev) => {
        const next = prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
        saveFaces(next);
        const f = next.find((x) => x.id === id);
        if (f) publish("face/active", JSON.stringify({ slot: f.slot, active: f.active }));
        return next;
      });
    },
    [publish],
  );

  const deleteFace = useCallback(
    (id: string) => {
      setFaces((prev) => {
        const f = prev.find((x) => x.id === id);
        const next = prev.filter((x) => x.id !== id);
        saveFaces(next);
        if (f) {
          publish("face/delete", JSON.stringify({ slot: f.slot, name: f.name }));
          toast.success(`Wajah "${f.name}" dihapus`);
        }
        return next;
      });
    },
    [publish],
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
    cam: state.health.cam.lastSeen != null && now - state.health.cam.lastSeen < 30000,
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
    faces,
    stats,
    traffic,
    deviceOnline,
    connect,
    disconnect,
    publish,
    setServo,
    toggleLed,
    toggleBuzzer,
    setArmed,
    triggerPanic,
    doorCommand,
    addFace,
    toggleFace,
    deleteFace,
    clearLogs,
  };
}
