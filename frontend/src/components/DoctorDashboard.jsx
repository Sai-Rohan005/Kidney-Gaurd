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

  // Handlers
  const handleDocumentReview = (document) => {
    setSelectedDocument(document)
    setReportForm({
      diagnosis: '',
      recommendations: '',
      medications: '',
      followUpDate: '',
      notes: ''
    })
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
      Pending documents UI
      {/* ... keep your existing pending document JSX ... */}
    </div>
  )

  const renderAppointmentsTab = () => (
    <div className="appointments-section">
      Appointments UI
      {/* ... keep your existing appointments JSX ... */}
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
