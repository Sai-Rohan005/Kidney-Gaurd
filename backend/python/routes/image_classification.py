from io import BytesIO
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from torchvision.models import resnet50
from PIL import Image
import numpy as np
import os
import json
from PIL import Image
from torchvision import models, transforms
from fastapi import APIRouter, HTTPException, Request, requests
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from pydantic import RootModel
from pydantic import BaseModel, HttpUrl
import requests  # the HTTP library, NOT FastAPI's Request
from io import BytesIO
from PIL import Image
import numpy as np
import torch
from fastapi import Request


router = APIRouter()

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from torchvision.models import resnet50, ResNet50_Weights
from PIL import Image
import numpy as np

# --------------------------
# Basic building blocks
# --------------------------
class ConvBlock(nn.Module):
    """Two 3x3 convs + BN + ReLU."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )
    def forward(self, x):
        return self.block(x)

class UpBlock(nn.Module):
    """Upsample by 2x (transpose conv) + concat skip + ConvBlock."""
    def __init__(self, in_ch, skip_ch, out_ch):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_ch, out_ch, kernel_size=2, stride=2)
        self.conv = ConvBlock(out_ch + skip_ch, out_ch)
    def forward(self, x, skip):
        x = self.up(x)
        if x.shape[-2:] != skip.shape[-2:]:
            x = F.interpolate(x, size=skip.shape[-2:], mode="bilinear", align_corners=False)
        x = torch.cat([x, skip], dim=1)
        return self.conv(x)

# --------------------------
# Transformer over deep features
# --------------------------
class ViTOnFeatures(nn.Module):
    """
    Transformer encoder over flattened spatial tokens from the deepest CNN feature map.
    - input:  (B, C_in, H, W)
    - output: (B, 1024, H, W)  # projected back for decoder
    """
    def __init__(
        self,
        in_channels=2048,
        embed_dim=768,
        depth=12,
        num_heads=12,
        mlp_ratio=4.0,
        dropout=0.0,
        img_feature_size=(7, 7),  # (H/32, W/32) for 224x224 input with ResNet50
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.Hf, self.Wf = img_feature_size
        L = self.Hf * self.Wf

        # Per-location linear projection: C_in -> D
        self.proj = nn.Linear(in_channels, embed_dim)

        # Learnable absolute positional embeddings (match checkpoint key: transformer.pos_embed)
        self.pos_embed = nn.Parameter(torch.zeros(1, L, embed_dim))
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

        enc_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=int(embed_dim * mlp_ratio),
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True,
        )
        self.encoder = nn.TransformerEncoder(enc_layer, num_layers=depth)

        # Project transformer features back to 1024 channels for decoder
        self.out_conv = nn.Conv2d(embed_dim, 1024, kernel_size=1)

    def forward(self, x):
        B, C, H, W = x.shape
        # Ensure feature size matches positional embedding assumptions
        assert (H, W) == (self.Hf, self.Wf), \
            f"Deep feature size {(H, W)} != expected {(self.Hf, self.Wf)}. " \
            "If you changed input size, set img_feature_size accordingly."

        L = H * W
        tokens = x.permute(0, 2, 3, 1).reshape(B, L, C)  # (B, L, C)
        tokens = self.proj(tokens)                        # (B, L, D)
        tokens = tokens + self.pos_embed.to(tokens.device)
        tokens = self.encoder(tokens)                     # (B, L, D)

        feat = tokens.reshape(B, H, W, self.embed_dim).permute(0, 3, 1, 2).contiguous()
        feat = self.out_conv(feat)                        # (B, 1024, H, W)
        return feat

# --------------------------
# Full TransUNet (names aligned with your checkpoint)
# --------------------------
class TransUNet(nn.Module):
    """
    ResNet50 encoder (enc_*) + ViT bottleneck (transformer.*) + UNet decoder with skips.
    """
    def __init__(
        self,
        num_classes=1,
        transformer_embed_dim=768,
        transformer_depth=12,
        transformer_heads=12,
        transformer_mlp_ratio=4.0,
        transformer_dropout=0.0,
        pretrained_encoder=True,
        img_size=224,
    ):
        super().__init__()

        # ---- ResNet50 Encoder (attribute names prefixed with enc_* to match your ckpt) ----
        weights = ResNet50_Weights.IMAGENET1K_V2 if pretrained_encoder else None
        backbone = resnet50(weights=weights)

        self.enc_conv1   = backbone.conv1   # /2, 64
        self.enc_bn1     = backbone.bn1
        self.enc_relu    = backbone.relu
        self.enc_maxpool = backbone.maxpool
        self.enc_layer1  = backbone.layer1  # /4, 256
        self.enc_layer2  = backbone.layer2  # /8, 512
        self.enc_layer3  = backbone.layer3  # /16, 1024
        self.enc_layer4  = backbone.layer4  # /32, 2048

        # For 224x224 input, enc_layer4 output is 7x7
        Hf = Wf = img_size // 32

        # ---- Transformer on deepest feature map (module name 'transformer' to match ckpt) ----
        self.transformer = ViTOnFeatures(
            in_channels=2048,
            embed_dim=transformer_embed_dim,
            depth=transformer_depth,
            num_heads=transformer_heads,
            mlp_ratio=transformer_mlp_ratio,
            dropout=transformer_dropout,
            img_feature_size=(Hf, Wf),
        )

        # ---- Decoder (UNet-style) ----
        self.dec3 = UpBlock(in_ch=1024, skip_ch=1024, out_ch=512)  # /32 -> /16
        self.dec2 = UpBlock(in_ch=512,  skip_ch=512,  out_ch=256)  # /16 -> /8
        self.dec1 = UpBlock(in_ch=256,  skip_ch=256,  out_ch=128)  # /8  -> /4
        self.dec0 = UpBlock(in_ch=128,  skip_ch=64,   out_ch=64)   # /4  -> /2

        self.final_up = nn.ConvTranspose2d(64, 64, kernel_size=2, stride=2)  # /2 -> /1
        self.seg_head = nn.Conv2d(64, num_classes, kernel_size=1)

        self._init_new_layers()

    def _init_new_layers(self):
        # Initialize decoder-only layers (encoder is pretrained)
        for m in [self.dec3, self.dec2, self.dec1, self.dec0, self.final_up, self.seg_head]:
            for layer in m.modules():
                if isinstance(layer, (nn.Conv2d, nn.ConvTranspose2d)):
                    nn.init.kaiming_normal_(layer.weight, mode='fan_out', nonlinearity='relu')
                    if layer.bias is not None:
                        nn.init.zeros_(layer.bias)
                elif isinstance(layer, nn.BatchNorm2d):
                    nn.init.ones_(layer.weight)
                    nn.init.zeros_(layer.bias)

    def forward(self, x):
        B, C, H, W = x.shape

        # ---- Encoder ----
        x0 = self.enc_relu(self.enc_bn1(self.enc_conv1(x)))
        x1 = self.enc_layer1(self.enc_maxpool(x0))
        x2 = self.enc_layer2(x1)
        x3 = self.enc_layer3(x2)
        x4 = self.enc_layer4(x3)

        # ---- Transformer bottleneck ----
        t4 = self.transformer(x4)

        # ---- Decoder with skips ----
        d3 = self.dec3(t4, x3)
        d2 = self.dec2(d3, x2)
        d1 = self.dec1(d2, x1)
        d0 = self.dec0(d1, x0)
        out = self.final_up(d0)
        out = self.seg_head(out)

        # Guard in case input not divisible by 32
        if out.shape[-2:] != (H, W):
            out = F.interpolate(out, size=(H, W), mode="bilinear", align_corners=False)
        return out

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
transunet = TransUNet().to(device)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "transunet1_kidney.pth")
transunet.load_state_dict(torch.load(model_path, map_location=device))

def extract_roi(image_np, mask_np):
    mask_bin = mask_np > 0.5
    coords = np.argwhere(mask_bin)
    if coords.shape[0] == 0:
        return image_np.copy()
    y0, x0 = coords.min(axis=0)
    y1, x1 = coords.max(axis=0)
    roi = image_np[y0:y1, x0:x1]
    if roi.size == 0:
        return image_np.copy()
    return roi

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def get_mask(image_pil):
    img_tensor = preprocess(image_pil).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = transunet(img_tensor)
        mask = torch.sigmoid(logits).cpu().numpy()[0, 0]  # (H, W)
    mask = (mask > 0.5).astype(np.uint8)
    return mask


model = models.resnet50()
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(num_ftrs, 2)
)

model_path2 = os.path.join(BASE_DIR, "ckd_classifier_resnet50_2_2.pth")
model.load_state_dict(torch.load(model_path2, map_location=device))
model = model.to(device)

transform_single = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

CLASS_IDX_TO_NAME = {
    1: "ckd",
    0: "notckd"
}


class ImageURL(BaseModel):
    url: HttpUrl


@router.post("/unet_predict")
async def predict_unet(request: Request):
    try:
        data = await request.json()  # Get JSON payload
        img_url = data.get("url")    # Expect {"url": "some_image_path_or_url"}

        if not img_url:
            return {"error": "No image URL provided"}

        # Load image from URL or local path
        if img_url.startswith("http://") or img_url.startswith("https://"):
            response = requests.get(img_url)
            response.raise_for_status()  # Ensure download succeeded
            image_pil = Image.open(BytesIO(response.content)).convert("RGB")
        else:
            image_pil = Image.open(img_url).convert("RGB")

        # Run UNet to get mask
        mask_np = get_mask(image_pil)  # Your existing function
        image_np = np.array(image_pil)
        roi_np = extract_roi(image_np, mask_np)

        # Convert ROI back to PIL Image for transforms
        roi_pil = Image.fromarray(roi_np).convert("RGB")
        image_tensor = transform_single(roi_pil).unsqueeze(0).to(device)

        # Classifier prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probs = torch.softmax(outputs, dim=1).squeeze(0)  # Full probabilities

        probs_list = probs.cpu().numpy().tolist()
        pred_idx = torch.argmax(probs).item()
        pred_class = CLASS_IDX_TO_NAME[pred_idx]

        return {
            "prediction": pred_class,
            "probabilities": probs_list
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}




   