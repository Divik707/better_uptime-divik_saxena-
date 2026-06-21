"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Config ────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "UP" | "DOWN";

interface Region {
  id: string;
  name: string;
}

interface Tick {
  id: string;
  websiteId: string;
  regionId: string;
  region?: Region;
  responseTimeInMs: number;
  statusCode?: number | null;
  status: Status;
  createdAt: string;
}

interface Website {
  id: string;
  url: string;
  createdAt: string;
  userId: string;
  ticks: Tick[];
}

interface DetailData {
  websiteId: string;
  url: string;
  ticks: Tick[];
  latestTick: Tick | null;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  token: string,
  opts: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers ?? {}),
      },
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.message ?? "Request failed" };
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: "Cannot reach server. Is your API running?" };
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function avgResponseTime(ticks: Tick[]): number | null {
  if (!ticks.length) return null;
  return Math.round(ticks.reduce((s, t) => s + t.responseTimeInMs, 0) / ticks.length);
}

function uptimePct(ticks: Tick[]): string {
  if (!ticks.length) return "—";
  const up = ticks.filter((t) => t.status === "UP").length;
  return ((up / ticks.length) * 100).toFixed(1) + "%";
}

function latestStatus(w: Website): Status | null {
  return w.ticks[0]?.status ?? null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Status | null }) {
  if (!status)
    return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d1d5db", display: "inline-block" }} />;
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: status === "UP" ? "#22c55e" : "#ef4444",
        display: "inline-block",
        boxShadow: status === "UP" ? "0 0 0 3px #dcfce7" : "0 0 0 3px #fee2e2",
      }}
    />
  );
}

function Badge({ status }: { status: Status | null }) {
  if (!status) return <span style={badge("gray")}>—</span>;
  return <span style={badge(status === "UP" ? "green" : "red")}>{status}</span>;
}

function badge(color: "green" | "red" | "gray"): React.CSSProperties {
  const map = {
    green: { bg: "#dcfce7", text: "#15803d" },
    red: { bg: "#fee2e2", text: "#b91c1c" },
    gray: { bg: "#f3f4f6", text: "#6b7280" },
  };
  const { bg, text } = map[color];
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    background: bg,
    color: text,
    fontFamily: "monospace",
  };
}

interface ToastProps { message: string; type: "success" | "error"; }
function Toast({ message, type }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        padding: "10px 16px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 500,
        background: type === "success" ? "#166534" : "#991b1b",
        color: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: 340,
      }}
    >
      {type === "success" ? "✓" : "✕"} {message}
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────

interface AuthScreenProps {
  onAuth: (token: string, username: string) => void;
}

function AuthScreen({ onAuth }: AuthScreenProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function submit() {
    setError(""); setSuccess("");
    if (!username.trim() || !password) { setError("Both fields are required."); return; }
    setLoading(true);
    const path = tab === "login" ? "/login" : "/signup";
    const { data, error: err } = await apiFetch<{ token?: string; message?: string }>(
      path, "", { method: "POST", body: JSON.stringify({ username: username.trim(), password }) }
    );
    setLoading(false);
    if (err) { setError(err); return; }
    if (tab === "signup") {
      setSuccess("Account created — sign in now.");
      setTab("login");
      setPassword("");
      return;
    }
    if (data?.token) {
      localStorage.setItem("uptime_token", data.token);
      localStorage.setItem("uptime_username", username.trim());
      onAuth(data.token, username.trim());
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f9fafb",
      padding: "1rem",
    }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#111" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4" fill="#111" />
            <line x1="14" y1="1" x2="14" y2="7" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="21" x2="14" y2="27" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="27" y1="14" x2="21" y2="14" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="14" x2="1" y2="14" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#111" }}>
            Uptime
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Monitor your websites from anywhere</p>
      </div>

      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "2rem",
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", marginBottom: 24, borderBottom: "1px solid #f3f4f6" }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setSuccess(""); }}
              style={{
                flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 500,
                background: "none", border: "none", cursor: "pointer",
                color: tab === t ? "#111" : "#9ca3af",
                borderBottom: tab === t ? "2px solid #111" : "2px solid transparent",
                marginBottom: -1, transition: "all 0.15s",
              }}
            >
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            <span style={labelText}>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="your_username"
              autoComplete="username"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelText}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              style={inputStyle}
            />
          </label>
        </div>

        {error && <p style={{ fontSize: 13, color: "#b91c1c", marginTop: 12, marginBottom: 0 }}>{error}</p>}
        {success && <p style={{ fontSize: 13, color: "#15803d", marginTop: 12, marginBottom: 0 }}>{success}</p>}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%", marginTop: 20, padding: "10px 0", borderRadius: 10,
            background: "#111", color: "#fff", border: "none", fontSize: 14,
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, letterSpacing: "-0.01em",
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 5 };
const labelText: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#374151" };
const inputStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
  fontSize: 14, outline: "none", background: "#fff", color: "#111",
  transition: "border-color 0.15s", width: "100%", boxSizing: "border-box",
};

