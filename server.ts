import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Server state
interface StoredMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  type: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  audioDuration?: number;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  starred?: boolean;
  reactions?: Record<string, string[]>;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
}

interface StoredChat {
  id: string;
  name: string;
  isGroup: boolean;
  avatar: string;
  participants: string[];
  unreadCount: number;
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
  lastMessage?: StoredMessage;
  online?: boolean;
  lastSeen?: string;
  about?: string;
  phone?: string;
  createdAt?: string;
}

// Initial mock data with rich Arabic WhatsApp conversations
const initialChats: StoredChat[] = [
  {
    id: "chat-1",
    name: "مجموعة العائلة 🏡",
    isGroup: true,
    avatar: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150&auto=format&fit=crop&q=80",
    participants: ["user-me", "user-mom", "user-ahmed", "user-noor"],
    unreadCount: 2,
    pinned: true,
    about: "بيت العز والبركة ❤️",
    createdAt: "2024-01-15",
  },
  {
    id: "chat-2",
    name: "م. خالد المنصور",
    isGroup: false,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    participants: ["user-me", "user-khaled"],
    unreadCount: 0,
    pinned: true,
    online: true,
    about: "مهندس برمجيات | متصل في أوقات العمل فقط 💻",
    phone: "+966 50 123 4567",
  },
  {
    id: "chat-3",
    name: "سارة العلي",
    isGroup: false,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    participants: ["user-me", "user-sara"],
    unreadCount: 1,
    online: true,
    about: "كن جميلاً ترى الوجود جميلاً 🌸",
    phone: "+966 55 987 6543",
  },
  {
    id: "chat-4",
    name: "فريق التطوير والتقنية 💻",
    isGroup: true,
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
    participants: ["user-me", "user-khaled", "user-tariq", "user-layla"],
    unreadCount: 0,
    about: "مشاريع التطوير ومناقشة التحديثات الأسبوعية",
    createdAt: "2024-02-01",
  },
  {
    id: "chat-5",
    name: "د. عمر الشريف",
    isGroup: false,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    participants: ["user-me", "user-omar"],
    unreadCount: 0,
    online: false,
    lastSeen: "آخر ظهور اليوم 2:15 م",
    about: "استشاري تقنية معلومات وباحث أكاديمي",
    phone: "+966 54 333 2211",
  },
  {
    id: "chat-6",
    name: "خدمة العملاء والدعم الفني 🌟",
    isGroup: false,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    participants: ["user-me", "user-support"],
    unreadCount: 0,
    online: true,
    about: "الحساب الرسمي لخدمة العملاء والدعم المباشر ✔️",
    phone: "+966 800 124 0000",
  },
];

