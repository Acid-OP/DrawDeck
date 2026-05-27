# 🎨 DrawDeck

> A modern, privacy‑first, whiteboard with realtime collab, E2EE, and integrated video chat.

DrawDeck lets you sketch ideas, take notes, and collaborate live. It ships with three usage modes, strong client‑side encryption, and a lean, containerized monorepo you can self‑host in minutes.
---
## ✨ Features

* **Three modes**

  * **Solo** — just open and draw. **End‑to‑end encrypted (E2EE)**; nothing leaves your device unencrypted.
  * **Private (Duo)** — 1:1 collaboration with **peer‑to‑peer WebRTC** video/audio and a lightweight WebSocket control channel. **E2EE** drawing payloads.
  * **Group** — many participants with live shape broadcast over WebSocket. Drawing payloads are encrypted with the room key and relayed by the server (see *Security Notes*).
* **Privacy first** — client‑side room keys, ephemeral sessions, zero persistence by default.
* **Fast Canvas** — a custom canvas engine with selection, shapes, pencil, text, arrows, eraser, and keyboard shortcuts.
* **Rate limiting & queuing** — IP‑aware server limits + client‑side message queue with backoff to keep rooms smooth.
* **Video calling** — built‑in WebRTC for Duo rooms.
* **Authentication** — NextAuth with Google OAuth (optional for Solo, required for some org setups).
* **Modern stack** — Next.js, TypeScript, Tailwind, shadcn/ui, native WebSocket (no Socket.IO), WebRTC, Docker.
* **Monorepo** — `apps/DrawDeck` (frontend), `apps/ws` (WebSocket), `apps/rtc` (RTC signaling).

---

## 📦 Monorepo layout

```
.
├─ apps/
│  ├─ DrawDeck/         # Next.js frontend (client + minimal server routes)
│  ├─ ws/               # WebSocket server (rooms, shapes broadcast, rate limit)
│  └─ rtc/              # RTC signaling server (for Duo video)
├─ packages/            # Shared packages
├─ docker/
│  ├─ Dockerfile.frontend
│  ├─ Dockerfile.websocket
│  └─ Dockerfile.rtc
├─ turbo.json           # Turborepo pipelines
├─ pnpm-workspace.yaml
└─ .github/workflows/   # CI/CD
```

---

## 🚀 Quick start (local dev)

**Prereqs**

* Node 18+ (Node 20 recommended)
* pnpm 9+

```bash
pnpm install
pnpm dev
```

By default this will run:

