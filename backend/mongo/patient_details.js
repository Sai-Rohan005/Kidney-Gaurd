// models/patient_details.js
const mongoose = require('mongoose');
require('dotenv').config(); // <-- add this line

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const patientschema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  doctor_email: {
    type: String,
    lowercase: true,
    trim: true
  },
  clinical_data: {
    "Age of the patient": Number,
    "Blood pressure (mm/Hg)": Number,
    "Specific gravity of urine": Number,
    "Albumin in urine": Number,
    "Sugar in urine": Number,
    "Red blood cells in urine": String,
    "Pus cells in urine": String,
    "Pus cell clumps in urine": String,
    "Bacteria in urine": String,
    "Random blood glucose level (mg/dl)": Number,
    "Blood urea (mg/dl)": Number,
    "Serum creatinine (mg/dl)": Number,
    "Sodium level (mEq/L)": Number,
    "Potassium level (mEq/L)": Number,
    "Hemoglobin level (gms)": Number,
    "Packed cell volume (%)": Number,
    "White blood cell count (cells/cumm)": Number,
    "Red blood cell count (millions/cumm)": Number,
    "Hypertension (yes/no)": String,
    "Diabetes mellitus (yes/no)": String,
    "Coronary artery disease (yes/no)": String,
    "Appetite (good/poor)": String,
    "Pedal edema (yes/no)": String,
    "Anemia (yes/no)": String
  },
  ultrasound_data: {
    type: Array,
    default: []
  },
  tab_res: {
    result: String,
    confidence: Number
  },
  appointment_dates:[],
  unet_res: {
    result: String,
    confidence: Number
  },
  results: {
    final_diagnosis: String,
    doctor_notes: String,
    medications: String,
    follow_up_date: Date
  },
  reports: {
    type: Array,
    default: []
  },
  analysis: {
    res_dates: {
      type: Array,
      default: []
    },
    Gfr: {
      type: Array,
      default: []
    }
  },
  public_id: {
    type: Array,
    default: []
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('patient_details', patientschema);
