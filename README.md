# 🎯 Cortify AI - P2P Audio Conversations

A Cluly-like application with real-time P2P audio conversations and AI-powered transcription.

## 🏗️ Project Structure

```
Cortify/
├── frontend/           # Complete Next.js + Electron Frontend
│   ├── package.json    # Frontend dependencies
│   ├── src/           # React components & utils
│   ├── pages/         # Next.js pages
│   ├── public/        # Static assets
│   ├── electron/      # Electron main process
│   ├── next.config.js # Next.js configuration
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/            # Complete Node.js Backend
│   ├── package.json    # Backend dependencies
│   ├── src/           # Server code
│   │   └── server.js  # Socket.io signaling server
│   └── .env           # Backend environment
│
├── P2P_SETUP.md       # Detailed P2P feature guide
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Deepgram API key (for transcription)

### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env  # Add your Deepgram API key
npm run dev           # Starts on http://localhost:3001
```

### 2. Setup Frontend (New Terminal)
```bash
cd frontend
npm install
npm run dev           # Starts Next.js + Electron
```

## ✨ Features

### 🎤 **P2P Real-Time Audio Conversations**
- WebRTC-based peer-to-peer audio streaming
- Create/join rooms with invite system
- Real-time transcription for both participants
- Cross-device conversations

### 🖥️ **System Audio Capture**
- Capture microphone input
- System audio capture (YouTube, meetings)
- Multiple participant support

### 🤖 **AI Integration**
- Deepgram real-time transcription
- Speaker identification (P1/P2)
- Integrated chat interface

## 🎯 Usage

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Create P2P Room**: Select "👥 P2P Room" in the app
4. **Invite Friend**: Share the room link or ID
5. **Real-Time Conversation**: Both participants can talk and get transcribed

## 📚 Documentation

- [P2P Setup Guide](P2P_SETUP.md) - Detailed P2P feature instructions
- [Frontend README](frontend/README.md) - Frontend-specific documentation
- [Backend README](backend/README.md) - Backend API documentation

## 🛠️ Development

Each service runs independently:

**Backend Development:**
```bash
cd backend
npm run dev    # Socket.io server on :3001
```

**Frontend Development:**
```bash
cd frontend
npm run dev    # Next.js on :3000 + Electron
```

## 🔧 Configuration

### Backend (.env)
```env
PORT=3001
DEEPGRAM_API_KEY=your_api_key_here
```

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
