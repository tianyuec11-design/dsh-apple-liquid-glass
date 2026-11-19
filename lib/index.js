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
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const name = "dsh-apple-liquid-glass";
export const inject = [];

const BALANCE_PATH = "/dsh-apple-liquid-glass/balance";
const IP_PATH = "/dsh-apple-liquid-glass/ip";
const NEWS_PATH = "/dsh-apple-liquid-glass/news";
const CONSULT_PATH = "/dsh-apple-liquid-glass/news/consult";
const ARCHIVES_PATH = "/dsh-apple-liquid-glass/archives";
const ARCHIVE_UNARCHIVE_PATH = "/dsh-apple-liquid-glass/archives/unarchive";
const ARCHIVE_DELETE_PATH = "/dsh-apple-liquid-glass/archives/delete";
const CACHE_MS = 5000;
const IP_CACHE_MS = 60000;
const NEWS_CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, value: null };
let ipCache = { at: 0, value: null };
let newsCache = { at: 0, value: null };
const consultCache = new Map();

const NEWS_SUMMARIES = {
  news261113: "DeepSeek 把 App 的完整能力开放到 API：内置 Web 搜索、深度思考搜索、文件输入、URL 读取、安全检查和语音能力，并公布工具计价；同时开源聊天前端 Demo。",
  news261017: "V4.1-Flash-1017 主打 wish-driven programming，基准成绩和成本都有 Pareto 改善；可从零构建完整项目，Search & Fetch API 对外开放，模型已开源。",
  news260910: "V4.1-Flash 采用 552B MoE 非对称编解码架构（输入 8B / 输出 16B 激活），KV cache 占用大幅下降，API 价格下调并原生支持多模态。",
  news260821: "V4-Flash-Vision-Exp 发布，DeepSeek 多模态 API 上线。",
  news260813: "V4-Pro 正式 GA，DeepSeek 旗舰模型进入正式可用阶段。",
  news260424: "DeepSeek-V4 Preview 发布，新一代模型架构开始对外预览。"
};

