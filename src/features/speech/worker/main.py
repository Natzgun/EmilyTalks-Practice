"""
FastAPI STT/TTS worker for EmilyTalks.
Uses faster-whisper for speech-to-text.
Uses edge-tts (online, natural) for text-to-speech, with piper-tts as offline fallback.
"""

import io
import wave
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Model loading state
# ---------------------------------------------------------------------------
stt_model = None
piper_model = None
edge_tts_available = False
stt_model_loaded = False
tts_model_loaded = False  # True if either edge-tts or piper is ready


def _load_stt():
    """Load faster-whisper model (auto-downloads on first run)."""
    global stt_model, stt_model_loaded
    try:
        from faster_whisper import WhisperModel
        # base.int8 — good balance of speed/accuracy for dev
        stt_model = WhisperModel("base", device="cpu", compute_type="int8")
        stt_model_loaded = True
        print("[worker] STT model loaded (faster-whisper base.int8)")
    except Exception as e:
        print(f"[worker] STT model failed to load: {e}")


def _load_tts():
    """Load TTS: prefer edge-tts (online, natural), fallback to piper-tts (offline)."""
    global piper_model, edge_tts_available, tts_model_loaded

    # Try edge-tts first
    try:
        import edge_tts
        edge_tts_available = True
        tts_model_loaded = True
        print("[worker] TTS: edge-tts available (online, high quality)")
        return
    except Exception as e:
        print(f"[worker] edge-tts not available: {e}")

    # Fallback to piper-tts
    try:
        from piper import PiperVoice
        model_path = Path(__file__).parent / "models" / "en_US-lessac-medium.onnx"
        config_path = model_path.with_suffix(".onnx.json")

        if not model_path.exists():
            print("[worker] Piper model not found, downloading...")
            _download_piper_model(model_path.parent)

        if model_path.exists():
            piper_model = PiperVoice.load(str(model_path), config_path=str(config_path))
            tts_model_loaded = True
            print("[worker] TTS: piper-tts loaded (offline fallback)")
        else:
            print("[worker] Piper model download failed")
    except Exception as e:
        print(f"[worker] Piper TTS failed to load: {e}")


def _download_piper_model(dest: Path):
    """Download piper model files from HuggingFace."""
    import urllib.request
    dest.mkdir(parents=True, exist_ok=True)

    base_url = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/"
    files = {
        "en_US-lessac-medium.onnx": f"{base_url}en_US-lessac-medium.onnx",
        "en_US-lessac-medium.onnx.json": f"{base_url}en_US-lessac-medium.onnx.json",
    }

    for filename, url in files.items():
        target = dest / filename
        if target.exists():
            continue
        print(f"[worker] Downloading {filename}...")
        urllib.request.urlretrieve(url, str(target))
        print(f"[worker] Downloaded {filename}")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load STT/TTS models on startup."""
    print("[worker] Loading models...")
    _load_stt()
    _load_tts()
    yield
    print("[worker] Shutting down")


app = FastAPI(lifespan=lifespan)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class SynthesizeRequest(BaseModel):
    text: str
    voice: str | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    """Health check — returns 200 when models are loaded."""
    return {
        "status": "ok",
        "stt_loaded": stt_model_loaded,
        "tts_loaded": tts_model_loaded,
        "tts_engine": "edge-tts" if edge_tts_available else ("piper" if piper_model else "none"),
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """Transcribe audio to text using faster-whisper."""
    if not stt_model_loaded:
        raise HTTPException(status_code=503, detail="STT model not loaded")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    # Save to temp file for faster-whisper (it expects a file path)
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments, _ = stt_model.transcribe(tmp_path, beam_size=1, language="en")
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        import os
        os.unlink(tmp_path)


@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    """Synthesize text to audio. Uses edge-tts (natural, online) by default, falls back to piper-tts."""
    if not tts_model_loaded:
        raise HTTPException(status_code=503, detail="TTS not available")

    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    # ── Edge-TTS (online, natural voice) ─────────────────────────────
    if edge_tts_available:
        try:
            import edge_tts
            voice = req.voice or "en-US-AriaNeural"
            communicate = edge_tts.Communicate(req.text, voice=voice)
            mp3_buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    mp3_buffer.write(chunk["data"])

            return Response(
                content=mp3_buffer.getvalue(),
                media_type="audio/mpeg",
            )
        except Exception as e:
            print(f"[worker] edge-tts failed: {e}")
            # Fall through to piper fallback

    # ── Piper-TTS (offline fallback) ──────────────────────────────────
    if piper_model is None:
        raise HTTPException(status_code=503, detail="All TTS engines unavailable")

    try:
        chunks = list(piper_model.synthesize(req.text))
        if not chunks:
            raise HTTPException(status_code=500, detail="No audio generated")

        audio_bytes = b"".join(chunk.audio_int16_bytes for chunk in chunks)
        sample_rate = 22050

        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(audio_bytes)

        return Response(
            content=wav_buffer.getvalue(),
            media_type="audio/wav",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {e}")
