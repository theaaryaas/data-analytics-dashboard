from prometheus_client import Counter, Histogram, generate_latest
import time

FILE_UPLOADS = Counter("file_uploads_total", "Total files uploaded")
UPLOAD_TIME = Histogram("upload_time_seconds", "Time to upload and process files", buckets=[0.1, 0.5, 1.0, 2.0, 5.0])
ERRORS = Counter("errors_total", "Total errors while handling requests")

def record_upload(start: float) -> float:
    duration = time.time() - start
    FILE_UPLOADS.inc(); UPLOAD_TIME.observe(duration)
    return duration

def record_error() -> None: ERRORS.inc()
def get_metrics() -> bytes: return generate_latest()