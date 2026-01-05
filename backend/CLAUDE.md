# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chord is a voice-to-X/Twitter application that allows users to record voice memos and automatically post them to X/Twitter. The project consists of:

- **Backend** (Python/Flask): `/Users/alessio/Desktop/chord-app/backend/`
- **Frontend** (React): `/Users/alessio/Desktop/chord-app/frontend/`

## Architecture

### Request Flow

1. **Voice Recording** → Frontend captures audio via browser MediaRecorder API
2. **Transcription** → Backend `/transcribe` endpoint uses OpenAI Whisper to convert audio to text
3. **Formatting** → Backend `/format` endpoint uses GPT-4 to transform transcript into NR76 Twitter style
4. **Posting** → Backend `/post` endpoint publishes to X/Twitter via Tweepy

### Backend Architecture (Flask)

**File**: `app.py` (single file application)

**Key Endpoints**:
- `POST /transcribe` - Accepts audio file, returns Whisper transcription
- `POST /format` - Accepts transcript, returns GPT-4 formatted tweet in NR76 style
- `POST /post` - Accepts tweet content, posts to X/Twitter
- `GET /health` - Health check endpoint

**Dependencies**:
- Flask + Flask-CORS for API and CORS handling
- OpenAI SDK for Whisper (transcription) and GPT-4 (formatting)
- Tweepy for X/Twitter API integration
- python-dotenv for environment variable management

**CORS Configuration**: Allows requests from `http://localhost:3000` (frontend dev server)

### Frontend Architecture (React)

**Main Component**: `VoiceRecorder.js`

**Flow**:
1. User clicks record button → starts MediaRecorder
2. User stops recording → triggers `processAudio()`
3. `processAudio()` sequentially calls `/transcribe` then `/format`
4. Formatted post is editable before posting
5. User clicks "Post to X" → calls `/post` endpoint

**UI States**: Recording, Processing, Transcribing, Formatting, Ready to post

## Development Commands

### Backend

**Start Development Server**:
```bash
cd /Users/alessio/Desktop/chord-app/backend
python app.py
```
Server runs on `http://localhost:5002` with debug mode enabled.

**Install Dependencies**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install flask flask-cors openai tweepy python-dotenv
```

### Frontend

**Start Development Server**:
```bash
cd /Users/alessio/Desktop/chord-app/frontend
npm start
```
Opens browser at `http://localhost:3000`

**Run Tests**:
```bash
npm test
```

**Build for Production**:
```bash
npm run build
```

## Environment Variables

Backend requires `.env` file with:
- `OPENAI_API_KEY` - OpenAI API key for Whisper and GPT-4
- `X_API_KEY`, `X_API_SECRET` - X/Twitter API credentials
- `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` - X/Twitter access tokens
- `X_BEARER_TOKEN` - X/Twitter bearer token

Frontend requires `.env` file (currently no variables used, API endpoint is hardcoded to `http://localhost:5002`)

## Key Implementation Details

### NR76 Tweet Style System Prompt

The `/format` endpoint includes a detailed system message (lines 58-87 in `app.py`) that defines the NR76 writing voice:
- No hashtags or emojis in main text
- Under 280 characters (single tweet default)
- Direct, contrarian, period-heavy rhythm
- Removes filler words from voice transcripts
- Preserves core insight and energy

When modifying the tweet formatting logic, the system prompt can be adjusted to change the output style.

### Audio File Handling

The `/transcribe` endpoint uses Python's `tempfile.NamedTemporaryFile` to temporarily store uploaded audio files, which are cleaned up with `os.unlink()` after processing. Audio format is `.webm` from the browser MediaRecorder.

### Multipart Form Data

The frontend sends audio as `multipart/form-data` to `/transcribe`, while `/format` and `/post` use JSON payloads.

## Common Development Workflows

**Testing the Full Pipeline**:
1. Start backend: `cd backend && python app.py`
2. Start frontend: `cd frontend && npm start`
3. Click record, speak, stop recording
4. Verify transcription appears
5. Verify formatted post appears (editable)
6. Optionally click "Post to X" to publish

**Modifying Tweet Style**:
Edit the `system_message` variable in the `/format` endpoint (app.py:58-87)

**Changing API Endpoints**:
Frontend API calls are in `VoiceRecorder.js` lines 52, 58, 74 - currently hardcoded to `http://localhost:5002`
