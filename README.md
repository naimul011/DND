# 🐉 DND — AI Dungeon Master

A browser-based D&D game with an AI Dungeon Master, isometric 3D world, and multiplayer turn-based gameplay.

![Three.js](https://img.shields.io/badge/Three.js-black?logo=threedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)

## ✨ Features

- **AI Dungeon Master** — Groq LLM narrates the story, scores player actions, and drives the campaign
- **Isometric 3D World** — Procedural Three.js map with trees, rocks, bushes, fog, fireflies, and player tokens
- **DM Character Token** — Robed wizard NPC on the map with speech bubbles for DM narration
- **Floating Input Chathead** — Type actions directly above your character on the map (quick actions, mic, text input)
- **Multiplayer Turn System** — Round-robin turns with character creation party setup
- **Dice Roller** — Animated d4–d20 dice, usable both in chat and as a floating bar on the map
- **Voice I/O** — DM text-to-speech (Deepgram) + player speech-to-text via browser mic
- **Glassmorphism UI** — Collapsible sidebar, character sheets, scoreboard, voice controls — all floating over the 3D world
- **Campaign Generator** — Randomized story hooks, towns, and themes

## 🏗️ Project Structure

```
DND/
├── frontend/           # Next.js + Three.js Frontend
│   ├── pages/         # Next.js pages (dnd.tsx is the game)
│   ├── src/
│   │   ├── components/dnd/  # Game UI components
│   │   │   ├── IsometricWorld.tsx   # Three.js 3D world
│   │   │   ├── CharacterCreator.tsx # Character creation form
│   │   │   ├── PartySetupScreen.tsx # Party + campaign setup
│   │   │   ├── DiceRoller.tsx       # Animated dice roller
│   │   │   ├── MessageBubble.tsx    # Chat message display
│   │   │   ├── CollapsiblePanel.tsx # Sidebar panel wrapper
│   │   │   └── ...
│   │   ├── hooks/           # useDnDGame, useDnDVoice
│   │   ├── services/        # API + voice service layers
│   │   └── data/            # Story templates
│   └── package.json
│
├── backend/            # Express API Proxy
│   ├── src/server.js   # Proxies Groq LLM + Deepgram APIs
│   └── package.json
│   ├── src/           # Server code
│   │   └── server.js  # Socket.io signaling server
│   └── .env           # Backend environment
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Groq](https://console.groq.com/) API key (free tier works)
- *(Optional)* A [Deepgram](https://deepgram.com/) API key for DM voice

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # Add GROQ_API_KEY (and optionally DEEPGRAM_API_KEY)
npm run dev             # Starts on http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

Then open **http://localhost:3000/dnd** to play.

## 🎮 How to Play

1. **Create your party** — Pick a campaign theme, name your characters, choose race/class/background
2. **Explore the world** — The AI Dungeon Master sets the scene; your 3D tokens appear on the map
3. **Take actions** — Type what your character does (or use quick actions / voice), roll dice
4. **Turn-based** — Each player acts in turn; the DM responds with narration and scoring
5. **Toggle views** — Switch between the chat panel and the full 3D map with floating chatheads

## 🔧 Environment Variables

### Backend `.env`
```env
PORT=3001
GROQ_API_KEY=gsk_...          # Required — powers the AI Dungeon Master
DEEPGRAM_API_KEY=...           # Optional — enables DM text-to-speech
```

## 📄 License

MIT

### Frontend (.env)
```env
DEEPGRAM_API_KEY=your_api_key_here
```

## 🎯 Architecture

- **Frontend**: Next.js + React + Electron + WebRTC
- **Backend**: Node.js + Express + Socket.io
- **Real-Time**: WebRTC for P2P audio, Socket.io for signaling
- **Transcription**: Deepgram API for speech-to-text

## 🚀 Next Steps

- [ ] System Audio Capture Enhancement
- [ ] TURN server for production deployment
- [ ] Mobile app support
- [ ] Group conversations (3+ participants)

---

**Happy coding! 🎉**# DND
