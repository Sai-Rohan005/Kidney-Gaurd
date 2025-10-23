// models/patient_details.js
const mongoose = require('mongoose');
require('dotenv').config(); // <-- add this line

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const doctorschema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  qualifications: String, 
  specialization: { type: String, required: true }, // e.g., cardiologist, dentist
  experienceYears: { type: Number },
  
  contactInfo: {
    email: { type: String,unique: true },
    phone: { type: String },
    address: { type: String }
  },

  clinic: {
    name: { type: String },
    address: { type: String }
  },

  appointments: [], 
  rating: { type: Number, min: 0, max: 5 },

});

module.exports = mongoose.model('doctor_details', doctorschema);