function decodeHtml(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readNews() {
  const now = Date.now();
  if (newsCache.value && now - newsCache.at < NEWS_CACHE_MS) return newsCache.value;
  try {
    const indexResponse = await fetch("https://api-docs.deepseek.com/news/", {
      headers: { "user-agent": "dsh-apple-liquid-glass" },
      signal: AbortSignal.timeout(9000)
    });
    if (!indexResponse.ok) throw new Error("news index HTTP " + indexResponse.status);
    let html = await indexResponse.text();
    const latestMatch = html.match(/href="\/news\/(news\d+)"/);
    const latest = latestMatch ? latestMatch[1] : "";
    if (latest) {
      const articleResponse = await fetch("https://api-docs.deepseek.com/news/" + latest, {
        headers: { "user-agent": "dsh-apple-liquid-glass" },
        signal: AbortSignal.timeout(9000)
      });
      if (articleResponse.ok) html = await articleResponse.text();
    }
    const items = [];
    const seen = new Set();
    const linkPattern = /<a[^>]+href="\/news\/(news[^"\/]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkPattern.exec(html))) {
      const slug = match[1];
      if (seen.has(slug)) continue;
      const raw = decodeHtml(match[2]);
      const dateMatch = raw.match(/(\d{4}\/\d{2}\/\d{2})/);
      if (!dateMatch) continue;
      let title = raw.replace(dateMatch[1], "").replace(/^News\s*/i, "").replace(/\s+/g, " ").trim();
      if (!title) continue;
      seen.add(slug);
      items.push({
        slug,
        title,
        date: dateMatch[1],
        url: "https://api-docs.deepseek.com/news/" + slug,
        summary: NEWS_SUMMARIES[slug] || ""
      });
    }
    items.sort((a, b) => b.date.localeCompare(a.date));
    const ordered = items.slice(0, 8);
    if (ordered.length === 0) throw new Error("no news parsed");
    const summary = NEWS_SUMMARIES[latest] ||
      "DeepSeek 最新更新：" + ordered.slice(0, 3).map((item) => item.title).join("；") + "。";
    const value = {
      ok: true,
      updatedAt: new Date().toISOString(),
      latest,
      summary,
      items: ordered
    };
    newsCache = { at: now, value };
    return value;
  } catch (error) {
    const value = { ok: false, error: "news-unavailable" };
    newsCache = { at: now, value };
    return value;
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString("utf8");
      if (body.length > 16384) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function consultNews(summary, items) {
  const text = String(summary || "").trim();
  if (!text) return { ok: false, error: "summary-empty" };
  if (consultCache.has(text)) return consultCache.get(text);
  const key = readApiKey();
  if (!key) return { ok: false, error: "no-key" };
  const context = Array.isArray(items)
    ? items.slice(0, 6).map((item) => "- " + (item.date || "") + " " + (item.title || "")).join("\n")
    : "";
  const system = "你是 DeepSeek 官方资讯分析师。请基于用户提供的摘要做细致、结构化的解读，依次说明：1) 发生了什么；2) 关键变化；3) 对开发者/产品的影响；4) 值得继续关注的问题。不要编造摘要中没有的事实，不确定的地方明确指出。用中文、简洁段落，控制在 600 字以内。";
  const user = "摘要：\n" + text + (context ? "\n\n相关新闻标题：\n" + context : "");
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer " + key,
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: "deepseek-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 900,
        temperature: 0.35,
        stream: false,
      }),
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const payload = await response.json();
    const answer = payload && payload.choices && payload.choices[0] && payload.choices[0].message
      ? String(payload.choices[0].message.content || "").trim()
      : "";
    if (!answer) throw new Error("empty answer");
    const value = { ok: true, text: answer, model: "deepseek-flash" };
    consultCache.set(text, value);
    if (consultCache.size > 20) consultCache.delete(consultCache.keys().next().value);
    return value;
  } catch (error) {
    return { ok: false, error: "ai-unavailable" };
  }
}

function sessionsRoot() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
  return path.join(home, "sessions");
}

function archiveRegistry(webCtx) {
  if (!webCtx || typeof webCtx.get !== "function") return null;
  return webCtx.get("workspaceRegistry") || null;
}

async function findSessionStorage(sessionId) {
  if (!/^session-[0-9a-f-]+$/i.test(String(sessionId || ""))) return "";
  const root = sessionsRoot();
  let entries;
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch (error) {
    return "";
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(root, entry.name, sessionId);
    try {
      const stat = await fs.promises.stat(candidate);
      if (stat.isDirectory()) return candidate;
    } catch (error) {
      /* Keep looking. */
    }
  }
  return "";
}

async function listArchives(webCtx) {
  const registry = archiveRegistry(webCtx);
  if (!registry) return { ok: false, error: "no-workspace-registry" };
  const archived = Array.isArray(registry.archivedSessionIds) ? registry.archivedSessionIds : [];
  const workspaces = typeof registry.list === "function" ? registry.list() : [];
  const items = [];
  for (const sessionId of archived) {
    const owner = workspaces.find((workspace) => Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(sessionId));
    const storage = await findSessionStorage(sessionId);
    items.push({
      sessionId,
      workspaceId: owner ? owner.id : "",
      workspaceTitle: owner ? owner.title : "",
      workspacePath: owner ? owner.path : "",
      storage,
      exists: storage !== "",
    });
  }
  return { ok: true, items };
}

async function unarchiveSession(webCtx, sessionId) {
  const registry = archiveRegistry(webCtx);
  if (!registry) return { ok: false, error: "no-workspace-registry" };
  const state = typeof registry.requireState === "function" ? registry.requireState() : null;
  if (!state || !Array.isArray(state.archivedSessionIds)) return { ok: false, error: "no-state" };
  if (!state.archivedSessionIds.includes(sessionId)) return { ok: true, already: true };
  if (typeof registry.setState !== "function") return { ok: false, error: "unarchive-unsupported" };
  await registry.setState({
    ...state,
    archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId),
  });
  return { ok: true };
}

