import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    try {
      const contents = await readFile(resolve(process.cwd(), filename), "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match || process.env[match[1]] !== undefined) continue;

        let value = match[2];
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[match[1]] = value;
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function telegram(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing from .env.local.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.description ?? `Telegram API returned ${response.status}.`);
  }
  return result.result;
}

async function discoverChatId() {
  const updates = await telegram("getUpdates", {
    allowed_updates: ["message"],
    limit: 100,
  });
  const chats = new Map();

  for (const update of updates) {
    const chat = update.message?.chat;
    if (chat) chats.set(String(chat.id), chat);
  }

  if (chats.size === 0) {
    throw new Error(
      "No chat found. Open your bot in Telegram, press Start, send it a message, and retry.",
    );
  }

  for (const [id, chat] of chats) {
    const name =
      [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
      chat.title ||
      chat.username ||
      "Unnamed chat";
    console.log(`${id}\t${name}`);
  }
}

async function sendMessage(message) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is missing from .env.local.");
  }
  if (!message.trim()) {
    throw new Error('Provide a message, for example: npm run telegram:send -- "Hello"');
  }

  const sent = await telegram("sendMessage", {
    chat_id: chatId,
    text: message,
    disable_web_page_preview: true,
  });
  console.log(`Telegram message sent (message ID ${sent.message_id}).`);
}

await loadLocalEnv();

try {
  if (process.argv[2] === "--discover-chat-id") {
    await discoverChatId();
  } else {
    await sendMessage(process.argv.slice(2).join(" "));
  }
} catch (error) {
  console.error(`Telegram notification failed: ${error.message}`);
  process.exitCode = 1;
}
