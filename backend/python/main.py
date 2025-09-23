from fastapi import FastAPI
from .routes import text_extractor_router, tab_trans_router


app = FastAPI()

# include your OCR routes

app.include_router(text_extractor_router, prefix="/routes/extract_text")
app.include_router(tab_trans_router, prefix="/routes/tab_predict")

@app.get("/")
def root():
    return {"msg": "Hello from API"}
