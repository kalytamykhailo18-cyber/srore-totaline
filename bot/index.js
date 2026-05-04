// Perez Refrigeracion — WhatsApp Bot
// Receives messages, stores them, serves HTTP API for inbox

import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from "qrcode-terminal";
import http from "http";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_ROOT = path.resolve(__dirname, "..");
const SESSION_PATH = path.join(BOT_ROOT, "bot", "session");
const PORT = parseInt(process.env.BOT_PORT || "3001");

const prisma = new PrismaClient();

// WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/root/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome",
    protocolTimeout: 120000,
  },
});

let botStatus = "iniciando";
let latestQR = null;

client.on("qr", (qr) => {
  console.log("\n========== ESCANEAR QR ==========\n");
  qrcode.generate(qr, { small: true });
  latestQR = qr;
  botStatus = "esperando_qr";
});

client.on("ready", () => {
  console.log("✓ Bot conectado a WhatsApp");
  latestQR = null;
  botStatus = "conectado";
});

client.on("authenticated", () => {
  console.log("✓ Bot autenticado");
  latestQR = null;
  botStatus = "autenticado";
});

client.on("auth_failure", (msg) => {
  console.error("✗ Auth failure:", msg);
  botStatus = "error_auth";
});

client.on("disconnected", (reason) => {
  console.log("Bot desconectado:", reason);
  botStatus = "desconectado";
  setTimeout(() => process.exit(1), 10000);
});

// Heartbeat
let lastPong = Date.now();
setInterval(async () => {
  if (botStatus !== "conectado" && botStatus !== "autenticado") return;
  try {
    const state = await client.getState();
    if (state === "CONNECTED") lastPong = Date.now();
    else { console.log("Heartbeat: state=" + state + ", restarting..."); process.exit(1); }
  } catch (err) {
    if (Date.now() - lastPong > 120000) { console.log("No heartbeat, restarting..."); process.exit(1); }
  }
}, 300000);

// Store message helper
async function storeMessage(chatId, direction, body, sender = "") {
  const safeBody = (body || "").replace(/\x00/g, "").substring(0, 2000);
  const contactPhone = chatId.replace("@c.us", "").replace("@lid", "");
  try {
    await prisma.whatsAppChat.upsert({
      where: { chatId },
      create: { chatId, contactName: "", contactPhone, lastMessage: safeBody.substring(0, 200), lastMessageAt: new Date(), unread: direction === "in" ? 1 : 0 },
      update: { lastMessage: safeBody.substring(0, 200), lastMessageAt: new Date(), ...(direction === "in" ? { unread: { increment: 1 } } : {}) },
    });
  } catch {
    try { await prisma.whatsAppChat.create({ data: { chatId, contactName: "", contactPhone, lastMessage: "", lastMessageAt: new Date(), unread: 0 } }).catch(() => {}); } catch {}
  }
  try {
    await prisma.whatsAppMessage.create({ data: { chatId, direction, body: safeBody, sender } });
  } catch {}
}

// Handle incoming messages
client.on("message", async (msg) => {
  if (msg.from.endsWith("@g.us") || msg.from === "status@broadcast") return;
  if (msg.fromMe) return;

  const chatId = msg.from;
  console.log(`[IN] ${chatId}: ${(msg.body || "").substring(0, 80)}`);

  // Store message
  if (msg.body) storeMessage(chatId, "in", msg.body, "contact");

  // Save media if present
  if (msg.hasMedia) {
    try {
      const media = await msg.downloadMedia();
      if (media) {
        const ext = media.mimetype.split("/")[1]?.split(";")[0] || "bin";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const dir = path.join(BOT_ROOT, "public", "uploads", "inbox");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, filename), Buffer.from(media.data, "base64"));
        const mediaType = media.mimetype.startsWith("image") ? "image" : media.mimetype.startsWith("video") ? "video" : media.mimetype.startsWith("audio") ? "audio" : "document";
        await prisma.whatsAppMessage.create({
          data: { chatId, direction: "in", body: msg.body || `[${mediaType}]`, sender: "contact", mediaType, mediaUrl: `/uploads/inbox/${filename}` },
        });
      }
    } catch (e) { console.error("Media download error:", e.message); }
  }

  // Update contact name
  try {
    const contact = await msg.getContact();
    const name = contact.pushname || contact.name || "";
    if (name) await prisma.whatsAppChat.update({ where: { chatId }, data: { contactName: name } }).catch(() => {});
  } catch {}
});

// Detect human replies (from inbox)
client.on("message_create", async (msg) => {
  if (!msg.fromMe) return;
  const chatId = msg.to;
  if (!chatId || chatId.endsWith("@g.us") || chatId === "status@broadcast") return;
  // Don't store if sent via HTTP (already stored by API)
  // Only store if sent from WhatsApp directly
});

// HTTP Server
const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: botStatus,
      qrUrl: latestQR ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(latestQR)}` : null,
      needsQR: botStatus === "esperando_qr",
    }));
    return;
  }

  if (req.method === "POST" && req.url === "/send") {
    let body = "";
    req.on("data", (c) => body += c);
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { chatId, phone, message, mediaUrl, mediaBase64, mediaCaption, mediaMime, mediaFilename } = data;

        let target = chatId;
        if (!target && phone) {
          let num = phone.replace(/\D/g, "");
          if (num.startsWith("0")) num = num.slice(1);
          if (!num.startsWith("549")) num = num.startsWith("54") ? "549" + num.slice(2) : "549" + num;
          target = num + "@c.us";
        }

        if (!target || (!message && !mediaUrl && !mediaBase64)) {
          res.writeHead(400);
          res.end('{"error":"chatId/phone and message required"}');
          return;
        }

        if (mediaBase64) {
          const media = new MessageMedia(mediaMime || "application/pdf", mediaBase64, mediaFilename || "document.pdf");
          await client.sendMessage(target, media, { caption: mediaCaption || "" });
        } else if (mediaUrl) {
          // Local file
          if (mediaUrl.startsWith("/")) {
            const filePath = path.join(BOT_ROOT, "public", mediaUrl);
            if (fs.existsSync(filePath)) {
              const fileData = fs.readFileSync(filePath);
              const ext = path.extname(filePath).slice(1);
              const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp4: "video/mp4", pdf: "application/pdf", mp3: "audio/mpeg", ogg: "audio/ogg" };
              const mime = mimeMap[ext] || "application/octet-stream";
              const media = new MessageMedia(mime, fileData.toString("base64"), path.basename(filePath));
              await client.sendMessage(target, media, { caption: mediaCaption || message || "" });
            }
          } else {
            const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
            await client.sendMessage(target, media, { caption: mediaCaption || message || "" });
          }
        } else {
          await client.sendMessage(target, message);
        }

        const logMsg = mediaCaption || message || "[Media]";
        storeMessage(target, "out", logMsg, data.sender || "human");
        console.log(`[SENT] ${target}: ${logMsg.substring(0, 60)}`);

        res.writeHead(200);
        res.end('{"ok":true}');
      } catch (e) {
        console.error("Send error:", e.message);
        res.writeHead(500);
        res.end(`{"error":"${e.message}"}`);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, "127.0.0.1", () => console.log(`Bot HTTP on :${PORT}`));

// Start WhatsApp
console.log("Bot iniciando...");
client.initialize();
