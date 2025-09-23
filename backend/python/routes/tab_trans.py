import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import pickle, json
import pandas as pd
from pydantic import RootModel
import os
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from fastapi import APIRouter

router = APIRouter()

# ==== Load Artifacts ====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
META_PATH = os.path.join(BASE_DIR, "ckd_tabtransformer_artifacts_7", "meta.json")
Ordinal_path = os.path.join(BASE_DIR, "ckd_tabtransformer_artifacts_7", "ordinal_encoder.pkl")
Label_path = os.path.join(BASE_DIR, "ckd_tabtransformer_artifacts_7", "label_encoder.pkl")
Scaler_path = os.path.join(BASE_DIR, "ckd_tabtransformer_artifacts_7", "scaler.pkl")
Model_path = os.path.join(BASE_DIR, "ckd_tabtransformer_artifacts_7", "tabtransformer.pt")

with open(META_PATH, "r") as f:
    meta = json.load(f)

# print ("✅ Meta loaded successfully",meta)

categorical_cols = meta["categorical_cols"]
numerical_cols = meta["numerical_cols"]

with open(Ordinal_path, "rb") as f:
    ordinal_encoder = pickle.load(f)

with open(Label_path, "rb") as f:
    label_encoder = pickle.load(f)

with open(Scaler_path, "rb") as f:
    scaler = pickle.load(f)

num_classes = len(label_encoder.classes_)
cat_cardinalities = [len(c) + 1 for c in ordinal_encoder.categories_]

# ==== Define Model ====
class TabTransformer(nn.Module):
    def __init__(self, cat_cardinalities, num_numeric,
                 dim=64, depth=4, heads=8, dropout=0.2, num_classes=5):
        super().__init__()
        self.num_cats = len(cat_cardinalities)
        self.num_numeric = num_numeric
        self.dim = dim

        self.cat_embeddings = nn.ModuleList([
            nn.Embedding(num_embeddings=card, embedding_dim=dim, padding_idx=0)
            for card in cat_cardinalities
        ])

        self.num_linear = nn.Sequential(
            nn.Linear(num_numeric, dim),
            nn.LayerNorm(dim),
            nn.ReLU(),
        )

        self.token_embeds = nn.Parameter(torch.randn(self.num_cats + 1, dim) * 0.02)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=dim, nhead=heads, dim_feedforward=dim*4,
            dropout=dropout, batch_first=True, activation='gelu'
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        self.norm = nn.LayerNorm(dim)

        self.head = nn.Sequential(
            nn.Linear(dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.LayerNorm(256),
            nn.Linear(256, num_classes)
        )

    def forward(self, x_cats, x_nums):
        cat_embeds = [emb(x_cats[:, i]) for i, emb in enumerate(self.cat_embeddings)]
        cat_tokens = torch.stack(cat_embeds, dim=1)

        num_token = self.num_linear(x_nums).unsqueeze(1)
        tokens = torch.cat([cat_tokens, num_token], dim=1)
        tokens = tokens + self.token_embeds.unsqueeze(0)

        z = self.transformer(tokens)
        z = self.norm(z)
        z_mean = z.mean(dim=1)
        return self.head(z_mean)

# ==== Load Model ====
device = torch.device("cpu")
model = TabTransformer(
    cat_cardinalities=cat_cardinalities,
    num_numeric=len(numerical_cols),
    dim=64, depth=4, heads=8, dropout=0.2,
    num_classes=num_classes
).to(device)

state_dict = torch.load(Model_path, map_location=device)
model.load_state_dict(state_dict, strict=False)
model.eval()
# print(model.feature_names_in_)


print("✅ Model loaded successfully")

# ==== Prediction Helper ====
def predict_single(record, model, ordinal_encoder, scaler,
                   categorical_cols, numerical_cols, label_encoder, device):
    df = record

    # encode categoricals
    cat_vals = ordinal_encoder.transform(df[categorical_cols])
    for i, c in enumerate(categorical_cols):
        cat_vals[:, i] = np.where(
            cat_vals[:, i] < 0,
            len(ordinal_encoder.categories_[i]) - 1,
            cat_vals[:, i]
        )

    # scale numericals
    num_vals = scaler.transform(df[numerical_cols])

    # tensors
    cat_tensor = torch.tensor(cat_vals, dtype=torch.long, device=device)
    num_tensor = torch.tensor(num_vals, dtype=torch.float32, device=device)

    with torch.no_grad():
        logits = model(cat_tensor, num_tensor)
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        pred_idx = np.argmax(probs)
        pred_label = label_encoder.inverse_transform([pred_idx])[0]

    return pred_label, probs



# Schema with your raw fields
# class InputData(BaseModel):
#     age: str | None = None
#     bloodPressure: str
#     specificGravity: str
#     albumin: str
#     sugar: str
#     rbc: str
#     pusCells: str
#     pusClumps: str
#     bacteria: str
#     glucose: str
#     urea: str
#     creatinine: str
#     sodium: str
#     potassium: str
#     hemoglobin: str
#     pcv: str
#     wbc: str
#     rbcCount: str
#     hypertension: str
#     diabetes: str
#     cad: str
#     appetite: str
#     edema: str
#     anemia: str



class InputData(RootModel[dict]):
    pass# accept any JSON dict



# # Define which features are numeric vs categorical (from training!)
# NUMERIC_FEATURES = [
#     "Age of the patient",
#     "Blood pressure (mm/Hg)",
#     "Specific gravity of urine",
#     "Albumin in urine",
#     "Sugar in urine",
#     "Random blood glucose level (mg/dl)",
#     "Blood urea (mg/dl)",
#     "Serum creatinine (mg/dl)",
#     "Sodium level (mEq/L)",
#     "Potassium level (mEq/L)",
#     "Hemoglobin level (gms)",
#     "Packed cell volume (%)",
#     "White blood cell count (cells/cumm)",
#     "Red blood cell count (millions/cumm)"
# ]

# CATEGORICAL_FEATURES = [
#     "Red blood cells in urine",
#     "Pus cells in urine",
#     "Pus cell clumps in urine",
#     "Bacteria in urine",
#     "Hypertension (yes/no)",
#     "Diabetes mellitus (yes/no)",
#     "Coronary artery disease (yes/no)",
#     "Appetite (good/poor)",
#     "Pedal edema (yes/no)",
#     "Anemia (yes/no)"
# ]

def preprocess_input(data: dict, numerical_cols: list, categorical_cols: list):
    processed = {}
    for col in numerical_cols:
        value = data.get(col)
        processed[col] = float(value) if value not in (None, "", "NA") else None

    for col in categorical_cols:
        value = data.get(col)
        processed[col] = str(value).lower() if value is not None else None

    return processed


@router.post("/tab_predict")
async def predict(request: InputData):
    try:
        data = request.root  # raw frontend dict

        # ✅ Convert to cleaned dict with correct dtypes
        processed = preprocess_input(data, numerical_cols, categorical_cols)

        # ✅ Create DataFrame in correct column order
        df = pd.DataFrame([[processed[col] for col in numerical_cols + categorical_cols]],
                          columns=numerical_cols + categorical_cols)

        # ✅ Send to model
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        pred_class, probs = predict_single(
            df, model, ordinal_encoder, scaler,
            categorical_cols, numerical_cols,
            label_encoder, device
        )

        return {"prediction": pred_class, "probabilities": probs.tolist()}

    except Exception as e:
        return {"error": str(e)}