const initialMessages: Record<string, StoredMessage[]> = {
  "chat-1": [
    {
      id: "m-101",
      chatId: "chat-1",
      senderId: "user-mom",
      senderName: "الوالدة الغالية ❤️",
      text: "السلام عليكم يا أبنائي، لا تنسوا الغداء اليوم مع بعض إن شاء الله الساعة 3 عصراً.",
      type: "text",
      timestamp: "10:30 ص",
      status: "read",
    },
    {
      id: "m-102",
      chatId: "chat-1",
      senderId: "user-ahmed",
      senderName: "أحمد",
      text: "وعليكم السلام يا أمي، أبشري إن شاء الله أكون جاهز وأمر على الحلويات.",
      type: "text",
      timestamp: "10:32 ص",
      status: "read",
      reactions: { "❤️": ["الوالدة الغالية ❤️", "أنا"] },
    },
    {
      id: "m-103",
      chatId: "chat-1",
      senderId: "user-noor",
      senderName: "نور",
      text: "أنا جهزت السلطات والمقبلات 🥗 كل شيء جاهز بإذن الله!",
      type: "text",
      timestamp: "11:15 ص",
      status: "read",
    },
    {
      id: "m-104",
      chatId: "chat-1",
      senderId: "user-me",
      senderName: "أنا",
      text: "الله يعطيكم العافية يا رب، في طريقي إليكم بإذن الله.",
      type: "text",
      timestamp: "11:20 ص",
      status: "read",
    },
    {
      id: "m-105",
      chatId: "chat-1",
      senderId: "user-mom",
      senderName: "الوالدة الغالية ❤️",
      text: "في أمان الله وحفظه، منتظرينكم.",
      type: "text",
      timestamp: "11:25 ص",
      status: "delivered",
    },
  ],
  "chat-2": [
    {
      id: "m-201",
      chatId: "chat-2",
      senderId: "user-khaled",
      senderName: "م. خالد المنصور",
      text: "أهلاً وسهلاً أخي العزيز، اطلعت على التقرير البرمجي والنتائج ممتازة جداً!",
      type: "text",
      timestamp: "09:15 ص",
      status: "read",
    },
    {
      id: "m-202",
      chatId: "chat-2",
      senderId: "user-me",
      senderName: "أنا",
      text: "أهلاً مهندس خالد، تسلم يا غالي! قمنا بتحديث الواجهة وإضافة دعم WebSockets التفاعلية بالكامل.",
      type: "text",
      timestamp: "09:20 ص",
      status: "read",
    },
    {
      id: "m-203",
      chatId: "chat-2",
      senderId: "user-khaled",
      senderName: "م. خالد المنصور",
      text: "ما شاء الله، السرعة في الإرسال والاستقبال مذهلة، وكأنك تستخدم تطبيق واتساب الأصلي تماماً 👌",
      type: "text",
      timestamp: "09:22 ص",
      status: "read",
      reactions: { "🔥": ["أنا"] },
    },
  ],
  "chat-3": [
    {
      id: "m-301",
      chatId: "chat-3",
      senderId: "user-sara",
      senderName: "سارة العلي",
      text: "مرحباً! التقطت بعض الصور الرائعة للطبيعة اليوم حبيت أشاركك واحدة منها 🌿",
      type: "text",
      timestamp: "أمس",
      status: "read",
    },
    {
      id: "m-302",
      chatId: "chat-3",
      senderId: "user-sara",
      senderName: "سارة العلي",
      type: "image",
      mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
      text: "شروق الشمس في الجبال الهادئة 🌄",
      timestamp: "أمس",
      status: "read",
    },
    {
      id: "m-303",
      chatId: "chat-3",
      senderId: "user-me",
      senderName: "أنا",
      text: "صورة ساحرة ما شاء الله! دقة الألوان وتوزيع الإضاءة فنانين جداً.",
      type: "text",
      timestamp: "أمس",
      status: "read",
      reactions: { "😍": ["سارة العلي"] },
    },
    {
      id: "m-304",
      chatId: "chat-3",
      senderId: "user-sara",
      senderName: "سارة العلي",
      type: "audio",
      audioDuration: 12,
      timestamp: "10:14 ص",
      status: "delivered",
    },
  ],
  "chat-4": [
    {
      id: "m-401",
      chatId: "chat-4",
      senderId: "user-khaled",
      senderName: "م. خالد",
      text: "تم إطلاق الإصدار 2.4 بنجاح على سيرفرات الإنتاج بدون أي وقت توقف.",
      type: "text",
      timestamp: "08:00 ص",
      status: "read",
    },
    {
      id: "m-402",
      chatId: "chat-4",
      senderId: "user-tariq",
      senderName: "طارق",
      text: "ألف مبروك للفريق الرائع، كل مؤشرات الأداء خضراء ومستقرة تماماً.",
      type: "text",
      timestamp: "08:10 ص",
      status: "read",
    },
  ],
  "chat-5": [
    {
      id: "m-501",
      chatId: "chat-5",
      senderId: "user-omar",
      senderName: "د. عمر الشريف",
      text: "مرحباً، أرسلت لك مسودة المقال العلمي حول أمان المراسلات المشفرة في التطبيقات الحديثة.",
      type: "document",
      fileName: "CyberSecurity_EndToEnd_Encryption.pdf",
      fileSize: "2.4 MB",
      timestamp: "أمس",
      status: "read",
    },
  ],
  "chat-6": [
    {
      id: "m-601",
      chatId: "chat-6",
      senderId: "user-support",
      senderName: "الدعم الفني",
      text: "مرحباً بك في واتساب ويب! فريقنا دائماً في خدمتك لمساعدتك في أي استفسار أو مشكلة تقنية 🤝",
      type: "text",
      timestamp: "12:00 م",
      status: "read",
    },
  ],
};

