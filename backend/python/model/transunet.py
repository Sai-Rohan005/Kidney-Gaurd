

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import io
import torch
import torchvision.transforms as transforms

# Import your TransUNet model
from model.transunet import TransUNet  # adjust this to your actual import path

# Initialize FastAPI
app = FastAPI()

# Load your pretrained TransUNet model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = TransUNet(img_size=224, num_classes=1)  # example: 1 class for segmentation
model.load_state_dict(torch.load("transunet_ckpt.pth", map_location=device))
model.to(device)
model.eval()

# Define image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),  # Match model input size
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5])  # Modify for RGB if needed
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read and convert image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Preprocess image
        input_tensor = transform(image).unsqueeze(0).to(device)

        # Run prediction
        with torch.no_grad():
            output = model(input_tensor)
            prediction = torch.sigmoid(output).squeeze().cpu().numpy()

        # Return the prediction (you can return the full mask or some stats)
        return JSONResponse(content={
            "message": "Prediction successful",
            "prediction_shape": str(prediction.shape),
            "prediction_mean": float(prediction.mean())  # example: overall confidence
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
