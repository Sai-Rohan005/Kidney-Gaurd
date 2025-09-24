import React, { useState, useEffect } from 'react'
import './DoctorDashboard.css'
import axios from 'axios'

const DoctorDashboard = ({ activeView }) => {
  const mapActiveViewToTab = (view) => {
    switch (view) {
      case 'dashboard':  
        return 'pending'
      case 'appointments':
        return 'appointments'
      case 'reports':
        return 'reports'
      default:
        return 'pending'
    }
  }

  const [activeTab, setActiveTab] = useState('pending')
  const [user, setUser] = useState(null)

  const [pendingDocuments, setPendingDocuments] = useState([])
  const [appointments, setAppointments] = useState([])
  const [completedReports, setCompletedReports] = useState([])

  const [selectedDocument, setSelectedDocument] = useState(null)
  const [reportForm, setReportForm] = useState({
    diagnosis: '',
    recommendations: '',
    medications: '',
    followUpDate: '',
    notes: ''
  })

  // Fetch user info
  useEffect(() => {
    async function fetchingUser() {
      try {
        const storedUser = await axios.get('http://localhost:5500/getuser', {
          withCredentials: true
        })
        setUser(storedUser.data)
      } catch (err) {
        console.log(err)
      }
    }
    fetchingUser()
  }, [])

  useEffect(() => {
    if (activeView) {
      setActiveTab(mapActiveViewToTab(activeView))
    }
  }, [activeView])


  useEffect(()=>{
    const fetchapp=async()=>{
      try{
        const res=await axios.get('http://localhost:5500/getdoctorappointments',{
          withCredentials:true
        });
        const allapp=res.data.appointments;
        const pending = [];
        const completed = [];
        const all = [];

      allapp.forEach((i) => {
        if (i.status === "Pending") {
          pending.push(i);
        } else if (i.status === "completed") {
          completed.push(i);
        }else{

          all.push(i);
        }
      });

      setPendingDocuments(pending);
      setCompletedReports(completed);
      setAppointments(all);
      }catch(err){
        console.log(err);
      }
    }
    fetchapp();
  },[])

  // Handlers
  const handleDocumentReview = async(document) => {
    try{
        document.status="Pending";
       const updatestatus=await axios.post("http://localhost:5500/updatedoctorappointmentstatus",document,{
        withCredentials:true
       });
       console.log(updatestatus.data);
       setSelectedDocument(document);

    }catch(err){
      console.log(err);
    }
  }

  const handleReportSubmit = () => {
    if (!selectedDocument || !reportForm.diagnosis || !reportForm.recommendations) {
      alert('Please fill in all required fields')
      return
    }

    const newReport = {
      id: completedReports.length + 1,
      patientName: selectedDocument.patientName,
      reportTitle: `Medical Report - ${selectedDocument.documentType}`,
      completedDate: new Date().toISOString().split('T')[0],
      diagnosis: reportForm.diagnosis,
      recommendations: reportForm.recommendations,
      medications: reportForm.medications,
      followUpDate: reportForm.followUpDate,
      notes: reportForm.notes
    }

    setCompletedReports([...completedReports, newReport])
    setPendingDocuments(pendingDocuments.filter(doc => doc.id !== selectedDocument.id))
    setSelectedDocument(null)
    setReportForm({
      diagnosis: '',
      recommendations: '',
      medications: '',
      followUpDate: '',
      notes: ''
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setReportForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // ---- Tabs ----
  const renderPendingTab = () => (
    <div className="pending-section">
      <div className="section-header">
        <h3 className="text-heading-2">Pending Document Reviews</h3>
        <p className="text-body-large">Prioritize patient reviews and provide comprehensive medical reports</p>
      </div>
      

      {selectedDocument ? (
        <div className="document-review">
          <div className="review-header">
            <button 
              className="back-btn"
              onClick={() => setSelectedDocument(null)}
            >
              ← Back to List
            </button>
            <h4>Reviewing: {selectedDocument.documentName}</h4>
            <p>Patient: {selectedDocument.patientName}</p>
          </div>

          <div className="document-viewer">
            <div className="document-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <p>Document: {selectedDocument.documentName}</p>
              <p>Type: {selectedDocument.documentType}</p>
              <p>Uploaded: {selectedDocument.uploadDate}</p>
            </div>
          </div>

          <div className="report-form">
            <h5>Medical Report</h5>
            
            <div className="form-group">
              <label htmlFor="diagnosis">Diagnosis *</label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={reportForm.diagnosis}
                onChange={handleInputChange}
                placeholder="Enter your diagnosis based on the document review..."
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="recommendations">Recommendations *</label>
              <textarea
                id="recommendations"
                name="recommendations"
                value={reportForm.recommendations}
                onChange={handleInputChange}
                placeholder="Provide treatment recommendations and lifestyle advice..."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="medications">Medications</label>
              <textarea
                id="medications"
                name="medications"
                value={reportForm.medications}
                onChange={handleInputChange}
                placeholder="List prescribed medications and dosages..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="followUpDate">Follow-up Date</label>
                <input
                  type="date"
                  id="followUpDate"
                  name="followUpDate"
                  value={reportForm.followUpDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={reportForm.notes}
                onChange={handleInputChange}
                placeholder="Any additional observations or notes..."
                rows="2"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setSelectedDocument(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="submit-btn"
                onClick={handleReportSubmit}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="documents-grid">
          {pendingDocuments.map(doc => (
            <div className="document-card card card-hover">
              <div className="document-header">
                <div className="document-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                </div>
              </div>
              <div className="document-details">
                <div className="detail-item">
                  <span className="text-label">Patient:</span>
                  <span className="text-body">{doc.patientEmail}</span>
                </div>
                <div className="detail-item">
                  <span className="text-label">Problem Mentioned:</span>
                  <span className="text-body">{doc.problem}</span>
                </div>
                <div className="detail-item">
                  <span className="text-label">Appointed:</span>
                  <span className="text-caption">{new Date(doc.date).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                className="review-btn"
                onClick={() => handleDocumentReview(doc)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Review Document
              </button>
            </div>
          ))}
          
          {pendingDocuments.length === 0 && (
            <div className="no-documents">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              <h4>No Pending Documents</h4>
              <p>All patient documents have been reviewed</p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderAppointmentsTab = () => (
    <div className="appointments-section">
      <div className="section-header">
        <h3 className="text-heading-2">My Appointments</h3>
        <p className="text-body-large">Manage your scheduled patient consultations and access patient records</p>
      </div>

      <div className="appointments-list">
        {appointments.map(apt => (
          <div className="appointment-card card card-hover">
            <div className="appointment-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div className="appointment-info">
              <h5 className="text-body">{apt.patientEmail}</h5>
              <p className="text-caption">{apt.type}</p>
              <p className="text-body">{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
            </div>
            <div className="appointment-actions">
              <span className={`badge ${apt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                {apt.status === 'Confirmed' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                )}
                {apt.status === 'Pending' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                )}
                {apt.status}
              </span>
              <button className="view-patient-btn" onClick={() => handleDocumentReview(apt)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m22 21-3-3m0 0a5 5 0 1 0-7-7 5 5 0 0 0 7 7z"></path>
                </svg>
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderReportsTab = () => (
    <div className="reports-section">
      Reports UI
      {/* ... keep your existing reports JSX ... */}
    </div>
  )

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.name || 'Doctor'}</h2>
        <p>Review patient documents and manage appointments</p>
      </div>

      {/* ---- Tab Buttons ---- */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Reviews ({pendingDocuments.length})
        </button>

        <button
          className={activeTab === 'appointments' ? 'active' : ''}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>

        <button
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          Completed Reports
        </button>
      </div>

      {/* ---- Tab Content ---- */}
      <div className="dashboard-content">
        {activeTab === 'pending' && renderPendingTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
        {activeTab === 'reports' && renderReportsTab()}
      </div>
    </div>
  )
}

export default DoctorDashboard
