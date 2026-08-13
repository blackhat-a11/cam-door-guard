import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionPanel } from "@/components/smarthome/ConnectionPanel";
import { DoorPanel } from "@/components/smarthome/DoorPanel";
import { ServoPanel, DevicePanel } from "@/components/smarthome/ControlPanel";
import { AccessLogTable } from "@/components/smarthome/AccessLog";
import { TopicGuide } from "@/components/smarthome/TopicGuide";
import { TrafficMonitor } from "@/components/smarthome/TrafficMonitor";
import { SecurityPanel } from "@/components/smarthome/SecurityPanel";
import { DeviceMonitor } from "@/components/smarthome/DeviceMonitor";
import { CameraPanel } from "@/components/smarthome/CameraPanel";
import { FaceManager } from "@/components/smarthome/FaceManager";
import { StatsPanel } from "@/components/smarthome/StatsPanel";
import { useSmartHome } from "@/lib/use-smart-home";
import { saveSettings } from "@/lib/mqtt-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartHome Control — Panel IoT ESP32 & Face Door Lock" },
      {
        name: "description",
        content:
          "Panel kontrol IoT smart home berbasis MQTT: 3 servo, LED, buzzer, sensor infrared, kunci pintu pengenalan wajah ESP32-S3-CAM, riwayat akses, statistik, dan mode keamanan.",
      },
      { property: "og:title", content: "SmartHome Control — Panel IoT ESP32" },
      {
        property: "og:description",
        content:
          "Kontrol servo, LED, buzzer, dan pintu pengenalan wajah ESP32-S3-CAM lewat MQTT, dengan riwayat akses, statistik, dan mode keamanan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="label-mono">Memuat panel kontrol...</p>
      </main>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const sh = useSmartHome();
  const online = sh.conn === "online";

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono">Lomba IoT · Kendali Rumah Pintar</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            SmartHome <span className="text-primary">Control</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            ESP32 untuk 3 servo, LED, buzzer, dan infrared. ESP32-S3-CAM untuk kunci pintu
            pengenalan wajah beserta riwayat akses.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="panel px-4 py-3 text-right">
            <p className="label-mono">Pintu terbuka</p>
            <p className="font-mono text-3xl font-semibold text-primary">{sh.state.doorCount}×</p>
          </div>
          <div className="panel px-4 py-3 text-right">
            <p className="label-mono">Keamanan</p>
            <p
              className={`font-mono text-lg font-semibold ${
                sh.state.panic
                  ? "text-destructive"
                  : sh.state.armed
                    ? "text-warning"
                    : "text-muted-foreground"
              }`}
            >
              {sh.state.panic ? "PANIC" : sh.state.armed ? "ARMED" : "OFF"}
            </p>
          </div>
        </div>
      </header>

      <ConnectionPanel
        settings={sh.settings}
        conn={sh.conn}
        error={sh.error}
        onConnect={(s) => void sh.connect(s)}
        onDisconnect={sh.disconnect}
      />

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kamera">Kamera</TabsTrigger>
          <TabsTrigger value="wajah">Wajah</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          <TabsTrigger value="statistik">Statistik</TabsTrigger>
          <TabsTrigger value="topik">Topik MQTT</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <DoorPanel state={sh.state} online={online} onCommand={sh.doorCommand} />
              <SecurityPanel
                state={sh.state}
                online={online}
                onArm={sh.setArmed}
                onPanic={sh.triggerPanic}
              />
              <DevicePanel
                state={sh.state}
                online={online}
                onLed={sh.toggleLed}
                onBuzzer={sh.toggleBuzzer}
                onPublish={sh.publish}
              />
            </div>
            <div className="space-y-5">
              <ServoPanel state={sh.state} online={online} onServo={sh.setServo} />
              <DeviceMonitor state={sh.state} deviceOnline={sh.deviceOnline} />
              <TrafficMonitor traffic={sh.traffic} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kamera" className="mt-5 grid gap-5 lg:grid-cols-2">
          <CameraPanel
            cameraUrl={sh.settings.cameraUrl}
            online={online}
            onSave={(url) => {
              const next = { ...sh.settings, cameraUrl: url };
              saveSettings(next);
              sh.setSettings(next);
            }}
            onSnapshot={() => sh.publish("cam/snapshot", "1")}
          />
          <DeviceMonitor state={sh.state} deviceOnline={sh.deviceOnline} />
        </TabsContent>

        <TabsContent value="wajah" className="mt-5">
          <FaceManager
            faces={sh.faces}
            logs={sh.logs}
            online={online}
            onAdd={sh.addFace}
            onToggle={sh.toggleFace}
            onDelete={sh.deleteFace}
          />
        </TabsContent>

        <TabsContent value="riwayat" className="mt-5">
          <AccessLogTable logs={sh.logs} onClear={sh.clearLogs} />
        </TabsContent>

        <TabsContent value="statistik" className="mt-5">
          <StatsPanel stats={sh.stats} doorCount={sh.state.doorCount} />
        </TabsContent>

        <TabsContent value="topik" className="mt-5">
          <TopicGuide base={sh.settings.base} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
