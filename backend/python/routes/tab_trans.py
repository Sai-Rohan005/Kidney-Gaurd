import torch
import torch.nn as nn
from fastapi import FastAPI, Request
from pydantic import BaseModel
import uvicorn
import pickle, json
import pandas as pd
from pydantic import RootModel
import os
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from fastapi import APIRouter
from torch import nn
from copy import deepcopy
from types import SimpleNamespace
import torch.nn.functional as F


router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENCODERS_PATH = os.path.join(BASE_DIR, "tab_binary_8", "tabtransformer_encoders.pkl")
MODEL_PATH = os.path.join(BASE_DIR, "tab_binary_8", "tabtransformer_ckd.pt")


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load encoders and scaler
with open(ENCODERS_PATH, "rb") as f:
    saved_objects = pickle.load(f)

y_le = saved_objects["label_encoder"]
ord_enc = saved_objects["ordinal_encoder"]
scaler = saved_objects["scaler"]
categorical_cols = saved_objects["categorical_cols"]
numerical_cols = saved_objects["numerical_cols"]

# Load model architecture + weights

cat_cardinalities = saved_objects.get("cat_cardinalities", None)  # fallback if needed

model_info = torch.load(MODEL_PATH, map_location=device)


model = SimpleNamespace()  # placeholder
# Build the same model architecture as used in training


class TabTransformer(nn.Module):
    def __init__(self, cat_cardinalities, num_numeric,
                 dim=64, depth=4, heads=8, dropout=0.2, num_classes=2):
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
            d_model=dim, nhead=heads, dim_feedforward=dim * 4,
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

model = TabTransformer(
    cat_cardinalities=model_info["cat_cardinalities"],
    num_numeric=model_info["num_numeric"],
    dim=model_info.get("dim",64),
    depth=model_info.get("depth",4),
    heads=model_info.get("heads",8),
    dropout=model_info.get("dropout",0.2),
    num_classes=model_info.get("num_classes",2)
).to(device)

model.load_state_dict(model_info["model_state_dict"])
model.eval()

print("✅ Model loaded successfully")



class InputData(RootModel[dict]):
    pass# accept any JSON dict



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
async def predict(request: Request):
    try:
        data = await request.json()
        if not data:
            return {"error": "No input data received"}

        # Preprocess input
        processed = preprocess_input(data, numerical_cols, categorical_cols)

        # Create single-row DataFrame in correct column order
        df_single = pd.DataFrame([processed])

        # Ensure numeric columns exist, fill missing with mean or 0
        for col in numerical_cols:
            if pd.isna(df_single.at[0, col]):
                df_single.at[0, col] = 0.0

        # Encode categorical columns (OrdinalEncoder expects 2D input)
        cats = ord_enc.transform(df_single[categorical_cols].astype(str))
        cats = np.array(cats, dtype=np.int64) + 1  # shift by +1 for padding_idx=0
        cats_tensor = torch.tensor(cats, dtype=torch.long, device=device)

        # Scale numeric columns
        nums = scaler.transform(df_single[numerical_cols].astype(float))
        nums_tensor = torch.tensor(nums, dtype=torch.float32, device=device)

        # Ensure correct shape: (1, num_cats) and (1, num_nums)
        if cats_tensor.ndim == 1:
            cats_tensor = cats_tensor.unsqueeze(0)
        if nums_tensor.ndim == 1:
            nums_tensor = nums_tensor.unsqueeze(0)

        # Predict
        with torch.no_grad():
            logits = model(cats_tensor, nums_tensor)
            probs = F.softmax(logits, dim=1)

            # Convert to NumPy
            probs_np = probs.cpu().numpy().squeeze(0)
            probs_list = probs_np.tolist()

        pred_class_idx = int(logits.argmax(dim=1).item())
        pred_class_label = y_le.inverse_transform([pred_class_idx])[0]

        return {
            "prediction": pred_class_label,
            "probabilities": probs_list  # e.g. [0.99916, 0.00083]
        }


    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}



