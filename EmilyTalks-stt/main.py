import io
import os
import tempfile
import wave
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from faster_whisper import WhisperModel
from piper import PiperVoice

MODELS_DIR = Path(__file__).parent / "models"
VOICE_MODEL = "en_US-lessac-medium.onnx"

stt_model: WhisperModel
tts_voice: PiperVoice


def download_voice_model():
    MODELS_DIR.mkdir(exist_ok=True)
    onnx_path = MODELS_DIR / VOICE_MODEL
    json_path = MODELS_DIR / f"{VOICE_MODEL}.json"

    if onnx_path.exists() and json_path.exists():
        return onnx_path

    import urllib.request
    base_url = (
        "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"
        "/en/en_US/lessac/medium"
    )
    for filename, path in [(VOICE_MODEL, onnx_path), (f"{VOICE_MODEL}.json", json_path)]:
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(f"{base_url}/{filename}", path)

    return onnx_path


@asynccontextmanager
async def lifespan(app: FastAPI):
    global stt_model, tts_voice
    stt_model = WhisperModel("base", device="cpu", compute_type="int8")
    onnx_path = download_voice_model()
    tts_voice = PiperVoice.load(str(onnx_path))
    print("STT + TTS models loaded")
    yield


app = FastAPI(title="EmilyTalks STT/TTS", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or ".webm")[1]
    with tempfile.NamedTemporaryFile(delete=True, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp.flush()
        segments, _ = stt_model.transcribe(tmp.name, language="en")
        text = " ".join(seg.text.strip() for seg in segments)
    return {"text": text}


@app.post("/synthesize")
async def synthesize(body: dict):
    text = body.get("text", "")
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        tts_voice.synthesize_wav(text, wav_file)
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="audio/wav")
