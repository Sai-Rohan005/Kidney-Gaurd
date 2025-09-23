
import cv2, numpy as np
from PIL import Image
from paddleocr import PaddleOCR
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from fastapi import APIRouter
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
def extract_text(request: ImagePath):
    img_path = request.image_path
    results = ocr.predict(img_path)  # PaddleOCR results

    ocr_lines = []
    for page in results:
        texts = page['rec_texts']
        scores = page['rec_scores']
        boxes  = page['rec_boxes']

        for text, score, box in zip(texts, scores, boxes):
            # Convert box (NumPy array) to list for JSON serialization
            ocr_lines.append({
                "text": text,
                "confidence": score,
                "box": box.tolist() if isinstance(box, np.ndarray) else box
            })

    structured = {}
    for i, line in enumerate(ocr_lines[:-1]):
        canonical = normalize_field(line, field_aliases)
        if canonical:
            next_line = ocr_lines[i + 1]
            value = next_line.get("text", "") if isinstance(next_line, dict) else str(next_line)
            structured[canonical] = value

    return {"ocr_lines": ocr_lines, "structured": structured}