* Frontend at **[http://localhost:3000](http://localhost:3000)**
* WS server at **ws\://localhost:8082**
* RTC signaling at **[http://localhost:8081](http://localhost:8081)**

> You can also start services individually:
>
> ```bash
> pnpm --filter @app/drawdeck dev     # or: cd apps/DrawDeck && pnpm dev
> pnpm --filter @app/ws dev           # or: cd apps/ws && pnpm start
> pnpm --filter @app/rtc dev          # or: cd apps/rtc && pnpm start
> ```

---

## 🔧 Configuration

Environment variables are provided via `.env.local` in each app (never commit secrets). Keep a public template at `.env.example`.

### Frontend (`apps/DrawDeck`)

```
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_RTC_URL=
NEXT_PUBLIC_SITE_URL=

# NextAuth (optional locally)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

### WebSocket (`apps/ws`)

```
PORT=
# rate limiting, secrets, etc. (implementation-specific)
```

### RTC signaling (`apps/rtc`)

```
PORT=
```

## 🧱 Architecture overview (What makes DrawDeck different)

```
┌────────────┐     WebRTC (P2P media)     ┌────────────┐
│  Client A  │◀──────────────────────────▶│  Client B  │
│  (Duo)     │                            │  (Duo)     │
└─────┬──────┘        Signaling (HTTP/WS) └─────┬──────┘
      │                                         │
      │   Shapes/events (WS, encrypted)         │
      ▼                                         ▼
           ┌───────────────────────────────────┐
           │          WS Server (apps/ws)      │
           │  - Rooms & membership             │
           │  - Broadcast shapes/events        │
           │  - Rate limit & IP cache          │
           └───────────────────────────────────┘

           ┌───────────────────────────────────┐
           │          RTC Signaling            │
           │          (apps/rtc)               │
           └───────────────────────────────────┘

           ┌───────────────────────────────────┐
           │        Next.js Frontend           │
           │        (apps/DrawDeck)            │
           └───────────────────────────────────┘
```

Next.js 15 Frontend-First — runs both client UI and lightweight server routes. Backend services (ws, rtc) are kept minimal.

No Mandatory Auth — anyone can instantly start drawing in Solo mode. Auth (Google OAuth via NextAuth) is only needed for collaboration or org setups.

Local-Only Solo Mode — drawings are stored locally in the browser and never touch a server.

Peer-to-Peer Collaboration — Duo sessions use WebRTC for direct audio/video and E2EE drawing sync.

Group Mode with Secure Broadcast — multiple participants sync shapes over a WebSocket layer; payloads are encrypted with a room key.

Ephemeral by Design — no canvas history is persisted unless you extend it. All sessions are temporary.

Encrypted Everywhere — all drawing data is encrypted client-side with room keys; servers only relay ciphertext.

Hook-based WebSocket Client — a clean React abstraction for connecting, syncing shapes, and handling backpressure.

Rate Limiting + Queueing — IP-aware rate limiting server-side; client has a message queue with retry/backoff.

### Modes

* **Solo** — local only; drawing payloads encrypted client‑side; nothing readable server‑side.
* **Private (Duo)** — WebRTC for media (P2P), WebSocket for control/shapes; room key E2EE.
* **Group** — many participants over WS; shapes encrypted with room key and relayed by server. See notes below.

### Canvas core

* Primitive types: rectangle, diamond, circle, arrow, line, pencil, text, eraser, select, pan/hand.
* Keyboard shortcuts: `1..0` map to tools (hand/select/shape…)
* Message batching & prioritization when broadcasting.

---

## 🔐 Security & privacy notes

* **Room keys** are generated/handled client‑side and used to encrypt shape payloads.
* **Solo & Duo** are **end‑to‑end encrypted**: payloads are unreadable by the server.
* **Group**: payloads are encrypted with the room key and relayed by the WS server. If the server never sees decrypted content, this is *room‑key encryption with relay*. Depending on your threat model, treat this as *E2EE* if keys never leave clients; otherwise as *transport+payload encryption*.
* **No persistence by default** — sessions are ephemeral; add storage if you need history.
* **Auth** — NextAuth + Google OAuth when you want identity; Solo can be anonymous.
---

## 🚦 Rate limiting & backpressure

* **Server‑side**: IP‑aware rate limiting; the server can return `rate_limit_exceeded` with `retryAfter`.
* **Client‑side**: a token bucket (default \~50 msgs/min per client, configurable) + a priority queue. When over limit, DrawDeck queues messages and drains gradually (every \~2s) to avoid bursts.
* **Connection attempts**: exponential backoff with temporary blocks after repeated failures.

---

## 🐳 Docker

Build images (from repo root):

```bash
# Frontend
docker build -f docker/Dockerfile.frontend -t acidop/drawdeck-frontend:dev .

# WebSocket
docker build -f docker/Dockerfile.websocket -t acidop/drawdeck-ws:dev .

# RTC
docker build -f docker/Dockerfile.rtc -t acidop/drawdeck-rtc:dev .
```

Run containers:

```bash
# Frontend (port 3000)
docker run -d --name drawdeck-frontend -p port-machine:port-locally \
  -e NEXT_PUBLIC_WS_URL=ws://your-host:port-ws \
  -e NEXT_PUBLIC_RTC_URL=http://your-host:port-rtc \
  -e NEXT_PUBLIC_SITE_URL=http://your-host:port \
  -e GOOGLE_CLIENT_ID=... -e GOOGLE_CLIENT_SECRET=... \
  -e NEXTAUTH_URL=http://your-host:port -e NEXTAUTH_SECRET=... \
  acidop/drawdeck-frontend:dev

# WebSocket (port )
docker run -d --name drawdeck-ws -p machine-port:port-ws acidop/drawdeck-ws:dev

# RTC (port 8081)
docker run -d --name drawdeck-rtc -p machine-port:port-rtc acidop/drawdeck-rtc:dev
```

## ⚙️ CI/CD (GitHub Actions)

* Each service has its own workflow (`frontend`, `ws`, `rtc`).
* **Path filters** ensure we only build/deploy when files in that app change.
* Images are tagged with commit SHA (and optionally `latest`).
* VM deploy script stops the old container, pulls the new image, runs it, and prunes old images.

---

## 🧪 Scripts

Common root scripts:

* `pnpm build` — Turborepo build for all apps
* `pnpm dev` — start dev servers
* `pnpm lint` — lint all packages
* `pnpm check-types` — typecheck
* `pnpm start:client` — start frontend (production)
* `pnpm start:ws` — start WebSocket server
* `pnpm start:rtc` — start RTC signaling server

---

## 🤝 Contributing

PRs and issues welcome! Please:

1. Fork & branch from `main`.
2. `pnpm install` and run `pnpm dev` to reproduce.
3. Add or update tests if applicable.
4. Open a PR with a clear description and screenshots/gifs.

---

## 📜 License

MIT. See `LICENSE`.

---

## Acknowledgements

