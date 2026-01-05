# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chord is a voice-to-X/Twitter application that records voice memos and automatically posts them to X/Twitter with AI-powered transcription and formatting.

**Architecture**: Full-stack monorepo
- **Backend**: Python/Flask API (`backend/`)
- **Frontend**: React SPA (`frontend/`)

## Development Commands

### Running the Full Stack

**Backend** (runs on port 5002):
```bash
cd backend
python app.py
```

**Frontend** (runs on port 3000):
```bash
cd frontend
npm start
```

Both servers must be running for the application to work.

### Backend Setup

Install dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install flask flask-cors openai tweepy python-dotenv
```

**Environment Variables**: Create `backend/.env` with:
- `OPENAI_API_KEY`
- `X_API_KEY`, `X_API_SECRET`
- `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`
- `X_BEARER_TOKEN`

### Frontend Commands

```bash
cd frontend
npm start    # Development server
npm test     # Run tests
npm build    # Production build
```

## Architecture

### Request Flow

1. **Voice Recording** → Frontend captures audio (MediaRecorder API)
2. **Transcription** → `POST /transcribe` converts audio to text via OpenAI Whisper
3. **Formatting** → `POST /format` transforms transcript into NR76 Twitter style via GPT-4
4. **Posting** → `POST /post` publishes to X/Twitter via Tweepy

### Backend (`backend/app.py`)

Single-file Flask application with four endpoints:
- `POST /transcribe` - Audio file → Whisper transcription
- `POST /format` - Transcript → GPT-4 formatted tweet (NR76 style)
- `POST /post` - Content → X/Twitter post
- `GET /health` - Health check

**Key Dependencies**: Flask, Flask-CORS, OpenAI SDK, Tweepy

**Audio Handling**: Accepts `.webm` files via multipart/form-data, uses temporary files for processing

**NR76 Style System Prompt**: Lines 58-87 in `app.py` define the tweet formatting voice (direct, contrarian, period-heavy, no hashtags/emojis)

### Frontend (`frontend/src/`)

**Main Component**: `VoiceRecorder.js`

**Flow**:
1. Record button → starts MediaRecorder
2. Stop recording → `processAudio()` calls `/transcribe` then `/format`
3. Editable formatted post displayed
4. "Post to X" button → calls `/post`

**UI States**: Recording, Processing, Transcribing, Formatting, Ready to post

**API Integration**: Hardcoded to `http://localhost:5002` (lines 52, 58, 74 in VoiceRecorder.js)

## Key Implementation Details

### Modifying Tweet Style
Edit the `system_message` variable in `backend/app.py` (lines 58-87) to change GPT-4 formatting behavior.

### CORS Configuration
Backend allows requests from `http://localhost:3000` only. Update `app.py:12` for different origins.

### Audio Format
Frontend sends `.webm` audio files. Backend uses `tempfile.NamedTemporaryFile` for temporary storage, cleaned up with `os.unlink()` after processing.
