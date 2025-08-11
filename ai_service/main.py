import os
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import boto3

app = FastAPI()
model_name = os.getenv('MODEL_NAME','all-MiniLM-L6-v2')
model = SentenceTransformer(model_name)

s3_endpoint = os.getenv('S3_ENDPOINT')
s3 = boto3.client('s3', endpoint_url=s3_endpoint,
                  aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
                  aws_secret_access_key=os.getenv('S3_SECRET_KEY'))

class EmbedRequest(BaseModel):
    id: str
    s3_key: str = None
    filename: str = None

class TextReq(BaseModel):
    text: str

@app.post('/embed')
async def embed_file(payload: EmbedRequest):
    # For demo: use filename as text; for docs fetch object and extract text (OCR/pdf parsing)
    text = payload.filename or ''
    emb = model.encode(text).tolist()
    # store embedding via HTTP back to backend's internal endpoint (or write to DB directly if credentials available)
    # We'll POST back to backend to save embedding & tags
    import requests
    tags = [t for t in text.split() if len(t)>2][:10]
    try:
        requests.post(f"http://backend:5000/internal/save-embedding", json={"id": payload.id, "embedding": emb, "tags": tags}, timeout=5)
    except Exception as e:
        print('callback failed', e)
    return {"status":"ok"}

@app.post('/embed-text')
async def embed_text(payload: TextReq):
    emb = model.encode(payload.text).tolist()
    return {"embedding": emb}