async function recycleStorage(target) {
  if (!target) return false;
  const normalized = path.resolve(target);
  const root = path.resolve(sessionsRoot());
  if (!normalized.toLowerCase().startsWith(root.toLowerCase() + path.sep)) return false;
  const encoded = Buffer.from(normalized, "utf8").toString("base64");
  const command = [
    "$ErrorActionPreference='Stop'",
    `$p=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}'))`,
    "Add-Type -AssemblyName Microsoft.VisualBasic",
    "if (Test-Path -LiteralPath $p -PathType Container) {",
    "[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($p,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)",
    "} else {",
    "[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)",
    "}",
  ].join("; ");
  await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], {
    windowsHide: true,
    timeout: 30000,
  });
  return true;
}

async function deleteArchive(webCtx, sessionId) {
  const registry = archiveRegistry(webCtx);
  if (!registry) return { ok: false, error: "no-workspace-registry" };
  if (!Array.isArray(registry.archivedSessionIds) || !registry.archivedSessionIds.includes(sessionId)) {
    return { ok: false, error: "not-archived" };
  }
  const storage = await findSessionStorage(sessionId);
  if (!storage) return { ok: true, missing: true };
  await recycleStorage(storage);
  return { ok: true };
}

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
      secure.setTimeout(7000, () => {
        secure.destroy();
        reject(new Error("proxy TLS timeout"));
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
        const disposeNews = webCtx.webServer.register({
          kind: "exact",
          path: NEWS_PATH,
          handler: async (req, res) => {
            if (req.method !== "GET" && req.method !== "HEAD") {
              res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "method" }));
              return;
            }
            const value = await readNews();
            res.writeHead(200, {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            });
            res.end(req.method === "HEAD" ? undefined : JSON.stringify(value));
          },
        });
        const disposeConsult = webCtx.webServer.register({
          kind: "exact",
          path: CONSULT_PATH,
          handler: async (req, res) => {
            if (req.method !== "POST") {
              res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "method" }));
              return;
            }
            try {
              const body = await readJsonBody(req);
              const value = await consultNews(body.summary, body.items);
              res.writeHead(200, {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
              });
              res.end(JSON.stringify(value));
            } catch (error) {
              res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "bad-request" }));
            }
          },
        });
        const disposeArchives = webCtx.webServer.register({
          kind: "exact",
          path: ARCHIVES_PATH,
          handler: async (req, res) => {
            const value = await listArchives(webCtx);
            res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
            res.end(JSON.stringify(value));
          },
        });
        const disposeArchiveUnarchive = webCtx.webServer.register({
          kind: "exact",
          path: ARCHIVE_UNARCHIVE_PATH,
          handler: async (req, res) => {
            if (req.method !== "POST") {
              res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "method" }));
              return;
            }
            try {
              const body = await readJsonBody(req);
              const value = await unarchiveSession(webCtx, String(body.sessionId || ""));
              res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
              res.end(JSON.stringify(value));
            } catch (error) {
              res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "unarchive-failed" }));
            }
          },
        });
        const disposeArchiveDelete = webCtx.webServer.register({
          kind: "exact",
          path: ARCHIVE_DELETE_PATH,
          handler: async (req, res) => {
            if (req.method !== "POST") {
              res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "method" }));
              return;
            }
            try {
              const body = await readJsonBody(req);
              const value = await deleteArchive(webCtx, String(body.sessionId || ""));
              res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
              res.end(JSON.stringify(value));
            } catch (error) {
              res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: false, error: "delete-failed" }));
            }
          },
        });
        return () => {
          disposeBalance();
          disposeIp();
          disposeNews();
          disposeConsult();
          disposeArchives();
          disposeArchiveUnarchive();
          disposeArchiveDelete();
        };
      }, "dsh-apple-liquid-glass: host routes");
    });
  } catch (error) {
    /* The host may not expose a web server; the island falls back to DOM data. */
  }
}
