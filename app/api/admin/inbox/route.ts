import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

function requireAuth() {
  const c = cookies();
  return c.get("admin_session")?.value === "authenticated";
}

// GET: list chats or messages for a specific chat
export async function GET(req: NextRequest) {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  if (chatId) {
    // Get messages for specific chat
    const messages = await prisma.whatsAppMessage.findMany({
      where: { chatId },
      orderBy: { timestamp: "asc" },
      take: 100,
    });

    // Mark as read
    await prisma.whatsAppChat.update({
      where: { chatId },
      data: { unread: 0 },
    }).catch(() => {});

    return NextResponse.json({ messages });
  }

  // List all chats
  const chats = await prisma.whatsAppChat.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ chats });
}

// POST: send a message
export async function POST(req: NextRequest) {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { chatId, message, mediaUrl, mediaType } = await req.json();
  if (!chatId || (!message && !mediaUrl)) {
    return NextResponse.json({ error: "chatId and message/mediaUrl required" }, { status: 400 });
  }

  try {
    // Send via WhatsApp bot
    const botPort = process.env.BOT_PORT || "3002";
    const sendBody: Record<string, string> = { chatId, sender: "human" };
    if (message) sendBody.message = message;
    if (mediaUrl) sendBody.mediaUrl = mediaUrl;

    const res = await fetch(`http://127.0.0.1:${botPort}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendBody),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error || "Error sending" }, { status: 500 });
    }

    // Store message
    await prisma.whatsAppMessage.create({
      data: {
        chatId,
        direction: "out",
        body: message || (mediaUrl ? "[Media]" : ""),
        sender: "human",
        mediaType: mediaType || null,
        mediaUrl: mediaUrl || null,
      },
    });

    // Update chat
    await prisma.whatsAppChat.update({
      where: { chatId },
      data: { lastMessage: (message || "[Media]").substring(0, 200), lastMessageAt: new Date() },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error de conexion" }, { status: 500 });
  }
}

// PATCH: toggle AI pause
export async function PATCH(req: NextRequest) {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { chatId, aiPaused } = await req.json();
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  await prisma.whatsAppChat.update({
    where: { chatId },
    data: { aiPaused: !!aiPaused },
  });

  return NextResponse.json({ ok: true });
}
