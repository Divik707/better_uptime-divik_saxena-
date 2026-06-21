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

// ── Global styles ─────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d0d0d;
      --bg-card: #161616;
      --bg-card-hover: #1c1c1c;
      --bg-input: #111111;
      --border: rgba(255,255,255,0.08);
      --border-hover: rgba(255,255,255,0.18);
      --text-primary: #f0ede8;
      --text-secondary: rgba(240,237,232,0.5);
      --text-tertiary: rgba(240,237,232,0.28);
      --accent: #f0ede8;
      --green: #4ade80;
      --red: #f87171;
      --indigo: #818cf8;
      --serif: 'Playfair Display', Georgia, serif;
      --sans: 'Inter', -apple-system, sans-serif;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.97) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGreen {
      0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
      50%      { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
    }
    @keyframes pulseRed {
      0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.5); }
      50%      { box-shadow: 0 0 0 6px rgba(248,113,113,0); }
    }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes rotateSlow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    body { background: var(--bg); color: var(--text-primary); font-family: var(--sans); }

    .dot-up {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: var(--green); flex-shrink: 0;
      animation: pulseGreen 2.4s ease-in-out infinite;
    }
    .dot-down {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: var(--red); flex-shrink: 0;
      animation: pulseRed 2.4s ease-in-out infinite;
    }
    .dot-unknown {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,0.2); flex-shrink: 0;
    }

    .skeleton {
      background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%);
      background-size: 600px 100%;
      animation: shimmer 1.6s infinite linear;
      border-radius: 6px;
    }

    /* Nav */
    .nav {
      position: sticky; top: 0; z-index: 50;
      background: rgba(13,13,13,0.8);
      backdrop-filter: blur(20px) saturate(1.4);
      -webkit-backdrop-filter: blur(20px) saturate(1.4);
      border-bottom: 1px solid var(--border);
      height: 56px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem;
      animation: fadeIn 0.4s ease;
    }
    .nav-logo {
      display: flex; align-items: center; gap: 10px;
      font-family: var(--serif);
      font-size: 18px; font-weight: 500;
      color: var(--text-primary); letter-spacing: -0.01em;
    }
    .nav-logo-icon {
      width: 30px; height: 30px; border-radius: 8px;
      border: 1px solid var(--border-hover);
      display: flex; align-items: center; justify-content: center;
    }
    .nav-signout {
      font-family: var(--sans);
      font-size: 13px; color: var(--text-secondary);
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      border-radius: 8px; padding: 5px 14px;
      cursor: pointer; transition: all 0.15s; letter-spacing: 0;
    }
    .nav-signout:hover { background: rgba(255,255,255,0.09); border-color: var(--border-hover); color: var(--text-primary); }

    /* Auth */
    .auth-bg {
      min-height: 100vh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: var(--bg);
      padding: 1.5rem;
      position: relative; overflow: hidden;
      font-family: var(--sans);
    }
    .auth-bg::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%);
      pointer-events: none;
    }
    .auth-eyebrow {
      font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--text-tertiary); font-weight: 500;
      margin-bottom: 16px;
      animation: fadeInUp 0.5s 0.1s ease both;
    }
    .auth-headline {
      font-family: var(--serif);
      font-size: clamp(32px, 5vw, 48px);
      font-weight: 400; letter-spacing: -0.02em;
      color: var(--text-primary);
      text-align: center; line-height: 1.15;
      margin-bottom: 10px;
      animation: fadeInUp 0.5s 0.15s ease both;
    }
    .auth-sub {
      font-size: 14px; color: var(--text-secondary);
      margin-bottom: 48px; text-align: center;
      animation: fadeInUp 0.5s 0.2s ease both;
    }
    .auth-card {
      width: 100%; max-width: 380px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px; padding: 2rem;
      animation: scaleIn 0.4s 0.25s cubic-bezier(.16,1,.3,1) both;
    }
    .auth-tabs {
      display: flex; margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    .auth-tab {
      flex: 1; padding: 8px 0; font-size: 13px; font-weight: 500;
      background: none; border: none; cursor: pointer;
      font-family: var(--sans); transition: color 0.15s;
      margin-bottom: -1px;
    }
    .auth-tab.active { color: var(--text-primary); border-bottom: 1px solid var(--text-primary); }
    .auth-tab.inactive { color: var(--text-tertiary); border-bottom: 1px solid transparent; }

    .field-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.04em; margin-bottom: 6px; display: block; }
    .field-input {
      width: 100%; padding: 11px 14px;
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: 10px; font-size: 14px; color: var(--text-primary);
      font-family: var(--sans); outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input::placeholder { color: var(--text-tertiary); }
    .field-input:focus { border-color: rgba(255,255,255,0.25); box-shadow: 0 0 0 3px rgba(255,255,255,0.05); }

    .btn-primary {
      width: 100%; padding: 12px; border-radius: 10px;
      background: var(--text-primary); color: #0d0d0d;
      border: none; font-size: 14px; font-weight: 600;
      font-family: var(--sans); cursor: pointer; letter-spacing: -0.01em;
      transition: opacity 0.15s, transform 0.12s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; transform: scale(1.01); }
    .btn-primary:active:not(:disabled) { transform: scale(0.99); }
    .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

    .btn-secondary {
      flex: 1; padding: 11px; border-radius: 10px;
      background: rgba(255,255,255,0.05); color: var(--text-secondary);
      border: 1px solid var(--border); font-size: 14px; font-weight: 500;
      font-family: var(--sans); cursor: pointer;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }

    /* Dashboard */
    .dash-main { max-width: 920px; margin: 0 auto; padding: 3rem 1.5rem; }

    .dash-header { margin-bottom: 40px; animation: fadeInUp 0.5s 0.1s ease both; }
    .dash-eyebrow { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-tertiary); font-weight: 500; margin-bottom: 8px; }
    .dash-title { font-family: var(--serif); font-size: 36px; font-weight: 400; letter-spacing: -0.02em; color: var(--text-primary); }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1px; background: var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 48px; border: 1px solid var(--border); }
    .stat-cell { background: var(--bg-card); padding: 1.4rem 1.5rem; animation: fadeInUp 0.5s ease both; }
    .stat-cell:nth-child(1){animation-delay:0.1s}
    .stat-cell:nth-child(2){animation-delay:0.15s}
    .stat-cell:nth-child(3){animation-delay:0.2s}
    .stat-cell:nth-child(4){animation-delay:0.25s}
    .stat-label-text { font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 8px; }
    .stat-value { font-family: var(--serif); font-size: 32px; font-weight: 400; letter-spacing: -0.03em; color: var(--text-primary); }
    .stat-value.green { color: var(--green); }
    .stat-value.red { color: var(--red); }

    .list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; animation: fadeInUp 0.5s 0.3s ease both; }
    .list-head-title { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--text-primary); letter-spacing: -0.01em; }
    .head-actions { display: flex; gap: 8px; }

    .refresh-btn {
      background: rgba(255,255,255,0.05); border: 1px solid var(--border);
      border-radius: 9px; padding: 7px 11px; cursor: pointer;
      font-size: 15px; color: var(--text-secondary);
      transition: background 0.15s, transform 0.2s, color 0.15s;
    }
    .refresh-btn:hover { background: rgba(255,255,255,0.08); transform: rotate(90deg); color: var(--text-primary); }

    .add-btn {
      background: var(--text-primary); color: #0d0d0d;
      border: none; border-radius: 9px; padding: 8px 16px;
      font-size: 13px; font-weight: 600; font-family: var(--sans);
      cursor: pointer; letter-spacing: -0.01em;
      transition: opacity 0.15s, transform 0.12s;
    }
    .add-btn:hover { opacity: 0.85; transform: scale(1.02); }
    .add-btn:active { transform: scale(0.98); }

    .website-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px; padding: 1.1rem 1.4rem;
      cursor: pointer;
      display: grid; grid-template-columns: 12px 1fr 100px;
      align-items: center; gap: 16px;
      transition: border-color 0.2s, background 0.2s, transform 0.18s;
      animation: fadeInUp 0.45s ease both;
    }
    .website-card:nth-child(1){animation-delay:0.32s}
    .website-card:nth-child(2){animation-delay:0.4s}
    .website-card:nth-child(3){animation-delay:0.48s}
    .website-card:nth-child(4){animation-delay:0.56s}
    .website-card:nth-child(5){animation-delay:0.64s}
    .website-card:hover { border-color: var(--border-hover); background: var(--bg-card-hover); transform: translateY(-1px); }

    .card-url { font-size: 14px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .card-meta { font-size: 12px; color: var(--text-tertiary); display: flex; gap: 14px; flex-wrap: wrap; }

    .badge {
      display: inline-flex; align-items: center;
      padding: 2px 8px; border-radius: 20px;
      font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
      font-family: ui-monospace, monospace;
    }
    .badge-up { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
    .badge-down { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 60; padding: 1rem;
      animation: fadeIn 0.2s ease;
    }
    .modal-box {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 20px; padding: 2rem;
      width: 100%; max-width: 400px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6);
      animation: scaleIn 0.28s cubic-bezier(.16,1,.3,1);
    }
    .modal-title { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--text-primary); letter-spacing: -0.02em; }

    /* Detail panel */
    .detail-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      z-index: 50;
      animation: fadeIn 0.2s ease;
    }
    .detail-panel {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 100%; max-width: 520px;
      background: var(--bg-card);
      border-left: 1px solid var(--border);
      overflow-y: auto; z-index: 51;
      animation: slideInRight 0.32s cubic-bezier(.16,1,.3,1);
    }
    .detail-header {
      position: sticky; top: 0;
      background: rgba(22,22,22,0.9);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 1.4rem 1.6rem;
      display: flex; align-items: flex-start; justify-content: space-between;
      z-index: 1;
    }
    .close-btn {
      background: rgba(255,255,255,0.07); border: 1px solid var(--border);
      border-radius: 8px; padding: 5px 10px; cursor: pointer;
      font-size: 13px; color: var(--text-secondary); font-weight: 600;
      transition: all 0.15s; flex-shrink: 0; margin-left: 12px;
    }
    .close-btn:hover { background: rgba(255,255,255,0.12); color: var(--text-primary); }

    .detail-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
    .detail-stat-cell {
      background: rgba(255,255,255,0.03); border: 1px solid var(--border);
      border-radius: 12px; padding: 14px 16px;
    }
    .detail-stat-label { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 6px; }
    .detail-stat-val { font-family: var(--serif); font-size: 20px; font-weight: 400; color: var(--text-primary); }

    .section-title { font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 12px; }

    .tick-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px;
      background: rgba(255,255,255,0.02); border-radius: 10px;
      border: 1px solid var(--border);
      transition: background 0.12s;
      animation: fadeInUp 0.3s ease both;
    }
    .tick-row:hover { background: rgba(255,255,255,0.04); }

    /* Toast */
    .toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 100;
      padding: 11px 18px; border-radius: 12px;
      font-size: 13px; font-weight: 500; font-family: var(--sans);
      display: flex; align-items: center; gap: 10px;
      border: 1px solid var(--border);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: toastIn 0.25s cubic-bezier(.16,1,.3,1);
      max-width: 340px;
    }
    .toast-success { background: rgba(74,222,128,0.1); color: #4ade80; border-color: rgba(74,222,128,0.2); }
    .toast-error   { background: rgba(248,113,113,0.1); color: #f87171; border-color: rgba(248,113,113,0.2); }

    /* Empty state */
    .empty-state {
      text-align: center; padding: 5rem 1rem;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 20px;
      animation: scaleIn 0.4s cubic-bezier(.16,1,.3,1);
    }
    .empty-icon { font-size: 36px; opacity: 0.15; margin-bottom: 16px; }
    .empty-title { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--text-primary); margin-bottom: 8px; }
    .empty-sub { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

    /* Error */
    .err-box { padding: 1rem 1.25rem; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 12px; font-size: 13px; color: #f87171; margin-bottom: 16px; animation: fadeInUp 0.3s ease; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `}</style>
);

// ── Config ────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "UP" | "DOWN";
interface Region { id: string; name: string; }
interface Tick {
  id: string; websiteId: string; regionId: string; region?: Region;
  responseTimeInMs: number; statusCode?: number | null;
  status: Status; createdAt: string;
}
interface Website { id: string; url: string; createdAt: string; userId: string; ticks: Tick[]; }
interface DetailData { websiteId: string; url: string; ticks: Tick[]; latestTick: Tick | null; }

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, token: string, opts: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers ?? {}) },
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
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function avgResponseTime(ticks: Tick[]): number | null {
  if (!ticks.length) return null;
  return Math.round(ticks.reduce((s, t) => s + t.responseTimeInMs, 0) / ticks.length);
}
function uptimePct(ticks: Tick[]): string {
  if (!ticks.length) return "—";
  return ((ticks.filter((t) => t.status === "UP").length / ticks.length) * 100).toFixed(1) + "%";
}
function latestStatus(w: Website): Status | null { return w.ticks[0]?.status ?? null; }

