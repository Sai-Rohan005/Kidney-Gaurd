import React, { useState, useEffect } from 'react'
import './PatientDashboard.css'
import { useNotifications } from '../contexts/NotificationContext'
import Header from './Header'
import Layout from './layout'
import axios from 'axios'

const PatientDashboard = ({ user, activeView, onBackToHome, defaultActiveTab }) => {
  const { notifyAppointmentBooked, notifyDocumentUploaded } = useNotifications()
  const [activeTab, setActiveTab] = useState(defaultActiveTab || 'dashboard')
  const [alldoctors,setalldoctors]=useState("null");
  const [uploadtab,setuploadtab]=useState("clinical");
  const [formfile,setformfile]=useState(null);
  const [clinicalformdata,setclinicalformdata]=useState({
        "Age of the patient":"",
        "Blood pressure (mm/Hg)":"",
        "Specific gravity of urine":"",
        "Albumin in urine":"",
        "Sugar in urine":"",
        "Red blood cells in urine":"",
        "Pus cells in urine":"",
        "Pus cell clumps in urine":"",
        "Bacteria in urine":"",
        "Random blood glucose level (mg/dl)":"",
        "Blood urea (mg/dl)":"",
        "Serum creatinine (mg/dl)":"",
        "Sodium level (mEq/L)":"",
        "Potassium level (mEq/L)":"",
        "Hemoglobin level (gms)":"",
        "Packed cell volume (%)":"",
        "White blood cell count (cells/cumm)":"",
        "Red blood cell count (millions/cumm)":"",
        "Hypertension (yes/no)":"",
        "Diabetes mellitus (yes/no)":"",
        "Coronary artery disease (yes/no)":"",
        "Appetite (good/poor)":"",
        "Pedal edema (yes/no)":"",
        "Anemia (yes/no)":""
    })

  const [fupload, setfupload] = useState(0);

  const [problem, setProblem] = useState(""); // variable to store input value

  const handleProblemChange = (e) => {
    setProblem(e.target.value); // update variable whenever user types
  };

  // Update activeTab based on sidebar navigation
  useEffect(() => {
    if (activeView === 'upload') {
      setActiveTab('upload')
    } else if (activeView === 'appointments') {
      setActiveTab('appointments')
    } 
    else if (activeView === 'reports') {
      setActiveTab('reports')
    } 
    else if (activeView === 'analytics') {
      setActiveTab('analytics')
    } 
    else {
      setActiveTab('dashboard')
    }
  }, [activeView])

  useEffect(() => {
    const getalldoctor=async()=>{
      try{
        const res=await axios.get("http://localhost:5500/alldoctor",{Credential:true});
        if(res.data.message==="No doctors available"){
          setalldoctors("null");
          return;
        }
        setalldoctors(res.data.docdata);
        console.log(res.data.docdata);
      }catch(err){
        console.log(err);
      }
    }
    getalldoctor();
  },[])

  
  
  const [uploadedDocuments, setUploadedDocuments] = useState([
    {
      id: 1,
      name: 'Blood Test Report.pdf',
      uploadDate: '2024-08-30',
      status: 'Under Review',
      doctor: 'Dr. Sarah Johnson'
    }
  ])
  
  useEffect(()=>{
    const getuploads=async()=>{
      try{
        const alluploads=await axios.get("http://localhost:5500/getuploads",{withCredentials:true});
        if(alluploads.data.message==="No uploads yet"){
          setUploadedDocuments([
            {
              id: 1,
              name: 'Blood Test Report.pdf',
              uploadDate: '2024-08-30',
              status: 'Under Review',
              doctor: 'Dr. Sarah Johnson'
            }
          ]);
          return;
        }
        if(alluploads.data.status==200){
        setUploadedDocuments(alluploads.data.alluploads);
        }
      }catch(err){
        console.log(err);
      }
    }
    getuploads();
  },[])
  
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Nephrologist',
      date: '2024-09-05',
      time: '10:00 AM',
      status: 'Confirmed'
    }
  ])
  useEffect(()=>{
    const getappointments=async()=>{
      const app=await axios.get("http://localhost:5500/getappointments",{withCredentials:true});
      if(app.data.message==="No appointments yet"){
        setAppointments([
          {
            id: 1,
            doctor: 'Dr. Sarah Johnson',
            specialty: 'Nephrologist',
            date: '2024-09-05',
            time: '10:00 AM',
            status: 'Confirmed'
          }
        ]);
        return;
      }
      if(app.data.status==200){

        setAppointments(app.data.appointments);
      }
    }
    getappointments();
  },[])
  const [reports, setReports] = useState([])
  const [medicalHistory, setMedicalHistory] = useState([
    {
      id: null,
      date: null,
      doctor: null,
      type: null,
      ckdStage: null,
      gfr: null,
      creatinine: null,
      bloodPressure: null,
      notes: null,
      trend: null
    },
    {
      id: null,
      date: null,
      doctor: null,
      type: null,
      ckdStage: null,
      gfr: null,
      creatinine: null,
      bloodPressure: null,
      notes: null,
      trend: null
    },
    {
      id: null,
      date: null,
      doctor: null,
      type: null,
      ckdStage: null,
      gfr: null,
      creatinine: null,
      bloodPressure: null,
      notes: null,
      trend: null
    }
  ])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [availableDoctors, setAvailableDoctors] = useState([])

  const handlesubmit=async(e)=>{
    e.preventDefault();
    try{
        let resp=await axios.post("http://localhost:5500/clinical_data",clinicalformdata,{withCredentials:true});
        // console.log(resp);
        if(resp.data.message=='Clinical data saved'){
            alert("Data uploaded successfully");
        }else{
            alert(resp.data.message);
        }
        e.target.reset();

    }catch(err){
        console.log(err);
    }
}
const handlechangefile=(e)=>{
    setformfile(e.target.files);
}

