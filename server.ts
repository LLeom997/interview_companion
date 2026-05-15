import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PORT = 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in environment (.env.local)");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); // Removed path: '/ws' to match frontend hook

const OPENAI_URL = "wss://api.openai.com/v1/realtime?intent=transcription";

const ts = () => new Date().toISOString().slice(11, 23);

wss.on("connection", (client) => {
  console.log(`[${ts()}] [client] connected`);

  const upstream = new WebSocket(OPENAI_URL, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  });

  const sendLog = (msg: string) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "proxy.log", message: msg }));
    }
  };

  let upstreamReady = false;
  const pending: string[] = [];

  upstream.on("open", () => {
    console.log(`[${ts()}] [openai] connected`);
    sendLog("upstream connected to OpenAI");
    upstream.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "transcription",
          audio: {
            input: {
              format: { type: "audio/pcm", rate: 24000 },
              transcription: {
                model: "gpt-realtime-whisper",
                language: "en",
              },
            },
          },
        },
      })
    );
    upstreamReady = true;
    while (pending.length) {
      const msg = pending.shift();
      if (msg) upstream.send(msg);
    }
  });

  upstream.on("message", (data) => {
    const raw = data.toString();
    try {
      const evt = JSON.parse(raw);
      if (evt.type && !evt.type.endsWith(".delta")) {
        console.log(`[${ts()}] [openai] ${evt.type}`);
      }
      if (evt.type === "error") {
        console.log(`[${ts()}] [openai] error:`, JSON.stringify(evt.error));
      }
    } catch { }
    if (client.readyState === WebSocket.OPEN) client.send(raw);
  });

  upstream.on("close", (code, reason) => {
    console.log(`[${ts()}] [openai] closed`, code, reason.toString());
    sendLog(`upstream closed (${code})`);
    if (client.readyState === WebSocket.OPEN) client.close();
  });

  upstream.on("error", (err) => {
    console.error(`[${ts()}] [openai] error`, err.message);
    sendLog(`upstream error: ${err.message}`);
  });

  client.on("message", (data) => {
    const payload = data.toString();
    if (upstreamReady) upstream.send(payload);
    else pending.push(payload);
  });

  client.on("close", () => {
    console.log(`[${ts()}] [client] disconnected`);
    if (upstream.readyState === WebSocket.OPEN) upstream.close();
  });
});

server.listen(PORT, () => {
  console.log(`Realtime Whisper app listening on http://localhost:${PORT}`);
});