// ── Components ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Status | null }) {
  if (!status) return <span className="dot-unknown" />;
  return <span className={status === "UP" ? "dot-up" : "dot-down"} />;
}

function Badge({ status }: { status: Status | null }) {
  if (!status) return null;
  return <span className={status === "UP" ? "badge badge-up" : "badge badge-down"}>{status}</span>;
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`toast ${type === "success" ? "toast-success" : "toast-error"}`}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }: { onAuth: (token: string, username: string) => void }) {
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
    if (tab === "signup") { setSuccess("Account created — sign in now."); setTab("login"); setPassword(""); return; }
    if (data?.token) {
      localStorage.setItem("uptime_token", data.token);
      localStorage.setItem("uptime_username", username.trim());
      onAuth(data.token, username.trim());
    }
  }

  return (
    <>
      <GlobalStyles />
      <div className="auth-bg">
        <p className="auth-eyebrow">Website Monitoring</p>
        <h1 className="auth-headline">Always know<br />what's online.</h1>
        <p className="auth-sub">Real-time uptime monitoring for your websites.</p>

        <div className="auth-card">
          <div className="auth-tabs">
            {(["login", "signup"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                className={`auth-tab ${tab === t ? "active" : "inactive"}`}>
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label>
              <span className="field-label">Username</span>
              <input className="field-input" value={username} onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="your_username" autoComplete="username" />
            </label>
            <label>
              <span className="field-label">Password</span>
              <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••"
                autoComplete={tab === "login" ? "current-password" : "new-password"} />
            </label>
          </div>

          {error && <p style={{ fontSize: 13, color: "#f87171", marginTop: 12 }}>{error}</p>}
          {success && <p style={{ fontSize: 13, color: "#4ade80", marginTop: 12 }}>{success}</p>}

          <button className="btn-primary" onClick={submit} disabled={loading} style={{ marginTop: 22 }}>
            {loading ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Add Website Modal ─────────────────────────────────────────────────────────

function AddWebsiteModal({ token, onAdded, onClose }: { token: string; onAdded: () => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function submit() {
    setError("");
    if (!url.trim()) { setError("Enter a URL."); return; }
    setLoading(true);
    const { error: err } = await apiFetch("/add-website", token, { method: "POST", body: JSON.stringify({ url: url.trim() }) });
    setLoading(false);
    if (err) { setError(err); return; }
    onAdded();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <h3 className="modal-title">Add website</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <label>
          <span className="field-label">URL to monitor</span>
          <input ref={inputRef} type="url" className="field-input" value={url}
            onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="https://example.com" />
        </label>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>
          Workers will ping this URL every 3 minutes.
        </p>
        {error && <p style={{ fontSize: 13, color: "#f87171", marginTop: 10 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Adding…" : "Start monitoring"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function MiniSparkline({ ticks }: { ticks: Tick[] }) {
  if (ticks.length < 2) return <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>no data</span>;
  const data = [...ticks].reverse().slice(-20).map((t, i) => ({ i, ms: t.responseTimeInMs, status: t.status }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line type="monotone" dataKey="ms" stroke="rgba(129,140,248,0.8)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ websiteId, token, onClose }: { websiteId: string; token: string; onClose: () => void }) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const { data, error: err } = await apiFetch<DetailData>(`/get-status/${websiteId}`, token);
    setLoading(false);
    if (err) { setError(err); return; }
    if (data) setDetail(data);
  }, [websiteId, token]);

  useEffect(() => { load(); }, [load]);

  const chartData = detail ? [...detail.ticks].reverse().map((t, i) => ({
    i, ms: t.responseTimeInMs, status: t.status, label: timeAgo(t.createdAt),
  })) : [];

  const latestTick = detail?.latestTick;
  const ticks = detail?.ticks ?? [];

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 5, fontWeight: 500 }}>
              Website detail
            </p>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", wordBreak: "break-all" }}>
              {detail?.url ?? "Loading…"}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div style={{ padding: "2rem" }}>
            <div className="skeleton" style={{ height: 14, width: "60%", marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 24 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />)}
            </div>
          </div>
        )}

        {error && <div style={{ padding: "1.5rem", color: "#f87171", fontSize: 14 }}>{error}</div>}

        {detail && !loading && (
          <div style={{ padding: "1.4rem 1.6rem" }}>
            <div className="detail-stat-grid">
              {[
                { label: "Current status", value: latestTick?.status ?? "—", color: latestTick?.status === "UP" ? "#4ade80" : latestTick?.status === "DOWN" ? "#f87171" : "var(--text-primary)" },
                { label: "Latest response", value: latestTick ? `${latestTick.responseTimeInMs}ms` : "—", color: "var(--text-primary)" },
                { label: "Avg response (last 20)", value: avgResponseTime(ticks) !== null ? `${avgResponseTime(ticks)}ms` : "—", color: "var(--text-primary)" },
                { label: "Uptime (last 20)", value: uptimePct(ticks), color: "var(--text-primary)" },
                { label: "Region", value: latestTick?.region?.name ?? latestTick?.regionId ?? "—", color: "var(--text-primary)" },
                { label: "Last checked", value: latestTick ? timeAgo(latestTick.createdAt) : "—", color: "var(--text-primary)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="detail-stat-cell">
                  <p className="detail-stat-label">{label}</p>
                  <p className="detail-stat-val" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            <p className="section-title">Response time — last {ticks.length} checks</p>
            {chartData.length > 1 ? (
              <div style={{ height: 160, marginBottom: 28 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(240,237,232,0.28)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(240,237,232,0.28)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} />
                    <Tooltip
                      contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12, color: "#f0ede8" }}
                      //@ts-ignore
                      formatter={(val: number) => [`${val}ms`, "Response"]}
                      labelFormatter={(l) => l}
                    />
                    <Line type="monotone" dataKey="ms" stroke="#818cf8" strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return <circle key={payload.i} cx={cx} cy={cy} r={3} fill={payload.status === "DOWN" ? "#f87171" : "#818cf8"} stroke="#161616" strokeWidth={1.5} />;
                      }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13, marginBottom: 28 }}>
                Not enough data yet
              </div>
            )}

            <p className="section-title" style={{ marginBottom: 10 }}>Recent checks</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ticks.length === 0 && <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No checks recorded yet.</p>}
              {ticks.map((t) => (
                <div key={t.id} className="tick-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusDot status={t.status} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: t.status === "UP" ? "#4ade80" : "#f87171" }}>{t.status}</span>
                    {t.region?.name && (
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 4 }}>
                        {t.region.name}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ fontFamily: "ui-monospace, monospace" }}>{t.responseTimeInMs}ms</span>
                    <span>{timeAgo(t.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ token, username, onLogout }: { token: string; username: string; onLogout: () => void }) {
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
  const globalAvg = avgResponseTime(websites.flatMap((w) => w.ticks));

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sans)" }}>
        <header className="nav">
          <div className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="11" stroke="rgba(240,237,232,0.8)" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="3.5" fill="rgba(240,237,232,0.9)" />
                <line x1="14" y1="3" x2="14" y2="8" stroke="rgba(240,237,232,0.8)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="14" y1="20" x2="14" y2="25" stroke="rgba(240,237,232,0.8)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="25" y1="14" x2="20" y2="14" stroke="rgba(240,237,232,0.8)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="14" x2="3" y2="14" stroke="rgba(240,237,232,0.8)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            Uptime
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{username}</span>
            <button className="nav-signout" onClick={onLogout}>Sign out</button>
          </div>
        </header>

        <main className="dash-main">
          <div className="dash-header">
            <p className="dash-eyebrow">Dashboard</p>
            <h1 className="dash-title">{greeting}, {username}.</h1>
          </div>

          <div className="stats-grid">
            {[
              { label: "Monitored", value: String(websites.length), cls: "" },
              { label: "Online", value: String(totalUp), cls: totalUp > 0 ? "green" : "" },
              { label: "Down", value: String(totalDown), cls: totalDown > 0 ? "red" : "" },
              { label: "Avg response", value: globalAvg !== null ? `${globalAvg}ms` : "—", cls: "" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="stat-cell">
                <p className="stat-label-text">{label}</p>
                <p className={`stat-value ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="list-head">
            <h2 className="list-head-title">Websites</h2>
            <div className="head-actions">
              <button className="refresh-btn" onClick={loadWebsites} title="Refresh">↻</button>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>+ Add website</button>
            </div>
          </div>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14 }} />)}
            </div>
          )}

          {fetchError && !loading && <div className="err-box">{fetchError}</div>}

          {!loading && !fetchError && websites.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <p className="empty-title">Nothing to watch yet</p>
              <p className="empty-sub">Add a URL and workers will start pinging it every 3 minutes.</p>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>+ Add website</button>
            </div>
          )}

          {!loading && websites.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {websites.map((w) => {
                const status = latestStatus(w);
                const latest = w.ticks[0];
                const avg = avgResponseTime(w.ticks);
                return (
                  <div key={w.id} className="website-card" onClick={() => setSelectedId(w.id)}>
                    <StatusDot status={status} />
                    <div style={{ minWidth: 0 }}>
                      <div className="card-url">
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.url}</span>
                        <Badge status={status} />
                      </div>
                      <div className="card-meta">
                        <span>Added {formatDate(w.createdAt)}</span>
                        {latest && <span>Last checked {timeAgo(latest.createdAt)}</span>}
                        {avg !== null && <span>Avg {avg}ms</span>}
                        <span>Uptime {uptimePct(w.ticks)}</span>
                      </div>
                    </div>
                    <div style={{ width: 100 }}><MiniSparkline ticks={w.ticks} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {showAddModal && (
          <AddWebsiteModal token={token} onClose={() => setShowAddModal(false)}
            onAdded={async () => { setShowAddModal(false); await loadWebsites(); showToast("Website added — monitoring started.", "success"); }} />
        )}

        {selectedId && (
          <DetailPanel websiteId={selectedId} token={token} onClose={() => setSelectedId(null)} />
        )}

        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("uptime_token") ?? "");
    setUsername(localStorage.getItem("uptime_username") ?? "");
    setReady(true);
  }, []);

  function handleAuth(t: string, u: string) { setToken(t); setUsername(u); }
  function handleLogout() {
    localStorage.removeItem("uptime_token");
    localStorage.removeItem("uptime_username");
    setToken(""); setUsername("");
  }

  if (!ready) return null;
  if (!token) return <AuthScreen onAuth={handleAuth} />;
  return <Dashboard token={token} username={username} onLogout={handleLogout} />;
}