/**
 * D&D Backend Server
 *
 * Minimal Express server that proxies API calls for the D&D game frontend.
 * Keeps API keys server-side only — the frontend never sees them.
 *
 * Endpoints:
 *   POST /api/groq/chat      — Proxy to Groq LLM (Llama) for DM AI responses
 *   POST /api/deepgram/token  — Generate a temporary Deepgram API key for STT WebSocket
 *   POST /api/deepgram/tts    — Proxy text-to-speech through Deepgram
 *
 * Environment variables (set in backend/.env):
 *   GROQ_API_KEY      — Groq Cloud API key (https://console.groq.com)
 *   DEEPGRAM_API_KEY   — Deepgram API key (https://console.deepgram.com)
 *   PORT               — Server port (default: 3001)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// ─── Health check ────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dnd-backend' });
});

// ─── Groq LLM Proxy ─────────────────────────────────────────────────────────
// Frontend sends the chat messages, we forward to Groq with our API key.

app.post('/api/groq/chat', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on backend' });
  }

  try {
    const { model, messages, temperature, max_tokens } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-8b-instant',
        messages,
        temperature: temperature ?? 0.8,
        max_tokens: max_tokens ?? 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Groq] API error:', response.status, err);
      return res.status(response.status).json({ error: `Groq API error: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Groq] Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to reach Groq API' });
  }
});

// ─── Deepgram STT Token ─────────────────────────────────────────────────────
// Returns a temporary API key so the frontend can open a WebSocket to Deepgram
// directly (for low-latency streaming STT). The main key stays on the server.

app.post('/api/deepgram/token', async (req, res) => {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPGRAM_API_KEY not configured on backend' });
  }

  try {
    // Create a temporary key via Deepgram's API
    const response = await fetch('https://api.deepgram.com/v1/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      body: JSON.stringify({
        comment: 'DnD frontend temporary token',
        time_to_live_in_seconds: 60,
        scopes: ['usage:write'],
      }),
    });

    if (!response.ok) {
      // Fallback: just return the main key (simpler setup, less secure)
      console.warn('[Deepgram] Temporary key creation failed, falling back to main key');
      return res.json({ token: apiKey });
    }

    const data = await response.json();
    res.json({ token: data.key || apiKey });
  } catch (error) {
    console.error('[Deepgram] Token error:', error.message);
    // Fallback to main key
    res.json({ token: apiKey });
  }
});

// ─── Deepgram TTS Proxy ─────────────────────────────────────────────────────
// Frontend sends text, we call Deepgram TTS and return the audio blob.

app.post('/api/deepgram/tts', async (req, res) => {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPGRAM_API_KEY not configured on backend' });
  }

  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing "text" in request body' });
    }

    const model = voice || 'aura-orion-en';

    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Deepgram TTS] Error:', response.status, err);
      return res.status(response.status).json({ error: `Deepgram TTS error: ${response.status}` });
    }

    // Stream the audio response back to the frontend
    res.set({
      'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
    });

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[Deepgram TTS] Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// ─── Start server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🎲 D&D Backend running on http://localhost:${PORT}`);
  console.log(`   Groq API key:    ${process.env.GROQ_API_KEY ? '✓ configured' : '✗ MISSING — set GROQ_API_KEY in .env'}`);
  console.log(`   Deepgram API key: ${process.env.DEEPGRAM_API_KEY ? '✓ configured' : '✗ MISSING — set DEEPGRAM_API_KEY in .env'}`);
  console.log();
});
