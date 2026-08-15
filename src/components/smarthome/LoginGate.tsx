import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const USERNAME = "smarthome";
const PASSWORD = "smkn56jakarta";
const KEY = "sh.auth";

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function logout() {
  window.localStorage.removeItem(KEY);
}

export function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() === USERNAME && pass === PASSWORD) {
      window.localStorage.setItem(KEY, "1");
      onSuccess();
    } else {
      setErr(true);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 text-center">
          <p className="label-mono">Lomba IoT · SMKN 56 Jakarta</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            SmartHome <span className="text-primary">Control</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Masuk untuk mengakses panel kendali rumah pintar.
          </p>
        </div>

        <form onSubmit={submit} className="panel space-y-4 p-6">
          <div className="space-y-1.5">
            <Label className="label-mono">Username</Label>
            <Input
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                setErr(false);
              }}
              autoComplete="username"
              placeholder="smarthome"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-mono">Password</Label>
            <Input
              type="password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setErr(false);
              }}
              autoComplete="current-password"
              placeholder="••••••••"
              className="font-mono"
            />
          </div>
          {err ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              Username atau password salah.
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>
      </div>
    </main>
  );
}