// ── Add Website Modal ─────────────────────────────────────────────────────────

interface AddModalProps {
  token: string;
  onAdded: () => void;
  onClose: () => void;
}

function AddWebsiteModal({ token, onAdded, onClose }: AddModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function submit() {
    setError("");
    if (!url.trim()) { setError("Enter a URL."); return; }
    setLoading(true);
    const { error: err } = await apiFetch("/add-website", token, {
      method: "POST",
      body: JSON.stringify({ url: url.trim() }),
    });
    setLoading(false);
    if (err) { setError(err); return; }
    onAdded();
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "1rem",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: "1.5rem",
        width: "100%", maxWidth: 400,
        border: "1px solid #e5e7eb",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Add website</h3>
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>
        <label style={labelStyle}>
          <span style={labelText}>URL to monitor</span>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="https://example.com"
            style={inputStyle}
          />
        </label>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, marginBottom: 0 }}>
          Workers will ping this URL every 3 minutes.
        </p>
        {error && <p style={{ fontSize: 13, color: "#b91c1c", marginTop: 10, marginBottom: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button onClick={submit} disabled={loading} style={primaryBtn}>
            {loading ? "Adding…" : "Start monitoring"}
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "#9ca3af", fontSize: 16, padding: "2px 6px",
  borderRadius: 6, lineHeight: 1,
};
const primaryBtn: React.CSSProperties = {
  flex: 1, padding: "9px 0", borderRadius: 8, background: "#111",
  color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: "9px 0", borderRadius: 8, background: "#fff",
  color: "#374151", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 500, cursor: "pointer",
};

// ── Tick Sparkline ────────────────────────────────────────────────────────────

function MiniSparkline({ ticks }: { ticks: Tick[] }) {
  if (ticks.length < 2) return <span style={{ fontSize: 11, color: "#d1d5db" }}>no data</span>;
  const data = [...ticks].reverse().slice(-20).map((t, i) => ({
    i,
    ms: t.responseTimeInMs,
    status: t.status,
  }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="ms"
          stroke="#6366f1"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  websiteId: string;
  token: string;
  onClose: () => void;
}

function DetailPanel({ websiteId, token, onClose }: DetailPanelProps) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const { data, error: err } = await apiFetch<DetailData>(
      `/get-status/${websiteId}`, token
    );
    setLoading(false);
    if (err) { setError(err); return; }
    if (data) setDetail(data);
  }, [websiteId, token]);

  useEffect(() => { load(); }, [load]);

  const chartData = detail
    ? [...detail.ticks].reverse().map((t, i) => ({
        i,
        ms: t.responseTimeInMs,
        status: t.status,
        label: timeAgo(t.createdAt),
      }))
    : [];

  const latestTick = detail?.latestTick;
  const ticks = detail?.ticks ?? [];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
      display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
      zIndex: 40,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 520, height: "100vh",
        background: "#fff", borderLeft: "1px solid #e5e7eb",
        overflowY: "auto", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Website detail
            </p>
            <p style={{
              fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: "-0.02em",
              color: "#111", wordBreak: "break-all",
            }}>
              {detail?.url ?? "Loading…"}
            </p>
          </div>
          <button onClick={onClose} style={{ ...iconBtn, marginLeft: 12, flexShrink: 0 }}>✕</button>
        </div>

        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>
            Loading…
          </div>
        )}

        {error && (
          <div style={{ padding: "1.5rem", color: "#b91c1c", fontSize: 14 }}>{error}</div>
        )}

        {detail && !loading && (
          <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
            {/* Stat row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                {
                  label: "Current status",
                  value: (
                    <span style={{
                      fontSize: 16, fontWeight: 700,
                      color: latestTick?.status === "UP" ? "#15803d" : latestTick?.status === "DOWN" ? "#b91c1c" : "#9ca3af",
                    }}>
                      {latestTick?.status ?? "—"}
                    </span>
                  ),
                },
                {
                  label: "Latest response",
                  value: <span style={{ fontSize: 16, fontWeight: 700 }}>{latestTick ? `${latestTick.responseTimeInMs}ms` : "—"}</span>,
                },
                {
                  label: "Avg response (last 20)",
                  value: <span style={{ fontSize: 16, fontWeight: 700 }}>{avgResponseTime(ticks) !== null ? `${avgResponseTime(ticks)}ms` : "—"}</span>,
                },
                {
                  label: "Uptime (last 20 checks)",
                  value: <span style={{ fontSize: 16, fontWeight: 700 }}>{uptimePct(ticks)}</span>,
                },
                {
                  label: "Region",
                  value: <span style={{ fontSize: 14, fontWeight: 600 }}>{latestTick?.region?.name ?? latestTick?.regionId ?? "—"}</span>,
                },
                {
                  label: "Last checked",
                  value: <span style={{ fontSize: 14, fontWeight: 600 }}>{latestTick ? timeAgo(latestTick.createdAt) : "—"}</span>,
                },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: "#f9fafb", borderRadius: 10, padding: "12px 14px",
                  border: "1px solid #f3f4f6",
                }}>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px", fontWeight: 500 }}>{label}</p>
                  {value}
                </div>
              ))}
            </div>

            {/* Chart */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 10px", letterSpacing: "0.02em" }}>
              Response time — last {ticks.length} checks
            </p>
            {chartData.length > 1 ? (
              <div style={{ height: 160, marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}ms`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff", border: "1px solid #e5e7eb",
                        borderRadius: 8, fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                      formatter={(val: number) => [`${val}ms`, "Response"]}
                      labelFormatter={(l) => l}
                    />
                    <Line
                      type="monotone"
                      dataKey="ms"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            key={payload.i}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill={payload.status === "DOWN" ? "#ef4444" : "#6366f1"}
                            stroke="#fff"
                            strokeWidth={1.5}
                          />
                        );
                      }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13, marginBottom: 24 }}>
                Not enough data to chart yet
              </div>
            )}

            {/* Tick history */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 10px", letterSpacing: "0.02em" }}>
              Recent checks
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ticks.length === 0 && (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>No checks recorded yet.</p>
              )}
              {ticks.map((t) => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", background: "#f9fafb", borderRadius: 8,
                  border: "1px solid #f3f4f6",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusDot status={t.status} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.status === "UP" ? "#15803d" : "#b91c1c" }}>
                      {t.status}
                    </span>
                    {t.region?.name && (
                      <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>
                        {t.region.name}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "#6b7280" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{t.responseTimeInMs}ms</span>
                    <span>{timeAgo(t.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

interface DashboardProps {
  token: string;
  username: string;
  onLogout: () => void;
}

function Dashboard({ token, username, onLogout }: DashboardProps) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadWebsites = useCallback(async () => {
    const { data, error } = await apiFetch<{ websites: Website[] }>("/websites", token);
    setLoading(false);
    if (error) { setFetchError(error); return; }
    if (data) setWebsites(data.websites);
  }, [token]);

  useEffect(() => {
    loadWebsites();
    const interval = setInterval(loadWebsites, 60_000);
    return () => clearInterval(interval);
  }, [loadWebsites]);

  const totalUp = websites.filter((w) => latestStatus(w) === "UP").length;
  const totalDown = websites.filter((w) => latestStatus(w) === "DOWN").length;
  const allTicks = websites.flatMap((w) => w.ticks);
  const globalAvg = avgResponseTime(allTicks);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      {/* Top nav */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "0 1.5rem", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#111" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4" fill="#111" />
            <line x1="14" y1="1" x2="14" y2="7" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="21" x2="14" y2="27" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="27" y1="14" x2="21" y2="14" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="14" x2="1" y2="14" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "#111" }}>Uptime</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{username}</span>
          <button
            onClick={onLogout}
            style={{
              fontSize: 13, color: "#374151", background: "none",
              border: "1px solid #e5e7eb", borderRadius: 8,
              padding: "5px 12px", cursor: "pointer", fontWeight: 500,
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Total monitored", value: websites.length, color: "#111" },
            { label: "Online", value: totalUp, color: "#15803d" },
            { label: "Down", value: totalDown, color: totalDown > 0 ? "#b91c1c" : "#111" },
            { label: "Avg response", value: globalAvg !== null ? `${globalAvg}ms` : "—", color: "#111" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 12, padding: "1rem 1.25rem",
            }}>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.03em", color }}>
                {String(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Websites list header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: "#111" }}>
            Websites
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={loadWebsites}
              title="Refresh"
              style={{
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                padding: "6px 10px", cursor: "pointer", fontSize: 14, color: "#6b7280",
              }}
            >
              ↻
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: "#111", color: "#fff", border: "none",
                borderRadius: 8, padding: "7px 14px", fontSize: 13,
                fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em",
              }}
            >
              + Add website
            </button>
          </div>
        </div>

        {/* Loading / Error / Empty */}
        {loading && (
          <div style={{ padding: "3rem 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            Loading…
          </div>
        )}
        {fetchError && !loading && (
          <div style={{
            padding: "1rem 1.25rem", background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, fontSize: 13, color: "#b91c1c", marginBottom: 16,
          }}>
            {fetchError}
          </div>
        )}
        {!loading && !fetchError && websites.length === 0 && (
          <div style={{
            textAlign: "center", padding: "4rem 1rem",
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: "0 0 6px" }}>
              No websites yet
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 20px" }}>
              Add a URL and workers will start pinging it every 3 minutes.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ ...primaryBtn, width: "auto", padding: "9px 20px" }}
            >
              + Add website
            </button>
          </div>
        )}

        {/* Website cards */}
        {!loading && websites.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {websites.map((w) => {
              const status = latestStatus(w);
              const latest = w.ticks[0];
              const avg = avgResponseTime(w.ticks);
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  style={{
                    background: "#fff", border: "1px solid #e5e7eb",
                    borderRadius: 12, padding: "1rem 1.25rem",
                    cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: "0 14px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#6366f1";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  {/* Status dot */}
                  <div style={{ paddingTop: 2 }}>
                    <StatusDot status={status} />
                  </div>

                  {/* Middle */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{
                        fontSize: 14, fontWeight: 600, color: "#111",
                        letterSpacing: "-0.01em", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {w.url}
                      </span>
                      <Badge status={status} />
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>Added {formatDate(w.createdAt)}</span>
                      {latest && <span>Last checked {timeAgo(latest.createdAt)}</span>}
                      {avg !== null && <span>Avg {avg}ms</span>}
                      <span>Uptime {uptimePct(w.ticks)}</span>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div style={{ width: 100, minWidth: 100 }}>
                    <MiniSparkline ticks={w.ticks} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddWebsiteModal
          token={token}
          onClose={() => setShowAddModal(false)}
          onAdded={async () => {
            setShowAddModal(false);
            await loadWebsites();
            showToast("Website added — monitoring started.", "success");
          }}
        />
      )}

      {selectedId && (
        <DetailPanel
          websiteId={selectedId}
          token={token}
          onClose={() => setSelectedId(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("uptime_token") ?? "";
    const u = localStorage.getItem("uptime_username") ?? "";
    setToken(t);
    setUsername(u);
    setReady(true);
  }, []);

  function handleAuth(t: string, u: string) {
    setToken(t);
    setUsername(u);
  }

  function handleLogout() {
    localStorage.removeItem("uptime_token");
    localStorage.removeItem("uptime_username");
    setToken("");
    setUsername("");
  }

  if (!ready) return null;

  if (!token) return <AuthScreen onAuth={handleAuth} />;

  return <Dashboard token={token} username={username} onLogout={handleLogout} />;
}