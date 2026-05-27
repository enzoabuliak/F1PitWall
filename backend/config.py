import os
from dotenv import load_dotenv

load_dotenv()

OPENF1_BASE_URL = "https://api.openf1.org/v1"
ERGAST_BASE_URL = "https://api.jolpi.ca/ergast/f1"

TIMING_POLL_INTERVAL = 1.0
TELEMETRY_POLL_INTERVAL = 0.033
SESSION_POLL_INTERVAL = 30.0

TIMING_CACHE_TTL = 60
TELEMETRY_CACHE_TTL = 10
WEATHER_CACHE_TTL = 30
QUALIFYING_CACHE_TTL = 300
RACE_RESULTS_CACHE_TTL = 86400
CONSTRUCTOR_CACHE_TTL = 604800
DRIVER_INFO_CACHE_TTL = 2592000

TELEMETRY_BUFFER_SIZE = 60

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
USE_REDIS = os.getenv("USE_REDIS", "false").lower() == "true"

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
