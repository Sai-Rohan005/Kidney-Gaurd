from fastapi import FastAPI
from .routes import text_extractor_router, tab_trans_router
from .routes.image_classification import router as image_classification_router


app = FastAPI()

# include your OCR routes

app.include_router(text_extractor_router, prefix="/routes")
app.include_router(tab_trans_router, prefix="/routes")
app.include_router(image_classification_router, prefix="/routes")

@app.get("/")
def root():
    return {"msg": "Hello from fast API"}
