import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ConnectionPanel } from "@/components/smarthome/ConnectionPanel";
import { DoorPanel } from "@/components/smarthome/DoorPanel";
import { GaragePanel } from "@/components/smarthome/GaragePanel";
import { ServoPanel, DevicePanel } from "@/components/smarthome/ControlPanel";
import { SensorPanel } from "@/components/smarthome/SensorPanel";
import { AccessLogTable } from "@/components/smarthome/AccessLog";
import { TopicGuide } from "@/components/smarthome/TopicGuide";
import { TrafficMonitor } from "@/components/smarthome/TrafficMonitor";
import { DeviceMonitor } from "@/components/smarthome/DeviceMonitor";
import { StatsPanel } from "@/components/smarthome/StatsPanel";
import { LoginGate, isLoggedIn, logout } from "@/components/smarthome/LoginGate";
import { useSmartHome } from "@/lib/use-smart-home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartHome Control — Panel IoT ESP32 Servo, Ultrasonic & LDR" },
      {
        name: "description",
        content:
          "Panel kontrol IoT smart home berbasis MQTT: 3 servo (garasi & pintu), LED, sensor ultrasonic dan LDR, animasi buka-tutup pintu, riwayat aktivitas, serta statistik.",
      },
      { property: "og:title", content: "SmartHome Control — Panel IoT ESP32" },
      {
        property: "og:description",
        content:
          "Kontrol servo garasi & pintu, LED, sensor ultrasonic dan LDR lewat MQTT, lengkap dengan riwayat aktivitas dan statistik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isLoggedIn());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="label-mono">Memuat panel kontrol...</p>
      </main>
    );
  }
  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;
  return (
    <Dashboard
      onLogout={() => {
        logout();
        setAuthed(false);
      }}
    />
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
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
            ESP32 untuk 3 servo (garasi &amp; pintu), LED, sensor ultrasonic, dan LDR — lengkap
            dengan riwayat aktivitas pintu.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="panel px-4 py-3 text-right">
            <p className="label-mono">Pintu terbuka</p>
            <p className="font-mono text-3xl font-semibold text-primary">{sh.state.doorCount}×</p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Keluar
          </Button>
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
          <TabsTrigger value="sensor">Sensor</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          <TabsTrigger value="statistik">Statistik</TabsTrigger>
          <TabsTrigger value="topik">Topik MQTT</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <DoorPanel state={sh.state} online={online} onCommand={sh.doorCommand} />
              <DevicePanel state={sh.state} online={online} onLed={sh.toggleLed} />
              <TrafficMonitor traffic={sh.traffic} />
            </div>
            <div className="space-y-5">
              <GaragePanel state={sh.state} online={online} onCommand={sh.garageCommand} />
              <ServoPanel state={sh.state} online={online} onServo={sh.setServo} />
              <DeviceMonitor state={sh.state} deviceOnline={sh.deviceOnline} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sensor" className="mt-5 grid gap-5 lg:grid-cols-2">
          <SensorPanel state={sh.state} />
          <DeviceMonitor state={sh.state} deviceOnline={sh.deviceOnline} />
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
