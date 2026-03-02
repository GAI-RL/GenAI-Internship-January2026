from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil, os, uuid, base64, requests, asyncio, logging
import httpx
import edge_tts
from zyphra import ZyphraClient
from elevenlabs.client import ElevenLabs
from elevenlabs import save
from gtts import gTTS

# ─────────────────────────────────────────────────────────
# Logging — prints every poll response to the VS Code terminal
# ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("deepfake-guard")

# ─────────────────────────────────────────────────────────
# App & Middleware
# ─────────────────────────────────────────────────────────
app = FastAPI(title="Deepfake Guard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("outputs",  exist_ok=True)
os.makedirs("static",   exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ─────────────────────────────────────────────────────────
# API Keys
# ─────────────────────────────────────────────────────────
ZYPHRA_API_KEY           = os.environ.get("ZYPHRA_API_KEY",           "zsk-86679140eda6acd9f327dba099dc31d8113e3ede36efd463457bb10fa55ed06c")
BITMIND_API_KEY          = os.environ.get("BITMIND_API_KEY",          "bitmind-87e11940-108f-11f1-be90-7f597ee56745:e6614dad")
REALITY_DEFENDER_API_KEY = os.environ.get("REALITY_DEFENDER_API_KEY", "rd_3e4c3b8ecdb83702_59f900177d28b6caef0fc73ea9efe0ab")

RD_BASE = "https://api.prd.realitydefender.xyz"

# ─────────────────────────────────────────────────────────
# File-type helpers
# ─────────────────────────────────────────────────────────
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
AUDIO_EXTS = {".mp3", ".wav", ".m4a", ".flac", ".opus", ".ogg", ".webm"}

def get_ext(filename: str) -> str:
    return os.path.splitext(filename or "")[-1].lower()

def is_video(filename: str) -> bool:
    return get_ext(filename) in VIDEO_EXTS

def is_audio(filename: str) -> bool:
    return get_ext(filename) in AUDIO_EXTS

# ─────────────────────────────────────────────────────────
# Helper — serve HTML pages
# ─────────────────────────────────────────────────────────
def serve_page(filename: str) -> HTMLResponse:
    path = os.path.join("static", filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(
        content=f"<div style='font-family:sans-serif;padding:40px'>"
                f"⚠️ {filename} not found in static/ folder.</div>",
        status_code=404,
    )

# ─────────────────────────────────────────────────────────
# PAGE ROUTES
# ─────────────────────────────────────────────────────────
@app.get("/",             response_class=HTMLResponse)
async def page_home():     return serve_page("index.html")

@app.get("/index",        response_class=HTMLResponse)
async def page_index():    return serve_page("index.html")

@app.get("/voice",        response_class=HTMLResponse)
async def page_voice():    return serve_page("voice.html")

@app.get("/detector",     response_class=HTMLResponse)
async def page_detector(): return serve_page("detector.html")

@app.get("/generator",    response_class=HTMLResponse)
async def page_generator():return serve_page("generator.html")

@app.get("/pricing",      response_class=HTMLResponse)
async def page_pricing():  return serve_page("pricing.html")

@app.get("/about",        response_class=HTMLResponse)
async def page_about():    return serve_page("about.html")

@app.get("/signup-login", response_class=HTMLResponse)
async def page_signup():   return serve_page("signup-login.html")


# ════════════════════════════════════════════════════════
# SMART DETECT
# ════════════════════════════════════════════════════════
@app.post("/detect", tags=["Detection"])
async def smart_detect(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext      = get_ext(filename)
    if is_audio(filename):
        return await _reality_defender_detect_file(file)
    elif is_video(filename):
        return await _bitmind_detect_file(file)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. "
                   f"Supported audio: {sorted(AUDIO_EXTS)}, video: {sorted(VIDEO_EXTS)}"
        )


# ════════════════════════════════════════════════════════
# BITMIND — Video Deepfake Detection
# ════════════════════════════════════════════════════════
async def _bitmind_detect_file(file: UploadFile):
    if not is_video(file.filename or ""):
        raise HTTPException(status_code=400, detail=f"BitMind requires a VIDEO file. Got '{file.filename}'.")

    video_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    try:
        with open(video_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)

        with open(video_path, "rb") as vf:
            r = requests.post(
                "https://api.bitmind.ai/oracle/v1/34/detect-video",
                headers={
                    "Authorization": f"Bearer {BITMIND_API_KEY}",
                    "x-bitmind-application": "oracle-api",
                },
                files={"video": vf},
                data={"rich": "true"},
                timeout=120,
            )

        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=f"BitMind error: {r.text}")

        data       = r.json()
        confidence = data.get("confidence", data.get("score", 0))
        is_fake    = data.get("isAI", data.get("is_fake", False))

        return {
            "engine":        "bitmind",
            "file_type":     "video",
            "score":         round(float(confidence), 4),
            "score_percent": round(float(confidence) * 100, 1),
            "verdict":       "MANIPULATED" if is_fake else "AUTHENTIC",
            "meaning":       "BitMind detected AI-manipulation." if is_fake
                             else "BitMind found no signs of manipulation.",
            "raw_response":  data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)


@app.post("/bitmind-detect", tags=["Detection"])
async def bitmind_detect(file: UploadFile = File(...)):
    return await _bitmind_detect_file(file)


# ════════════════════════════════════════════════════════
# REALITY DEFENDER — Audio Deepfake Detection
# ════════════════════════════════════════════════════════
async def _reality_defender_detect_file(file: UploadFile):
    audio_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")

    try:
        # ── 1. Save to disk ─────────────────────────────────────────────────
        with open(audio_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)

        if os.path.getsize(audio_path) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        async with httpx.AsyncClient(timeout=120) as client:

            # ── Step 1: Get presigned S3 URL ────────────────────────────────
            log.info(f"[RD] Requesting presigned URL for: {file.filename}")
            presign_resp = await client.post(
                f"{RD_BASE}/api/files/aws-presigned",
                headers={
                    "x-api-key":    REALITY_DEFENDER_API_KEY,
                    "Content-Type": "application/json",
                },
                json={"fileName": file.filename},
            )
            log.info(f"[RD] Presign status: {presign_resp.status_code}")

            if presign_resp.status_code not in (200, 201):
                raise HTTPException(
                    status_code=presign_resp.status_code,
                    detail=f"RD presign error: {presign_resp.text}",
                )

            presign_data = presign_resp.json()
            log.info(f"[RD] Presign response keys: {list(presign_data.keys())}")

            # ✅ Confirmed shape: presign_data["response"]["signedUrl"] + presign_data["requestId"]
            presigned_url = (presign_data.get("response") or {}).get("signedUrl")
            request_id    = presign_data.get("requestId") or presign_data.get("mediaId")

            if not presigned_url:
                raise HTTPException(status_code=500, detail=f"No signedUrl in response: {presign_data}")
            if not request_id:
                raise HTTPException(status_code=500, detail=f"No requestId in response: {presign_data}")

            log.info(f"[RD] Got request_id: {request_id}")

            # ── Step 2: PUT raw bytes to S3 ─────────────────────────────────
            with open(audio_path, "rb") as af:
                file_bytes = af.read()

            log.info(f"[RD] Uploading {len(file_bytes)} bytes to S3...")
            upload_resp = await client.put(
                presigned_url,
                content=file_bytes,
                headers={"Content-Type": file.content_type or "audio/mpeg"},
            )
            log.info(f"[RD] S3 upload status: {upload_resp.status_code}")

            if upload_resp.status_code not in (200, 201, 204):
                raise HTTPException(
                    status_code=upload_resp.status_code,
                    detail=f"S3 upload error: {upload_resp.text}",
                )

            # ── Step 3: Poll for result ─────────────────────────────────────
            # Poll every 5s, up to 24 times (2 min total)
            result          = None
            last_poll_error = None

            for attempt in range(24):
                await asyncio.sleep(5)

                poll_resp = await client.get(
                    f"{RD_BASE}/api/media/users/{request_id}",
                    headers={
                        "x-api-key":    REALITY_DEFENDER_API_KEY,
                        "Content-Type": "application/json",
                    },
                )

                # ── Log EVERY poll attempt to VS Code terminal ──────────────
                log.info(f"[RD] Poll {attempt+1}/24 → HTTP {poll_resp.status_code}")

                if poll_resp.status_code != 200:
                    last_poll_error = f"Poll {attempt+1}: HTTP {poll_resp.status_code} — {poll_resp.text}"
                    log.warning(f"[RD] {last_poll_error}")
                    continue

                poll_data = poll_resp.json()

                # Log the FULL response on first poll and whenever status changes
                log.info(f"[RD] Poll {attempt+1} response: {poll_data}")

                # ✅ Handle both flat and nested response shapes
                data_block = poll_data.get("data") or poll_data
                status_val = (
                    data_block.get("status")
                    or data_block.get("overallStatus")
                    or poll_data.get("status")
                    or ""
                ).upper()

                log.info(f"[RD] Poll {attempt+1} status_val='{status_val}'")

                # Still processing — keep waiting
                if status_val in ("PENDING", "PROCESSING", "IN_PROGRESS", "QUEUED", "UPLOADED", "SUBMITTED", ""):
                    continue

                # Any other status (COMPLETE, DONE, FINISHED, MANIPULATED, AUTHENTIC, ERROR…) → done
                result = poll_data
                log.info(f"[RD] Analysis complete with status: '{status_val}'")
                break

            if result is None:
                detail = f"Reality Defender timed out after 2 minutes. request_id={request_id}"
                if last_poll_error:
                    detail += f" | Last error: {last_poll_error}"
                raise HTTPException(status_code=504, detail=detail)

        # ── 4. Extract score ────────────────────────────────────────────────
        data_block = result.get("data") or result

        # Log the full data block so we can see EXACTLY what RD returns
        log.info(f"[RD] FULL data_block: {data_block}")

        def extract_score(d: dict) -> float:
            """Walk every known RD response shape to find a numeric score."""
            # Top-level flat fields
            for key in ("score", "confidence", "probability", "fakeScore", "fake_score",
                        "ai_score", "aiScore", "deepfake_score", "deepfakeScore"):
                v = d.get(key)
                if v is not None:
                    try:
                        return float(v)
                    except (TypeError, ValueError):
                        pass

            # Nested under models (dict shape)
            models = d.get("models")
            if isinstance(models, dict):
                for sub_key in ("audio", "voice", "speech", "deepfake"):
                    sub = models.get(sub_key)
                    if isinstance(sub, dict):
                        for key in ("score", "confidence", "probability", "fakeScore"):
                            v = sub.get(key)
                            if v is not None:
                                try:
                                    return float(v)
                                except (TypeError, ValueError):
                                    pass

            # Nested under models (list shape)
            if isinstance(models, list) and models:
                for model in models:
                    if isinstance(model, dict):
                        for key in ("score", "confidence", "probability", "fakeScore"):
                            v = model.get(key)
                            if v is not None:
                                try:
                                    return float(v)
                                except (TypeError, ValueError):
                                    pass

            # Nested under results key
            results_block = d.get("results") or d.get("result")
            if isinstance(results_block, dict):
                return extract_score(results_block)

            return -1.0  # sentinel: means "not found"

        score = extract_score(data_block)

        if score == -1.0:
            log.warning(f"[RD] ⚠️  Could not extract score! Full result: {result}")
            # Fall back to status string if score is truly missing
            status_str = (
                data_block.get("status")
                or data_block.get("overallStatus")
                or ""
            ).upper()
            score = 1.0 if status_str in ("MANIPULATED", "FAKE", "AI") else 0.0

        log.info(f"[RD] Final extracted score: {score}")
        # Normalize score to 0–1 range
        if score > 1.0:
            score = score / 100.0
        score = max(0.0, min(1.0, score))

        # ── 5. Verdict ──────────────────────────────────────────────────────
        if score > 0.6:
            verdict = "MANIPULATED"
            meaning = "The model detected strong AI manipulation patterns in this audio."
        elif score < 0.4:
            verdict = "AUTHENTIC"
            meaning = "The audio appears to be genuine with no significant AI signals."
        else:
            verdict = "UNCERTAIN"
            meaning = "The model confidence is moderate. The result is inconclusive."

        return {
            "engine":        "reality_defender",
            "file_type":     "audio",
            "score":         round(score, 4),
            "score_percent": round(score * 100, 1),
            "verdict":       verdict,
            "meaning":       meaning,
            "raw_response":  result,
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"[RD] Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)


@app.post("/reality-defender-detect", tags=["Detection"])
async def reality_defender_detect(file: UploadFile = File(...)):
    return await _reality_defender_detect_file(file)


# ════════════════════════════════════════════════════════
# ZYPHRA — Voice Cloning
# ════════════════════════════════════════════════════════
@app.post("/zyphra-voice", tags=["Voice Cloning"])
async def zyphra_voice(
    text:  str        = Form(...),
    voice: UploadFile = File(...),
):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if not is_audio(voice.filename or ""):
        raise HTTPException(status_code=400, detail=f"Voice file must be audio. Got: '{voice.filename}'")

    voice_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{voice.filename}")
    out_path   = None
    try:
        with open(voice_path, "wb") as buf:
            shutil.copyfileobj(voice.file, buf)

        if os.path.getsize(voice_path) == 0:
            raise HTTPException(status_code=400, detail="Uploaded voice file is empty.")

        with open(voice_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")

        zc         = ZyphraClient(api_key=ZYPHRA_API_KEY)
        audio_data = zc.audio.speech.create(
            text=text,
            speaker_audio=audio_b64,
            language_iso_code="en-us",
            speaking_rate=15,
            mime_type="audio/wav",
        )

        out_path = os.path.join("outputs", f"{uuid.uuid4()}.wav")
        with open(out_path, "wb") as f:
            if isinstance(audio_data, (bytes, bytearray)):
                f.write(audio_data)
            elif hasattr(audio_data, "read"):
                shutil.copyfileobj(audio_data, f)
            else:
                for chunk in audio_data:
                    if chunk:
                        f.write(chunk)

        if os.path.getsize(out_path) == 0:
            raise HTTPException(status_code=500, detail="Zyphra returned empty audio.")

        return FileResponse(
            out_path,
            media_type="audio/wav",
            filename="zyphra_cloned.wav",
            headers={"Cache-Control": "no-cache"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Zyphra error: {str(e)}")
    finally:
        if os.path.exists(voice_path):
            os.remove(voice_path)


# ════════════════════════════════════════════════════════
# HEALTH CHECK
# ════════════════════════════════════════════════════════
@app.get("/health", tags=["Utility"])
async def health():
    return {
        "status":       "ok",
        "rd_base_url":  RD_BASE,
        "static_files": os.listdir("static") if os.path.exists("static") else [],
        "keys_loaded": {
            "zyphra":           bool(ZYPHRA_API_KEY),
            "bitmind":          bool(BITMIND_API_KEY),
            "reality_defender": bool(REALITY_DEFENDER_API_KEY),
        },
    }


# ════════════════════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════════════════════
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)