// Update lastMessage on initial chats
initialChats.forEach((chat) => {
  const msgs = initialMessages[chat.id];
  if (msgs && msgs.length > 0) {
    chat.lastMessage = msgs[msgs.length - 1];
  }
});

let chats = [...initialChats];
const messages = { ...initialMessages };

// REST APIs
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/state", (req, res) => {
  res.json({
    chats,
    messages,
    currentUser: {
      id: "user-me",
      name: "محمد عبدالرحمن",
      phone: "+966 50 000 1122",
      about: "لا حول ولا قوة إلا بالله العلي العظيم",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      online: true,
    },
  });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

function broadcast(data: object, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);

  // Send initial full sync
  ws.send(
    JSON.stringify({
      type: "init",
      payload: {
        chats,
        messages,
        onlineCount: clients.size,
      },
    })
  );

  // Notify everyone of connection count
  broadcast({
    type: "presence:update",
    payload: { onlineCount: clients.size },
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type, payload } = msg;

      switch (type) {
        case "message:send": {
          const { message } = payload;
          if (!message || !message.chatId) return;

          const newMessage: StoredMessage = {
            id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            chatId: message.chatId,
            senderId: message.senderId || "user-me",
            senderName: message.senderName || "أنا",
            senderAvatar: message.senderAvatar,
            text: message.text,
            type: message.type || "text",
            mediaUrl: message.mediaUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            audioDuration: message.audioDuration,
            timestamp: message.timestamp || new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "numeric", hour12: true }).format(new Date()),
            status: "sent",
            replyTo: message.replyTo,
          };

          if (!messages[newMessage.chatId]) {
            messages[newMessage.chatId] = [];
          }
          messages[newMessage.chatId].push(newMessage);

          // Update chat lastMessage
          const targetChat = chats.find((c) => c.id === newMessage.chatId);
          if (targetChat) {
            targetChat.lastMessage = newMessage;
            // Move chat to top of list
            chats = [targetChat, ...chats.filter((c) => c.id !== targetChat.id)];
          }

          // Broadcast new message to all clients
          broadcast({
            type: "message:new",
            payload: { message: newMessage, chat: targetChat },
          });

          // Simulate server ack / delivery
          setTimeout(() => {
            newMessage.status = "delivered";
            broadcast({
              type: "message:status",
              payload: { messageId: newMessage.id, chatId: newMessage.chatId, status: "delivered" },
            });
          }, 400);

          // If message is sent to support bot or another contact, simulate a helpful response
          if (targetChat && !targetChat.isGroup && targetChat.id === "chat-6") {
            setTimeout(() => {
              // Typing indicator
              broadcast({
                type: "chat:typing",
                payload: { chatId: targetChat.id, userName: targetChat.name, isTyping: true },
              });

              setTimeout(() => {
                const autoReplies = [
                  "شكراً لتواصلك معنا! طلبك قيد المتابعة وسيقوم ممثل الخدمة بالرد عليك خلال لحظات قليلة ✨",
                  "أهلاً بك! لقد استلمنا رسالتك وسنعمل على خدمتك بأفضل شكل ممكن 🌟",
                  "نحن دائماً هنا لدعمك. يمكنك استخدام كافة ميزات التطبيق بما فيها التسجيل الصوتي والمكالمات التجريبية!",
                ];
                const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];

                const replyMsg: StoredMessage = {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  chatId: targetChat.id,
                  senderId: targetChat.id,
                  senderName: targetChat.name,
                  text: replyText,
                  type: "text",
                  timestamp: new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "numeric", hour12: true }).format(new Date()),
                  status: "delivered",
                };

                messages[targetChat.id].push(replyMsg);
                targetChat.lastMessage = replyMsg;
                chats = [targetChat, ...chats.filter((c) => c.id !== targetChat.id)];

                broadcast({
                  type: "chat:typing",
                  payload: { chatId: targetChat.id, userName: targetChat.name, isTyping: false },
                });

                broadcast({
                  type: "message:new",
                  payload: { message: replyMsg, chat: targetChat },
                });
              }, 1200);
            }, 600);
          }

          break;
        }

        case "message:read": {
          const { chatId, userId } = payload;
          const chatMsgs = messages[chatId];
          if (chatMsgs) {
            chatMsgs.forEach((m) => {
              if (m.senderId !== userId) {
                m.status = "read";
              }
            });
          }
          const chat = chats.find((c) => c.id === chatId);
          if (chat) {
            chat.unreadCount = 0;
          }

          broadcast({
            type: "message:read",
            payload: { chatId },
          });
          break;
        }

        case "message:react": {
          const { chatId, messageId, emoji, userName } = payload;
          const chatMsgs = messages[chatId];
          if (chatMsgs) {
            const targetMsg = chatMsgs.find((m) => m.id === messageId);
            if (targetMsg) {
              if (!targetMsg.reactions) targetMsg.reactions = {};
              if (!targetMsg.reactions[emoji]) targetMsg.reactions[emoji] = [];

              const existingIndex = targetMsg.reactions[emoji].indexOf(userName);
              if (existingIndex > -1) {
                targetMsg.reactions[emoji].splice(existingIndex, 1);
                if (targetMsg.reactions[emoji].length === 0) {
                  delete targetMsg.reactions[emoji];
                }
              } else {
                targetMsg.reactions[emoji].push(userName);
              }

              broadcast({
                type: "message:updated",
                payload: { chatId, message: targetMsg },
              });
            }
          }
          break;
        }

        case "message:star": {
          const { chatId, messageId } = payload;
          const chatMsgs = messages[chatId];
          if (chatMsgs) {
            const targetMsg = chatMsgs.find((m) => m.id === messageId);
            if (targetMsg) {
              targetMsg.starred = !targetMsg.starred;
              broadcast({
                type: "message:updated",
                payload: { chatId, message: targetMsg },
              });
            }
          }
          break;
        }

        case "message:delete": {
          const { chatId, messageId } = payload;
          if (messages[chatId]) {
            messages[chatId] = messages[chatId].filter((m) => m.id !== messageId);
            const chat = chats.find((c) => c.id === chatId);
            if (chat) {
              const remaining = messages[chatId];
              chat.lastMessage = remaining.length > 0 ? remaining[remaining.length - 1] : undefined;
            }
            broadcast({
              type: "message:deleted",
              payload: { chatId, messageId },
            });
          }
          break;
        }

        case "chat:typing": {
          const { chatId, userId, userName, isTyping } = payload;
          broadcast({
            type: "chat:typing",
            payload: { chatId, userId, userName, isTyping },
          }, ws);
          break;
        }

        case "chat:create": {
          const { name, isGroup, avatar, participants, phone, about } = payload;
          const newChatId = `chat-${Date.now()}`;
          const newChat: StoredChat = {
            id: newChatId,
            name,
            isGroup: !!isGroup,
            avatar: avatar || (isGroup
              ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"),
            participants: participants || ["user-me"],
            unreadCount: 0,
            online: true,
            phone: phone || "+966 5" + Math.floor(10000000 + Math.random() * 90000000),
            about: about || "متاح للتواصل",
            createdAt: new Date().toISOString(),
          };

          chats = [newChat, ...chats];
          messages[newChatId] = [];

          broadcast({
            type: "chat:created",
            payload: { chat: newChat },
          });
          break;
        }

        case "call:signal": {
          // Broadcast call signaling to other peers
          broadcast({
            type: "call:signal",
            payload,
          }, ws);
          break;
        }
      }
    } catch (e) {
      console.error("Failed to parse websocket message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    broadcast({
      type: "presence:update",
      payload: { onlineCount: clients.size },
    });
  });
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`WhatsApp Server is running on port ${PORT}`);
  });
}

startServer();
