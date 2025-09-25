
import cv2, numpy as np
from PIL import Image
from paddleocr import PaddleOCR
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel

router = APIRouter()
# 1) Init models
ocr = PaddleOCR(use_angle_cls=True, lang='en')
processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-printed")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-printed").eval()

# (Optional for handwriting)
# processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
# model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten").eval()

# 2) Helper: crop a quadrilateral region with perspective correction
def quad_crop(img, quad):
    pts = np.array(quad, dtype="float32")
    # compute target rectangle size
    (tl, tr, br, bl) = pts
    wA = np.linalg.norm(br - bl); wB = np.linalg.norm(tr - tl)
    hA = np.linalg.norm(tr - br); hB = np.linalg.norm(tl - bl)
    maxW, maxH = int(max(wA, wB)), int(max(hA, hB))
    dst = np.array([[0,0],[maxW-1,0],[maxW-1,maxH-1],[0,maxH-1]], dtype="float32")
    M = cv2.getPerspectiveTransform(pts, dst)
    warped = cv2.warpPerspective(img, M, (maxW, maxH))
    return warped

ocr = PaddleOCR(use_textline_orientation=True, lang='en')


field_aliases = {
    "Age of the patient": [
        "Age",
        "Patient age",
        "Age (yrs) / Age (years)",
        "Client age",
        "Age of person",
        "Age of client",
        "Patient’s age",
        "Age (in years)",
        "Aged"
    ],
    "Blood pressure (mm/Hg)": [
        "Blood pressure",
        "BP",
        "B.P.",
        "B.P (mmHg)",
        "Systolic/Diastolic",
        "SBP/DBP",
        "B.P Reading",
        "Arterial pressure",
        "120/80 mmHg format"
    ],
    "Specific gravity of urine": [
        "Specific gravity",
        "Urine SG",
        "SG (urine)",
        "Sp. gravity",
        "Urine specific gravity",
        "U. SG"
    ],
    "Albumin in urine": [
        "Albumin",
        "Urine albumin",
        "Protein",
        "Proteinuria",
        "Alb",
        "Albuminuria"
    ],
    "Sugar in urine": [
        "Sugar",
        "Urine sugar",
        "Glucose (urine)",
        "Glycosuria",
        "Urine glucose",
        "U sugar"
    ],
    "Red blood cells in urine": [
        "RBC (urine)",
        "Urine RBC",
        "Red cells",
        "Microscopic RBC",
        "Hematuria",
        "Urinary RBC"
    ],
    "Pus cells in urine": [
        "Pus cells",
        "Urine pus cells",
        "Pyuria",
        "WBC (urine)",
        "White cells (urine)",
        "Urinary leukocytes"
    ],
    "Pus cell clumps in urine": [
        "Pus cell clumps",
        "Pus clumps",
        "WBC clumps",
        "Leukocyte clumps",
        "Pus clusters"
    ],
    "Bacteria in urine": [
        "Bacteria",
        "Urinary bacteria",
        "Bacteriuria",
        "Organisms in urine",
        "Urine organisms",
        "Microbes in urine"
    ],
    "Random blood glucose level (mg/dl)": [
        "Random blood sugar",
        "RBS",
        "RBG",
        "Random glucose",
        "Random plasma glucose",
        "Blood sugar random",
        "Glucose random",
        "Sugar random"
    ],
    "Blood urea (mg/dl)": [
        "Urea",
        "Blood urea",
        "Serum urea",
        "Plasma urea",
        "Urea level",
        "Urea (mg/dl)"
    ],
    "Serum creatinine (mg/dl)": [
        "Creatinine",
        "Serum creatinine",
        "Plasma creatinine",
        "Cr",
        "Creat",
        "S. Creatinine"
    ],
    "Sodium level (mEq/L)": [
        "Sodium",
        "Na",
        "Na+",
        "Serum sodium",
        "Plasma sodium",
        "Sodium (mEq/L)"
    ],
    "Potassium level (mEq/L)": [
        "Potassium",
        "K",
        "K+",
        "Serum potassium",
        "Plasma potassium",
        "Potassium (mEq/L)"
    ],
    "Hemoglobin level (gms)": [
        "Hemoglobin",
        "Hb",
        "Hgb",
        "Hemoglobin level",
        "Blood hemoglobin",
        "Hb%"
    ],
    "Packed cell volume (%)": [
        "PCV",
        "Packed cell volume",
        "Hematocrit",
        "HCT",
        "Cell volume",
        "Hct%"
    ],
    "White blood cell count (cells/cumm)": [
        "WBC",
        "White blood cells",
        "Leukocytes",
        "TLC (total leukocyte count)",
        "WBC count",
        "Total WBC"
    ],
    "Red blood cell count (millions/cumm)": [
        "RBC",
        "Red blood cells",
        "RBC count",
        "Erythrocytes",
        "Total RBC"
    ],
    "Hypertension (yes/no)": [
        "Hypertension",
        "HTN",
        "High BP",
        "Raised blood pressure",
        "Hypertensive",
        "BP status"
    ],
    "Diabetes mellitus (yes/no)": [
        "Diabetes",
        "DM",
        "Diabetic",
        "Diabetes mellitus",
        "Sugar disease",
        "Blood sugar status"
    ],
    "Coronary artery disease (yes/no)": [
        "CAD",
        "Coronary artery disease",
        "Ischemic heart disease",
        "IHD",
        "Heart disease",
        "Coronary disease",
        "Artery blockage"
    ],
    "Appetite (good/poor)": [
        "Appetite",
        "Appetite status",
        "Hunger",
        "Eating status",
        "Food intake",
        "Appetite condition"
    ],
    "Pedal edema (yes/no)": [
        "Pedal edema",
        "Leg swelling",
        "Ankle swelling",
        "Foot edema",
        "Swelling in feet",
        "Edema in legs"
    ],
    "Anemia (yes/no)": [
        "Anemia",
        "Anaemia (British spelling)",
        "Low Hb",
        "Low hemoglobin",
        "Anemic",
        "Hb deficiency"
    ]
}



def normalize_field(ocr_text, field_aliases):
    # if OCR returns dicts, extract text
    if isinstance(ocr_text, dict):
        ocr_text = ocr_text.get("text", "")

    ocr_text_lower = ocr_text.lower().strip()

    for canonical, aliases in field_aliases.items():
        for alias in aliases:
            if ocr_text_lower == alias.lower():
                return canonical
    return None

class ImagePath(BaseModel):
    image_path: str

@router.post("/extract_text")
async def extract_text(file: UploadFile = File(...)):
    # Read the file into memory
    file_bytes = await file.read()

    # If it's an image, you can use PIL or OpenCV
    from PIL import Image
    import io
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")

    # Run OCR
    results = ocr.ocr(np.array(image))

    # Parse OCR results as before
    ocr_lines = []
    for page in results:
        for line in page:
            ocr_lines.append({
                "text": line[1][0],           # recognized text
                "confidence": line[1][1],     # confidence score
                "box": line[0]                 # bounding box
            })

    return {"ocr_lines": ocr_lines}