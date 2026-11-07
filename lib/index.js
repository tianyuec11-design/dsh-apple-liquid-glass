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
import http from "node:http";
import tls from "node:tls";
import { execFileSync } from "node:child_process";

export const name = "dsh-apple-liquid-glass";
export const inject = [];

const BALANCE_PATH = "/dsh-apple-liquid-glass/balance";
const IP_PATH = "/dsh-apple-liquid-glass/ip";
const CACHE_MS = 12000;
const IP_CACHE_MS = 60000;
let cache = { at: 0, value: null };
let ipCache = { at: 0, value: null };

function readSystemProxy() {
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
    return (process.env.HTTPS_PROXY || process.env.HTTP_PROXY).replace(/^https?:\/\//i, "");
  }
  if (process.platform !== "win32") return "";
  try {
    const key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
    const enabled = execFileSync("reg", ["query", key, "/v", "ProxyEnable"], { encoding: "utf8", windowsHide: true });
    if (!/ProxyEnable\s+REG_DWORD\s+0x1/i.test(enabled)) return "";
    const output = execFileSync("reg", ["query", key, "/v", "ProxyServer"], { encoding: "utf8", windowsHide: true });
    const match = output.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/i);
    if (!match) return "";
    const value = match[1].trim();
    const httpsPart = value.split(";").map((part) => part.trim()).find((part) => /^https=/i.test(part));
    return (httpsPart ? httpsPart.replace(/^https=/i, "") : value).replace(/^https?:\/\//i, "");
  } catch (error) {
    return "";
  }
}

function proxyJson(url, proxy, timeout) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(url);
    } catch (error) {
      reject(error);
      return;
    }
    const proxyMatch = String(proxy).match(/^([^:]+):(\d+)$/);
    if (!proxyMatch) {
      reject(new Error("invalid proxy"));
      return;
    }
    const request = http.request({
      host: proxyMatch[1],
      port: Number(proxyMatch[2]),
      method: "CONNECT",
      path: target.hostname + ":443",
      timeout,
    });
    request.on("connect", (response, socket) => {
      if (response.statusCode !== 200) {
        socket.destroy();
        reject(new Error("proxy CONNECT " + response.statusCode));
        return;
      }
      const secure = tls.connect({ socket, servername: target.hostname }, () => {
        secure.write(
          "GET " + target.pathname + target.search + " HTTP/1.1\r\n" +
          "Host: " + target.hostname + "\r\n" +
          "Accept: application/json\r\n" +
          "User-Agent: dsh-apple-liquid-glass\r\n" +
          "Connection: close\r\n\r\n"
        );
      });
      let raw = "";
      secure.on("data", (chunk) => { raw += chunk.toString("utf8"); });
      secure.on("end", () => {
        const split = raw.indexOf("\r\n\r\n");
        if (split < 0) {
          reject(new Error("empty proxy response"));
          return;
        }
        let body = raw.slice(split + 4);
        if (/transfer-encoding:\s*chunked/i.test(raw.slice(0, split))) {
          body = body.replace(/([0-9a-f]+)\r\n([\s\S]*?)\r\n/gi, "$2");
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error("proxy JSON parse failed"));
        }
      });
      secure.on("error", reject);
    });
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("proxy timeout"));
    });
    request.on("error", reject);
    request.end();
  });
}

function normalizeIp(data) {
  if (!data) return null;
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!isFinite(latitude) || !isFinite(longitude)) return null;
  const label = [data.city, data.region, data.country].filter(Boolean).join(" · ");
  return {
    ok: true,
    ip: String(data.ip || ""),
    lat: latitude,
    lon: longitude,
    label,
  };
}

async function readIpLocation() {
  const now = Date.now();
  if (ipCache.value && now - ipCache.at < IP_CACHE_MS) return ipCache.value;
  const proxy = readSystemProxy();
  if (proxy) {
    try {
      const data = await proxyJson("https://ipwho.is/", proxy, 7000);
      const value = normalizeIp(data);
      if (value) {
        value.source = "proxy";
        ipCache = { at: now, value };
        return value;
      }
    } catch (error) {
      /* Fall through to direct. */
    }
  }
  for (const url of ["https://ipwho.is/", "https://ipinfo.io/json"]) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(7000), headers: { Accept: "application/json" } });
      if (!response.ok) continue;
      const data = await response.json();
      if (url.includes("ipinfo.io") && data.loc) {
        const parts = String(data.loc).split(",");
        data.latitude = parts[0];
        data.longitude = parts[1];
      }
      const value = normalizeIp(data);
      if (value) {
        value.source = "direct";
        ipCache = { at: now, value };
        return value;
      }
    } catch (error) {
      /* Try the next provider. */
    }
  }
  const value = { ok: false, error: "ip-unavailable" };
  ipCache = { at: now, value };
  return value;
}

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
      webCtx.effect(() => {
        const disposeBalance = webCtx.webServer.register({
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
        });
        const disposeIp = webCtx.webServer.register({
          kind: "exact",
          path: IP_PATH,
          handler: async (req, res) => {
            if (req.method !== "GET" && req.method !== "HEAD") {
              res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "method" }));
              return;
            }
            const value = await readIpLocation();
            res.writeHead(200, {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            });
            res.end(req.method === "HEAD" ? undefined : JSON.stringify(value));
          },
        });
        return () => {
          disposeBalance();
          disposeIp();
        };
      }, "dsh-apple-liquid-glass: host routes");
    });
  } catch (error) {
    /* The host may not expose a web server; the island falls back to DOM data. */
  }
}
