import collections
import io
import logging
import os
import re

import boto3
import requests
from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ai")

BACKEND = os.getenv("BACKEND_URL", "http://backend:5000")
TOKEN = os.getenv("INTERNAL_TOKEN", "")
BUCKET = os.getenv("S3_BUCKET", "cloud-ai-files")
MAX_PDF_BYTES = 10_000_000

app = FastAPI()
model = SentenceTransformer(os.getenv("MODEL_NAME", "all-MiniLM-L6-v2"))
s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("S3_ENDPOINT"),
    aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
    region_name="us-east-1",
)

STOP = set("the and for with that this from are was you your have not but all can has will its into about "
           "file copy final draft new untitled".split())
TEXT_EXT = (".txt", ".md", ".csv", ".json", ".log", ".py", ".js", ".html", ".xml", ".yml", ".yaml")


class EmbedRequest(BaseModel):
    id: str
    s3_key: str | None = None
    filename: str | None = None
    mime: str | None = None


class TextReq(BaseModel):
    text: str


def extract_text(key, filename, mime):
    """Best-effort text from PDFs and plain-text files; '' for everything else."""
    name = (filename or "").lower()
    is_pdf = name.endswith(".pdf") or mime == "application/pdf"
    is_text = (mime or "").startswith("text/") or name.endswith(TEXT_EXT)
    if not key or not (is_pdf or is_text):
        return ""
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=key)
        if obj["ContentLength"] > MAX_PDF_BYTES:
            return ""
        data = obj["Body"].read()
        if is_pdf:
            from pypdf import PdfReader
            pages = PdfReader(io.BytesIO(data)).pages[:10]
            return " ".join((p.extract_text() or "") for p in pages)[:5000]
        return data[:200_000].decode("utf-8", "ignore")[:5000]
    except Exception:
        log.exception("text extraction failed for %s", filename)
        return ""


def make_tags(text):
    words = re.findall(r"[^\W\d_]{3,}", text.lower())
    return [w for w, _ in collections.Counter(w for w in words if w not in STOP).most_common(8)]


def post_back(body):
    for attempt in range(3):
        try:
            r = requests.post(f"{BACKEND}/internal/save-embedding", json=body,
                              headers={"x-internal-token": TOKEN}, timeout=10)
            r.raise_for_status()
            return
        except Exception as e:
            log.warning("callback attempt %d failed: %s", attempt + 1, e)


def process(p: EmbedRequest):
    try:
        content = extract_text(p.s3_key, p.filename, p.mime)
        stem = re.sub(r"[_\-.]+", " ", os.path.splitext(p.filename or "")[0])
        emb = model.encode(f"{stem}. {content}".strip(), normalize_embeddings=True).tolist()
        tags = list(dict.fromkeys(make_tags(stem) + make_tags(content)))[:8]
        post_back({"id": p.id, "embedding": emb, "tags": tags})
    except Exception:
        log.exception("embedding failed for %s", p.id)
        post_back({"id": p.id, "status": "failed"})


@app.post("/embed", status_code=202)
def embed_file(payload: EmbedRequest, background: BackgroundTasks):
    background.add_task(process, payload)
    return {"status": "queued"}


@app.post("/embed-text")
def embed_text(payload: TextReq):
    return {"embedding": model.encode(payload.text, normalize_embeddings=True).tolist()}


@app.get("/health")
def health():
    return {"ok": True}
