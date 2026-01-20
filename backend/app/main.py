from fastapi import FastAPI

app = FastAPI(title="Middleware traductor SQL a Cypher", version="0.1.0")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend operativo", "service": "Translator API"}

@app.get("/health")
def health_check():
    return {"database": "pending_check", "status": "healthy"}