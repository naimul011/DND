# 🎯 Cortify Frontend - Next.js + Electron App

React-based frontend with Electron wrapper providing P2P audio conversations and AI transcription.

## 🚀 Quick Start

```bash
npm install
npm run dev    # Starts Next.js + Electron
```

## 📁 Project Structure

```
frontend/
├── src/                    # React components & utilities
│   ├── components/         # React components
│   │   ├── AudioCapture.tsx
│   │   ├── P2PAudioRoom.tsx
│   │   └── P2PTranscription.tsx
│   ├── utils/             # Utility functions
│   │   └── webRTCManager.ts
│   └── styles/            # Global styles
├── pages/                 # Next.js pages
├── public/               # Static assets
├── electron/             # Electron main process
│   ├── main/main.js      # Electron main
│   ├── main/audioCapture.js
│   └── preload/preload.js
├── package.json          # Frontend dependencies
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

## ⚡ Scripts

```bash
# Development
npm run dev          # Start Next.js + Electron
npm run dev:next     # Next.js only
npm run dev:electron # Electron only

# Build
npm run build        # Build for production
npm run dist         # Create distributable
```

## 🎤 Key Features

### P2P Audio Conversations
- WebRTC-based real-time audio
- Create/join rooms with invite system
- Cross-device compatibility

### Audio Capture
- Microphone input
- System audio capture
- P2P room conversations

### AI Transcription
- Real-time Deepgram transcription
- Speaker identification (P1/P2)
- Integrated chat interface

## 🔧 Environment Variables

Create `.env` file:
```env
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

## 🌐 Backend Connection

Frontend connects to:
- Backend server: `http://localhost:3001`
- WebRTC signaling via Socket.io

## 📱 Components Overview

### `AudioCapture.tsx`
Main audio capture interface with mode selection:
- 🎤 Microphone
- 🖥️ System Audio
- 👥 P2P Room

### `P2PAudioRoom.tsx`
P2P room management:
- Create new rooms
- Join existing rooms
- Participant management
- Mute/unmute controls

### `P2PTranscription.tsx`
Headless transcription component:
- Integrates with WebRTC audio
- Deepgram API integration
- Real-time transcription broadcasting

### `webRTCManager.ts`
WebRTC connection management:
- Peer-to-peer connections
- Socket.io signaling
- Audio stream handling

## 🎯 Usage

1. **Start Backend**: Ensure backend is running on port 3001
2. **Start Frontend**: `npm run dev`
3. **Select P2P Mode**: Choose "👥 P2P Room"
4. **Create/Join Room**: Follow UI prompts
5. **Real-Time Conversation**: Talk and get transcribed!

## 🐛 Troubleshooting

### Common Issues

**"Backend connection failed"**
- Ensure backend is running on port 3001
- Check CORS configuration

**"WebRTC connection failed"**
- Check microphone permissions
- Try different browser (Chrome recommended)
- Check network/firewall settings

**"Transcription not working"**
- Verify Deepgram API key
- Check microphone access
- Ensure internet connectivity

## 🔧 Development Tips

- Use Chrome DevTools for WebRTC debugging
- Monitor Network tab for Socket.io connections
- Check Console for WebRTC connection logs
- Use `about:webrtc-internals` in Chrome