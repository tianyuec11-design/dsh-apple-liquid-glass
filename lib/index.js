/**
 * Host half.
 *
 * The theme is a browser-only client plugin. This entry also exposes a tiny
 * localhost-only balance reader so the Dynamic Island can show the real
 * DeepSeek account balance without ever sending the API key to the browser.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const name = "dsh-apple-liquid-glass";
export const inject = [];

const BALANCE_PATH = "/dsh-apple-liquid-glass/balance";
const CACHE_MS = 12000;
let cache = { at: 0, value: null };

function readApiKey() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY.trim();
  const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
  const file = path.join(home, ".credentials.yaml");
  try {
    const text = fs.readFileSync(file, "utf8");
    const match = text.match(/DEEPSEEK_API_KEY\s*:\s*["']?([^"'\s]+)/);
    return match ? match[1].trim() : "";
  } catch (error) {
    return "";
  }
}

async function readBalance() {
  const now = Date.now();
  if (cache.value && now - cache.at < CACHE_MS) return cache.value;
  const key = readApiKey();
  if (!key) {
    const value = { ok: false, error: "no-key" };
    cache = { at: now, value };
    return value;
  }
  try {
    const response = await fetch("https://api.deepseek.com/user/balance", {
      headers: { Authorization: "Bearer " + key },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const payload = await response.json();
    const info = Array.isArray(payload.balance_infos) ? payload.balance_infos[0] : null;
    const value = info
      ? {
        ok: true,
        available: payload.is_available !== false,
        currency: info.currency || "CNY",
        total: info.total_balance || "0.00",
        granted: info.granted_balance || "0.00",
        toppedUp: info.topped_up_balance || "0.00",
      }
      : { ok: false, error: "no-balance-info" };
    cache = { at: now, value };
    return value;
  } catch (error) {
    const value = { ok: false, error: "unavailable" };
    cache = { at: now, value };
    return value;
  }
}

export function apply(ctx) {
  try {
    ctx.inject(["webServer"], (webCtx) => {
      webCtx.effect(() => webCtx.webServer.register({
        kind: "exact",
        path: BALANCE_PATH,
        handler: async (req, res) => {
          if (req.method !== "GET" && req.method !== "HEAD") {
            res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ ok: false, error: "method" }));
            return;
          }
          const value = await readBalance();
          res.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          });
          res.end(req.method === "HEAD" ? undefined : JSON.stringify(value));
        },
      }), "dsh-apple-liquid-glass: balance route");
    });
  } catch (error) {
    /* The host may not expose a web server; the island falls back to DOM data. */
  }
}
