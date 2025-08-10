🎨 DrawDeck | Hand-drawn look & feel • Collaborative • Secure • Video Calls
DrawDeck is a web-based collaborative whiteboard where multiple users can draw, edit, brainstorm, and even talk face-to-face in real time. Whether solo or in a group session, the app offers a smooth, intuitive canvas experience with real-time sync, shape tools, editable text, built-in video calling, and privacy-focused end-to-end encryption — all without needing an account.

✅ Core Features
Canvas Drawing: Freehand, shapes, and editable text

Rough.js Support: Optional sketch-style drawing

Perfect-freehand Support: Hand drawn feel

Eraser Tool: Remove individual shapes

Editable Text: Double-click to edit on canvas

Built-in Video Calls: Talk and collaborate with participants directly in the same session — no extra tools needed

🔗 Collaboration
Real-time Sync: WebSocket-powered live drawing

Multi-Tab Awareness: No duplicate join/leave events

Optimistic Updates: Instant feedback before server response

Video Conferencing: Peer-to-peer or group calls inside the app to discuss and ideate without leaving the board

🔐 Privacy & End-to-End Encryption (E2EE)
DrawDeck is built with privacy by design to ensure that no sensitive drawing or call data can be accessed by anyone other than the intended participants.

🔑 How It Works
When a user creates or joins a room, the app generates a link like:

bash
Copy
Edit
https://drawdeck.com#room=abc123,xyz456
abc123: Unique room ID (used by the server)

xyz456: Encryption key (used only on the client)

🧠 Key Never Touches the Server
The encryption key after the comma (xyz456) is part of the URL fragment (#...).

This fragment is never sent in HTTP requests, meaning:

The server cannot see or store the encryption key.

🔒 Client-Side Only Decryption
All drawing data and call signaling messages are encrypted.

The decryption and rendering happen completely on the client-side using the key from the URL.

Even if someone intercepts the WebSocket traffic, they cannot decrypt the data without the key.

🛡️ Benefits
No one — not even the server — can read or hear what’s shared in a room without the key.

Ensures confidentiality for private brainstorming, teaching, or design sessions.

🧠 Reliability
Message Queue: Stores unsent messages in memory/localStorage

Auto Retry: Flushes queued messages on reconnect

🧭 Modes
Standalone Mode: Offline/local drawing

Room Mode: Collaborative sessions with optional video calls

⚙️ Tech Stack
Frontend: React (Vite), TypeScript, Tailwind CSS

Canvas: HTML Canvas API + Custom Engine

Realtime: Native WebSocket (useWebSocket hook)

Security: Hash-based E2EE

Video Calls: WebRTC + Encrypted Peer Connections

🌍 Open Source & Contributions
I want DrawDeck to be open source so that other students and developers can explore and learn from it.
If you'd like to contribute—whether it's improving the UI, optimizing performance, or adding new features—feel free to open an issue or submit a pull request!

🧠 How to Contribute
Fork the Repo and clone it locally

Run pnpm install and pnpm dev to start the dev server

Check the Issues tab for open tasks — especially those labeled good first issue

Follow the CONTRIBUTING.md (coming soon) for guidelines

Submit a Pull Request — even small improvements matter!

💡 Ideas for Contribution:

Add undo/redo support in standalone mode

Add support for duplicating a selected shape using Ctrl + D keyboard shortcut

Fix: Rounded corners not working for Diamond shape

Improve video call UI with grid layout for multiple participants

📄 Architecture Overview
Next.js 15 for Fullstack: Frontend and backend handled together using server actions. No separate HTTP services.

No Mandatory Auth for Canvas Use: Users can draw without logging in. Auth is only required for collaboration.

Server Actions Instead of REST APIs: Room creation, joining, and user management handled through server actions.

Standalone Mode with Local Storage: For solo drawing sessions, data is stored locally and never sent to a server.

Interactive Room Collaboration Mode: Shows participant presence, names, and avatars in real-time sync.

End-to-End Encrypted Collaboration & Video Calls: No drawn shapes, chat, or call streams are stored in any database.

Hookified WebSocket & WebRTC Layer: Abstracts connection logic with clean React patterns.

📄 License
This project is licensed under a Custom Personal Use License — you may view and learn from the code, but commercial use, redistribution, or claiming authorship is strictly prohibited.
See the full LICENSE for details.

