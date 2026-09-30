# EmilyTalks

A conversational AI practice platform built with Next.js. Chat with Emily, an AI assistant that adapts to different scenarios — from casual conversation to job interviews, education, storytelling, and debate.

## Prerequisites

- **Bun** — JavaScript runtime and package manager
- **Python 3.10+** — Required for the STT/TTS worker subprocess
- **Ollama** with `llama3.2` model — Run `ollama pull llama3.2` before starting

## Quick Start

```bash
# Install dependencies
bun install

# Start the dev server (Python worker + Next.js)
bun dev
```

That's it. A single `bun dev` command starts both the Python speech worker and the Next.js dev server. Open `http://localhost:3000` in your browser.

## Architecture

EmilyTalks uses a **monolithic Next.js** architecture with feature-based modules:

```
src/
├── features/
│   ├── conversation/     # Conversation domain
│   │   ├── api/          # Route handlers (prepare, reset, converse)
│   │   ├── lib/          # Store, Ollama client, system prompts
│   │   └── types/        # Ollama request/response types
│   ├── speech/           # Speech domain
│   │   ├── api/          # Transcribe & synthesize route handlers
│   │   ├── lib/          # Speech worker client with retry logic
│   │   └── worker/       # FastAPI STT/TTS (faster-whisper + piper-tts)
│   └── scenario/         # Scenario definitions
│       └── lib/          # Scenario metadata and types
├── app/                  # Next.js App Router
│   └── api/              # Thin re-exports → features/*/api/
├── components/           # Shared UI components
├── hooks/                # React hooks (useStreamChat, useSpeechToText, etc.)
├── lib/                  # API client layer (calls internal /api/* routes)
└── types/                # Shared TypeScript types
```

### Key Design Decisions

| Decision | Approach |
|----------|----------|
| Route handlers | Thin re-exports from `src/features/*/api/` — keeps feature code co-located |
| Conversation store | In-memory singleton with sliding window truncation (50 messages) |
| Ollama integration | Server-side `fetch` proxy with SSE streaming |
| Python worker | Managed subprocess via `scripts/dev.ts` with health-check lifecycle |
| System prompts | Hardcoded templates per scenario in `scenario-definitions.ts` |

### Data Flow

```
Browser → /api/conversation/converse/stream → Ollama (SSE tokens)
Browser → /api/speech/transcribe → Python worker (faster-whisper)
Browser → /api/speech/synthesize → Python worker (piper-tts)
```

## Available API Endpoints

### Conversation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/conversation/prepare-agent` | Initialize session with scenario + topic |
| `POST` | `/api/conversation/reset-agent` | Clear conversation history (idempotent) |
| `POST` | `/api/conversation/converse/stream` | Send message, receive SSE token stream |
| `POST` | `/api/conversation/converse/text` | Send message, receive full JSON response |

### Speech

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/speech/transcribe` | Transcribe audio (FormData with `file` field) |
| `POST` | `/api/speech/synthesize` | Synthesize text to audio (JSON `{ text }`) |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.2` | Model to use for conversations |
| `PYTHON_WORKER_PORT` | (auto) | Set automatically by `scripts/dev.ts` |

## Scenarios

| ID | Name | Description |
|----|------|-------------|
| `casual` | Casual Conversation | Friendly, everyday conversations |
| `interview` | Job Interview | Professional interview practice |
| `education` | Education | Structured learning with a tutor |
| `storytelling` | Storytelling | Co-create imaginative narratives |
| `debate` | Debate | Practice argumentation skills |

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start Python worker + Next.js (single command) |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun lint` | Run Next.js linter |
# EmilyTalks-Practice