const handlefile=async()=>{
  try{
      let respon=await axios.post("http://localhost:5500/clinical_data",formfile);
      console.log(respon);

  }catch(err){
      console.log(err);
  }

}
const handleChange = (e) => {
  const { name, value } = e.target;
  setclinicalformdata((prev) => ({
      ...prev,
      [name]: value,
  }));
};



  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
  }

  const handleFileUpload = async() => {
    if (selectedFiles.length === 0) return
    try {
      const formData = new FormData();
  
      selectedFiles.forEach((file) => {
        formData.append("file", file); // backend should accept "files"
      });
  
      const response = await axios.post("http://localhost:5500/upload", formData,{
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
  
      if (response.data.status==500) {
        throw new Error("Upload failed");
      }
      console.log("Upload success:", response);
      // alert("Files uploaded successfully!");
      
      // // ✅ Reset files after upload (if needed)
      // setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Something went wrong while uploading.");
    }

    const newDocuments = selectedFiles.map((file, index) => ({
      id: uploadedDocuments.length + index + 1,
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
      doctor: 'Assigned automatically'
    }))

    setUploadedDocuments([...uploadedDocuments, ...newDocuments])
    setSelectedFiles([])
    
    // Notify doctors about new document uploads
    selectedFiles.forEach(file => {
      notifyDocumentUploaded(
        user?.name || 'Patient',
        user?.email,
        'doctor@kidneyguard.com', // In real app, would notify assigned doctor
        file.name.split('.').pop().toUpperCase() + ' Document'
      )
    })
    
    // Reset file input
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
  }

  const handleBookAppointment = async(doctor, date, time,problem) => {
      try{
        const res=await axios.post("http://localhost:5500/bookappointment",{doctor:doctor.email,date:date,time:time,problem:problem},{withCredentials:true});
        if(res.data.message==="Appointment booked successfully"){
          // alert("Appointment booked successfully");
          const newAppointment = {
            id: appointments.length + 1,
            doctor: doctor.name,
            specialty: doctor.specialty,
            date: date,
            time: time,
            status: 'Pending Confirmation'
          }
          
          setAppointments([...appointments, newAppointment])
          
          // Notify the doctor about the new appointment
          notifyAppointmentBooked(
            user?.name || 'Patient',
            user?.email,
            'doctor@kidneyguard.com', // In real app, would use doctor's actual email
            `${date} at ${time}`
          )
        }else{
          alert(res.data.message);
        }

      }catch(err){
        console.log(err);
      }




    
  }

  const renderDashboardTab = () => (
    <div className="dashboard-overview">
      <div className="health-summary">
        <h3 className="text-heading-2">Your Health Overview</h3>
        <div className="summary-cards">
          <div className="summary-card card card-hover">
            <div className="card-icon kidney-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8 2 5 5 5 9c0 6 7 13 7 13s7-7 7-13c0-4-3-7-7-7z"></path>
                <circle cx="12" cy="9" r="2"></circle>
              </svg>
            </div>
            <div className="card-content">
              <h4 className="text-label">Current CKD Stage</h4>
              <span className="stage-value text-heading-3">Stage -</span>
              <span className="badge badge-success">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Improving
              </span>
            </div>
          </div>
          
          <div className="summary-card card card-hover">
            <div className="card-icon chart-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
              </svg>
            </div>
            <div className="card-content">
              <h4 className="text-label">Latest GFR</h4>
              <span className="gfr-value text-heading-3">75 <span className="text-caption">mL/min</span></span>
              <span className="badge badge-primary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Stable
              </span>
            </div>
          </div>
          
          <div className="summary-card card card-hover">
            <div className="card-icon calendar-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div className="card-content">
              <h4 className="text-label">Next Appointment</h4>
              <span className="appointment-date text-body">Sep 5, 2024</span>
              <span className="appointment-doctor text-caption">Dr. Sarah Johnson</span>
            </div>
          </div>
        </div>
      </div>

      <div className="medical-history">
        <h3 className="text-heading-2">Medical History & Progress</h3>
        <div className="history-timeline">
          {medicalHistory.map((record, index) => (
            <div key={index} className={`timeline-item card ${record.trend}`}>
              <div className="timeline-marker">
                <div className={`timeline-dot ${record.trend}`}></div>
              </div>
              
              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-date">
                    <span className="date text-body">{record.date ? new Date(record.date).toLocaleDateString() : 'No date'}</span>
                    <span className="type text-caption">{record.type || 'No type'}</span>
                  </div>
                  <span className={`badge ${record.trend === 'improving' ? 'badge-success' : record.trend === 'stable' ? 'badge-primary' : 'badge-warning'}`}>
                    {record.trend === 'improving' && (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        Improving
                      </>
                    )}
                    {record.trend === 'stable' && (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Stable
                      </>
                    )}
                    {record.trend === 'declining' && (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                        Needs Attention
                      </>
                    )}
                    {!record.trend && 'No data'}
                  </span>
                </div>
                
                <div className="appointment-info">
                  <h4 className="text-heading-3">{record.doctor || 'No doctor assigned'}</h4>
                </div>
                
                <div className="medical-metrics">
                  <div className="metric">
                    <span className="metric-label text-label">CKD Stage:</span>
                    <span className="metric-value text-body">{record.ckdStage || 'No data'}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label text-label">GFR:</span>
                    <span className="metric-value text-body">{record.gfr || 'No data'} {record.gfr && 'mL/min'}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label text-label">Creatinine:</span>
                    <span className="metric-value text-body">{record.creatinine || 'No data'} {record.creatinine && 'mg/dL'}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label text-label">Blood Pressure:</span>
                    <span className="metric-value text-body">{record.bloodPressure || 'No data'}</span>
                  </div>
                </div>
                
                <div className="doctor-notes">
                  <p className="text-body">{record.notes || 'No notes available'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )

  const renderUploadTab = () => (
    <div className="upload-section">
      <div className="upload-header">
        <h3 className="text-heading-2">Upload Medical Documents</h3>
        <p className="text-body-large">Share your medical reports, test results, and documents with your care team for comprehensive review</p>
      </div>

      <div className="upload-tabs card">
        <div className="flex border-b border-gray-300 mb-4">
          <button
            className={`tab-btn ${uploadtab === 'clinical' ? "active" : ""}`}
            onClick={() => setuploadtab('clinical')}
          >
            Clinical
          </button>
          <button
            className={`tab-btn ${uploadtab === 'ultrasound' ? "active" : ""}`}
            onClick={() => setuploadtab('ultrasound')}
          >
            Ultrasound
          </button>
        </div>

      {uploadtab=='ultrasound' && (
        <div className="upload-area card">
        <div className="file-upload-zone">
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <h4 className="text-heading-3">Drag and drop files here</h4>
          <p className="text-body">or</p>
          <label htmlFor="file-upload" className="upload-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Choose Files
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <p className="upload-hint text-caption">Supports PDF, JPG, PNG, DOC files up to 10MB each</p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="selected-files card">
            <h4 className="text-heading-3">Selected Files</h4>
            <div className="files-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                  </div>
                  <div className="file-details">
                    <span className="file-name text-body">{file.name}</span>
                    <span className="file-size text-caption">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button className="remove-file" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleFileUpload} className="upload-submit-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17,8 12,3 7,8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Upload {selectedFiles.length} Document{selectedFiles.length > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
      )}
      {uploadtab=='clinical' && (
        <>
         {/* <div className="container mt-5"> */}
            {/* Tab Buttons */}
            <div className="tab-button-group">
                <button
                    className={`tab-btn ${fupload === 0 ? "active" : ""}`}
                    onClick={() => setfupload(0)}
                >
                    File Upload
                </button>
                <button
                    className={`tab-btn ${fupload === 1 ? "active" : ""}`}
                    onClick={() => setfupload(1)}
                >
                    Manual Upload
                </button>
            </div>

            {/* Card Content */}
            <div className={`tab-card card shadow-sm ${fupload === 0 ? "left-tab" : "right-tab"}`}>
                <div className="card-body">
                    {fupload === 0 ? (
                         <div className="upload-area card">
                         <div className="file-upload-zone">
                           <div className="upload-icon">
                             <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                               <polyline points="14,2 14,8 20,8"></polyline>
                               <line x1="12" y1="18" x2="12" y2="12"></line>
                               <line x1="9" y1="15" x2="15" y2="15"></line>
                             </svg>
                           </div>
                           <h4 className="text-heading-3">Drag and drop files here</h4>
                           <p className="text-body">or</p>
                           <label htmlFor="file-upload" className="upload-btn">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                               <polyline points="7,10 12,15 17,10"></polyline>
                               <line x1="12" y1="15" x2="12" y2="3"></line>
                             </svg>
                             Choose Files
                           </label>
                           <input
                             id="file-upload"
                             type="file"
                             multiple
                             accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                             onChange={handlechangefile}
                             style={{ display: 'none' }}
                           />
                           <p className="upload-hint text-caption">Supports PDF, JPG, PNG, DOC files up to 10MB each</p>
                         </div>
                 
                         {selectedFiles.length > 0 && (
                           <div className="selected-files card">
                             <h4 className="text-heading-3">Selected Files</h4>
                             <div className="files-list">
                               {selectedFiles.map((file, index) => (
                                 <div key={index} className="file-item">
                                   <div className="file-icon">
                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                       <polyline points="14,2 14,8 20,8"></polyline>
                                     </svg>
                                   </div>
                                   <div className="file-details">
                                     <span className="file-name text-body">{file.name}</span>
                                     <span className="file-size text-caption">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                   </div>
                                   <button className="remove-file" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}>
                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                       <line x1="18" y1="6" x2="6" y2="18"></line>
                                       <line x1="6" y1="6" x2="18" y2="18"></line>
                                     </svg>
                                   </button>
                                 </div>
                               ))}
                             </div>
                             <button onClick={handlefile} className="upload-submit-btn">
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                 <polyline points="17,8 12,3 7,8"></polyline>
                                 <line x1="12" y1="3" x2="12" y2="15"></line>
                               </svg>
                               Upload {selectedFiles.length} Document{selectedFiles.length > 1 ? 's' : ''}
                             </button>
                           </div>
                         )}
                       </div>
                    ) : (
                        <>
                            <h5 className="mb-3">Enter Your Details</h5>
                            <div className="card p-4">
                                <form onSubmit={handlesubmit}>
                                    <div className="row">
                                        {/* Left Section */}
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="age" className="form-label">Age of the patient</label>
                                                <input type="text" className="form-control" id="age" placeholder="Enter age" name="Age of the patient" value={clinicalformdata["Age of the patient"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="bloodPressure" className="form-label">Blood pressure (mm/Hg)</label>
                                                <input type="text" className="form-control" id="bloodPressure" name="Blood pressure (mm/Hg)" value={clinicalformdata["Blood pressure (mm/Hg)"]} onChange={handleChange} />
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="specificGravity" className="form-label">Specific gravity of urine</label>
                                                <input type="text" className="form-control" id="specificGravity" name="Specific gravity of urine" value={clinicalformdata["Specific gravity of urine"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="albumin" className="form-label">Albumin in urine</label>
                                                <input type="text" className="form-control" id="albumin" name="Albumin in urine" value={clinicalformdata["Albumin in urine"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="sugar" className="form-label">Sugar in urine</label>
                                                <input type="text" className="form-control" id="sugar" name="Sugar in urine" value={clinicalformdata["Sugar in urine"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="rbc" className="form-label">Red blood cells in urine</label>
                                                <input type="text" className="form-control" id="rbc" name="Red blood cells in urine" value={clinicalformdata["Red blood cells in urine"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="pusCells" className="form-label">Pus cells in urine</label>
                                                <input type="text" className="form-control" id="pusCells" name="Pus cells in urine" value={clinicalformdata["Pus cells in urine"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="pusClumps" className="form-label">Pus cell clumps in urine</label>
                                                <input type="text" className="form-control" id="pusClumps" name="Pus cell clumps in urine" value={clinicalformdata["Pus cell clumps in urine"]} onChange={handleChange} />
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="bacteria" className="form-label">Bacteria in urine</label>
                                                <input type="text" className="form-control" id="bacteria" name="Bacteria in urine" value={clinicalformdata["Bacteria in urine"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="glucose" className="form-label">Random blood glucose level (mg/dl)</label>
                                                <input type="text" className="form-control" id="glucose" name="Random blood glucose level (mg/dl)" value={clinicalformdata["Random blood glucose level (mg/dl)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="urea" className="form-label">Blood urea (mg/dl)</label>
                                                <input type="text" className="form-control" id="urea" name="Blood urea (mg/dl)" value={clinicalformdata["Blood urea (mg/dl)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="creatinine" className="form-label">Serum creatinine (mg/dl)</label>
                                                <input type="text" className="form-control" id="creatinine" name="Serum creatinine (mg/dl)" value={clinicalformdata["Serum creatinine (mg/dl)"]} onChange={handleChange}/>
                                            </div>
                                        </div>

                                        {/* Right Section */}
                                        <div className="col-md-6">
                                            
                                            <div className="mb-3">
                                                <label htmlFor="sodium" className="form-label">Sodium level (mEq/L)</label>
                                                <input type="text" className="form-control" id="sodium" name="Sodium level (mEq/L)" value={clinicalformdata["Sodium level (mEq/L)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="potassium" className="form-label">Potassium level (mEq/L)</label>
                                                <input type="text" className="form-control" id="potassium" name="Potassium level (mEq/L)" value={clinicalformdata["Potassium level (mEq/L)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="hemoglobin" className="form-label">Hemoglobin level (gms)</label>
                                                <input type="text" className="form-control" id="hemoglobin" name="Hemoglobin level (gms)" value={clinicalformdata["Hemoglobin level (gms)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="pcv" className="form-label">Packed cell volume (%)</label>
                                                <input type="text" className="form-control" id="pcv" name="Packed cell volume (%)" value={clinicalformdata["Packed cell volume (%)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="wbc" className="form-label">White blood cell count (cells/cumm)</label>
                                                <input type="text" className="form-control" id="wbc" name="White blood cell count (cells/cumm)" value={clinicalformdata["White blood cell count (cells/cumm)"]} onChange={handleChange} />
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="rbcCount" className="form-label">Red blood cell count (millions/cumm)</label>
                                                <input type="text" className="form-control" id="rbcCount" name="Red blood cell count (millions/cumm)" value={clinicalformdata["Red blood cell count (millions/cumm)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="hypertension" className="form-label">Hypertension (yes/no)</label>
                                                <input type="text" className="form-control" id="hypertension" name="Hypertension (yes/no)" value={clinicalformdata["Hypertension (yes/no)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="diabetes" className="form-label">Diabetes mellitus (yes/no)</label>
                                                <input type="text" className="form-control" id="diabetes" name="Diabetes mellitus (yes/no)" value={clinicalformdata["Diabetes mellitus (yes/no)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="cad" className="form-label">Coronary artery disease (yes/no)</label>
                                                <input type="text" className="form-control" id="cad" name="Coronary artery disease (yes/no)" value={clinicalformdata["Coronary artery disease (yes/no)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="appetite" className="form-label">Appetite (good/poor)</label>
                                                <input type="text" className="form-control" id="appetite" name="Appetite (good/poor)" value={clinicalformdata["Appetite (good/poor)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="edema" className="form-label">Pedal edema (yes/no)</label>
                                                <input type="text" className="form-control" id="edema" name="Pedal edema (yes/no)" value={clinicalformdata["Pedal edema (yes/no)"]} onChange={handleChange}/>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="anemia" className="form-label">Anemia (yes/no)</label>
                                                <input type="text" className="form-control" id="anemia" name="Anemia (yes/no)" value={clinicalformdata["Anemia (yes/no)"]} onChange={handleChange}/>
                                            </div>
                                        </div>
                                    </div>          

                                    <div className="text-center mt-4">
                                        <button type="submit" className="btn btn-success">Submit</button>
                                    </div>
                                </form>
                            </div>

                        </>
                    )}
                </div>
            </div>

        {/* </div> */}
        </>
      )}
      </div>

      

      <div className="uploaded-documents">
        <h4 className="text-heading-2">Your Uploaded Documents</h4>
        <div className="documents-grid">
          {uploadedDocuments.map(doc => (
            <div key={doc.id} className="document-card card card-hover">
              <div className="document-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
              </div>
              <div className="document-info">
                <h5 className="text-body">{doc.name}</h5>
                {/* <img src={doc} alt="" /> */}
                <p className="text-caption">Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</p>
                <p className="text-caption">Assigned to: {doc.doctor}</p>
              </div>
              <span className={`badge ${doc.status === 'Under Review' ? 'badge-warning' : 'badge-primary'}`}>
                {doc.status === 'Under Review' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                )}
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAppointmentsTab = () => (
    <div className="appointments-section">
      <div className="section-header">
        <h3 className="text-heading-2">Find Your Doctor</h3>
        <p className="text-body-large">Schedule consultations with our experienced healthcare professionals</p>
      </div>

      <div className="doctors-grid">
        {alldoctors.map(doctor => (
          <div key={doctor._id} className="doctor-card card card-hover">
            <div className="doctor-avatar">
              <div className="avatar-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
            <div className="doctor-info">
              <h4 className="text-heading-3">{doctor.email}</h4>
              <p className="specialty text-body">{doctor.specialization}</p>
              <p className="experience text-caption">{doctor.experienceYears} years experience</p>
              <div className="rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.floor(doctor.rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                    </svg>
                  ))}
                  <span className="rating-text text-caption">{doctor.rating}</span>
                </div>
              </div>
            </div>
            <input type="text" placeholder='Mention your problem' className="form-control" name="problem" onChange={handleProblemChange}/>
            <div className="availability">
              <h5 className="text-label">Available Dates</h5>

              <div className="date-buttons">
                {doctor.availability.map(date => (
                  <button
                    key={date}
                    className="date-btn card-hover"
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Book appointment with ${doctor.email} on ${new Date(date).toDateString()} at 10:00 AM?`
                      );
                      if (confirmed) {
                        handleBookAppointment(doctor, date, '10:00 AM',problem);
                      }
                    }}
                  >
                    <span className="date-day text-body">{new Date(date).getDate()}</span>
                    <span className="date-month text-caption">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </button>
                ))}
              </div>


            </div>
          </div>
        ))}
      </div>

      <div className="my-appointments">
        <h4 className="text-heading-2">My Appointments</h4>
        <div className="appointments-list">
          {appointments.map(apt => (
            <div key={apt.id} className="appointment-card card card-hover">
              <div className="appointment-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="appointment-info">
                <h5 className="text-body">{apt.doctor_email}</h5>
                <p className="text-caption">{apt.specialty}</p>
                <p className="text-body">{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
              
              <span className={`badge ${apt.status === 'Confirmed' ? 'badge-success text-white' : 'badge-warning text-dark'}`}>
                {apt.status === 'Confirmed' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                )}
                {apt.status === 'Pending Confirmation' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                )}
                {apt.status}
              </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderReportsTab = () => (
    <div className="reports-section">
      <div className="section-header">
        <h3 className="text-heading-2">Medical Reports</h3>
        <p className="text-body-large">View comprehensive reports and recommendations from your care team</p>
      </div>

      {reports.length === 0 ? (
        <div className="no-reports card">
          <div className="empty-state-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <h4 className="text-heading-3">Your Reports Are On The Way</h4>
          <p className="text-body">Once your doctor has reviewed your documents, your detailed medical reports will appear here.</p>
          <p className="waiting-message text-caption">
            {uploadedDocuments.some(doc => doc.status === 'Under Review' || doc.status === 'Pending Review') 
              ? 'Your documents are currently being reviewed by our medical team...' 
              : 'Upload documents and book appointments to get started with your health journey'}
          </p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report.id} className="report-card card card-hover">
              <div className="report-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
              </div>
              <div className="report-info">
                <h5 className="text-body">{report.title}</h5>
                <p className="text-caption">By: {report.doctor}</p>
                <p className="text-caption">Date: {report.date}</p>
              </div>
              <button className="view-report-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h3 className="text-heading-2">Health Analytics</h3>
        <p className="text-body-large">Track your kidney health trends and progress over time</p>
      </div>

      {/* Timeframe Filter */}
      <div className="timeframe-filter">
        <button className="filter-btn active">3 Months</button>
        <button className="filter-btn">6 Months</button>
        <button className="filter-btn">1 Year</button>
        <button className="filter-btn">All Time</button>
      </div>

      <div className="medical-history">Your GFR has shown consistent improvement over the past 3 months, indicating better kidney function.</div>

      {/* GFR Trend Chart */}
      <div className="chart-section">
        <div className="card">
          <div className="card-header">
            <h4 className="text-heading-3">GFR Trend Over Time</h4>
            <span className="text-caption">(mL/min/1.73m²)</span>
          </div>
          <div className="chart-container">
            <div className="enhanced-chart">
              <div className="chart-bars">
                <div className="chart-bar improving" style={{height: '68%'}}>
                  <span className="bar-value text-body">68</span>
                  <span className="bar-date text-caption">Jun</span>
                </div>
                <div className="chart-bar improving" style={{height: '72%'}}>
                  <span className="bar-value text-body">72</span>
                  <span className="bar-date text-caption">Jul</span>
                </div>
                <div className="chart-bar improving" style={{height: '75%'}}>
                  <span className="bar-value text-body">75</span>
                  <span className="bar-date text-caption">Aug</span>
                </div>
              </div>
              <div className="chart-trend-line"></div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color improving"></span>
                  <span className="text-caption">Improving Trend</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h4 className="text-heading-3">Trend Analysis</h4>
          <div className="trend-indicator improving">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            <span>Improving Trend</span>
          </div>
          <p className="text-body">Your GFR has shown consistent improvement over the past 3 months, indicating better kidney function.</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <h2 className="text-heading-1">Welcome, {user?.name || 'Patient'}</h2>
        <p className="text-body-large">Your personal health hub. Track your progress, manage appointments, and view reports from your care team.</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </button>
        <button 
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          Upload Documents
        </button>
        <button 
          className={activeTab === 'appointments' ? 'active' : ''}
          onClick={() => setActiveTab('appointments')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Appointments
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          Reports
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
          </svg>
          Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
    </>
  )
}

export default PatientDashboard;