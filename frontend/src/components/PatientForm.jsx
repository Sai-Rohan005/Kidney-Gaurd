import React, { useState } from 'react'
import './PatientForm.css'

const PatientForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    kidneyCondition: '',
    creatinineLevel: '',
    gfrLevel: '',
    bloodPressure: '',
    diabetic: false,
    hypertension: false,
    familyHistory: ''
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Patient data:', formData)
    // Here you would typically send the data to your backend
    alert('Patient information saved successfully!')
  }

  return (
    <div className="patient-form-container">
      <div className="form-header">
        <h1>Patient Information</h1>
        <p>Add or update patient medical records and kidney health data</p>
      </div>

      <form onSubmit={handleSubmit} className="patient-form">
        <div className="form-section">
          <h2>Personal Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="2"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Emergency Contact</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="emergencyContact">Contact Name</label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyPhone">Contact Phone</label>
              <input
                type="tel"
                id="emergencyPhone"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Medical History</h2>
          <div className="form-group full-width">
            <label htmlFor="medicalHistory">Medical History</label>
            <textarea
              id="medicalHistory"
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              rows="3"
              placeholder="Previous surgeries, chronic conditions, etc."
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="currentMedications">Current Medications</label>
            <textarea
              id="currentMedications"
              name="currentMedications"
              value={formData.currentMedications}
              onChange={handleInputChange}
              rows="3"
              placeholder="List all current medications and dosages"
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="allergies">Allergies</label>
            <textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleInputChange}
              rows="2"
              placeholder="Drug allergies, food allergies, etc."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Kidney Health Information</h2>
          <div className="form-group full-width">
            <label htmlFor="kidneyCondition">Primary Kidney Condition</label>
            <select
              id="kidneyCondition"
              name="kidneyCondition"
              value={formData.kidneyCondition}
              onChange={handleInputChange}
            >
              <option value="">Select Condition</option>
              <option value="chronic-kidney-disease">Chronic Kidney Disease</option>
              <option value="acute-kidney-injury">Acute Kidney Injury</option>
              <option value="kidney-stones">Kidney Stones</option>
              <option value="polycystic-kidney-disease">Polycystic Kidney Disease</option>
              <option value="glomerulonephritis">Glomerulonephritis</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="creatinineLevel">Creatinine Level (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                id="creatinineLevel"
                name="creatinineLevel"
                value={formData.creatinineLevel}
                onChange={handleInputChange}
                placeholder="e.g., 1.2"
              />
            </div>
            <div className="form-group">
              <label htmlFor="gfrLevel">GFR Level (mL/min/1.73m²)</label>
              <input
                type="number"
                id="gfrLevel"
                name="gfrLevel"
                value={formData.gfrLevel}
                onChange={handleInputChange}
                placeholder="e.g., 60"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bloodPressure">Blood Pressure</label>
              <input
                type="text"
                id="bloodPressure"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleInputChange}
                placeholder="e.g., 120/80"
              />
            </div>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="diabetic"
                checked={formData.diabetic}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Diabetic
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hypertension"
                checked={formData.hypertension}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Hypertension
            </label>
          </div>
          <div className="form-group full-width">
            <label htmlFor="familyHistory">Family History of Kidney Disease</label>
            <textarea
              id="familyHistory"
              name="familyHistory"
              value={formData.familyHistory}
              onChange={handleInputChange}
              rows="2"
              placeholder="Any family history of kidney disease or related conditions"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save Patient Information
          </button>
        </div>
      </form>
    </div>
  )
}

export default PatientForm
