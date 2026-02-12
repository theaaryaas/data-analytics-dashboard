from prometheus_client import Counter, Histogram, generate_latest
import time

"""
Very simple Prometheus metrics for your app.
We only track three things:
- total file uploads
- upload time
- total errors
"""

# 1. Count file uploads
FILE_UPLOADS = Counter(
    "file_uploads_total",
    "Total files uploaded",
)

# 2. Track upload time
UPLOAD_TIME = Histogram(
    "upload_time_seconds",
    "Time to upload and process files",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0],
)

# 3. Count errors
ERRORS = Counter(
    "errors_total",
    "Total errors while handling requests",
)


def record_upload(start_time: float) -> float:
    """Record when a file upload finished successfully."""
    FILE_UPLOADS.inc()
    duration = time.time() - start_time
    UPLOAD_TIME.observe(duration)
    return duration


def record_error() -> None:
    """Record that an error happened."""
    ERRORS.inc()


def get_metrics() -> bytes:
    """Return metrics in text format for Prometheus."""
    return generate_latest()

