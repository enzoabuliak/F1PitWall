import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, TIMING_POLL_INTERVAL
from cache.memory_cache import MemoryCache
from services.openf1_service import OpenF1Service
from services.ergast_service import ErgastService
from routes import live, championship, track

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("f1-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.cache = MemoryCache()
    app.state.openf1 = OpenF1Service(cache=app.state.cache)
    app.state.ergast = ErgastService(cache=app.state.cache)
    app.state.poll_task = asyncio.create_task(app.state.openf1.run_polling_loop())
    app.state.cleanup_task = asyncio.create_task(app.state.cache.cleanup_loop())
    log.info("Backend started: OpenF1 polling + cache cleanup running")
    try:
        yield
    finally:
        app.state.poll_task.cancel()
        app.state.cleanup_task.cancel()
        await app.state.openf1.close()
        await app.state.ergast.close()
        log.info("Backend shutdown complete")


app = FastAPI(title="F1 Engineering Dashboard API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(live.router, prefix="/api/live", tags=["live"])
app.include_router(championship.router, prefix="/api/championship", tags=["championship"])
app.include_router(track.router, prefix="/api/track", tags=["track"])


@app.get("/")
async def root():
    return {"service": "F1 Engineering Dashboard API", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.websocket("/api/live/stream")
async def live_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            timing = await app.state.cache.get("timing:current") or []
            race_state = await app.state.cache.get("race:state") or {}
            await websocket.send_json({"race_state": race_state, "timing": timing})
            await asyncio.sleep(TIMING_POLL_INTERVAL)
    except WebSocketDisconnect:
        log.info("WebSocket client disconnected")
    except Exception as e:
        log.exception("WebSocket error: %s", e)
        await websocket.close()
