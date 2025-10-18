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
  const [clickedviewreport,setClickedviewreport]=useState(false);
  const [pendingDocuments, setPendingDocuments] = useState([])
  const [appointments, setAppointments] = useState([])
  const [completedReports, setCompletedReports] = useState([])
  const [opened_report,setopened_report]=useState({});
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [allreports,setallreports]=useState(null);
  // const [opened_report,setopened_report]=useState({});
  const [patient,setpatient]=useState(null);
  const [allpatient,setallpatient]=useState([]);
  const [isclinical,setisclinical]=useState(false);
  const [prediction, setPrediction] = useState("-");
  const [probability, setProbability] = useState(0);
  const [loading, setLoading] = useState(false);
  const [display_single_report,setdisplay_single_report]=useState(null);

  const [show_single_report,setshow_single_report]=useState(false)
  const [isresult,setisresult]=useState(false);
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

  useEffect(()=>{
    const getallreports=async()=>{
      const repo=await axios.get("http://localhost:5500/getallreports",{
        withCredentials:true
      });
      console.log(repo)
      if(repo.data.reports){
        setallreports(repo.data.reports);
        setallpatient(repo.data.patient);
        setisresult(true);
      }else{
        setallreports([]);
        setallpatient([]);
      }
    }
    getallreports();
  },[])

  // Handlers
  const handleDocumentReview = async(document) => {
    try{
        document.status="Pending";
       const updatestatus=await axios.post("http://localhost:5500/updatedoctorappointmentstatus",document,{
        withCredentials:true
       });

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

  const handlemainitems=async(doc)=>{
    try{
      const getallmain=await axios.post("http://localhost:5500/getpatientmaindocument",doc,{
        withCredentials:true
      });
      setSelectedDocument(getallmain.data.main);
    }catch(err){
      console.log(err);
    }
  }

 const handlepredict = async (sdoc) => {
  setLoading(true)
  try {
    const pred = await axios.post(
      "http://localhost:5500/predictckd",
      { pmail: sdoc },   
      { withCredentials: true }       
    );
    if(pred.data.prediction){
      setPrediction(pred.data.prediction)
      setisresult(true);
    }
    if(pred.data.probabilities){
      setProbability(pred.data.probabilities)
      setisresult(true);
    }
  } catch (err) {
    console.log("Prediction error:", err);
  }
  finally{
    setLoading(false);
  }
};

const setreports=(report)=>{
  // console.log("Clicked report:", report);
  const matchedPatient = Array.isArray(allpatient)
  ? allpatient.find((r) => r.email === report.patientEmail)
  : null;
  // console.log("Matched patient:", matchedPatient);
  const matchedreport = Array.isArray(allreports)
  ? allreports.find((r) => r.patientEmail === report.patientEmail)
  : null;
  setClickedviewreport(true);
  setopened_report(matchedreport);
  setpatient(matchedPatient);
  console.log("All reports array:", allreports);
  console.log("All patients array:", matchedreport);
}


const displayreults=(doc)=>{
  console.log(doc)
  const matchedreport = Array.isArray(allreports)
  ? allreports.find((r) => r.patientEmail === doc.email)
  : null;
  console.log("view report",matchedreport)
  setshow_single_report(true)
  setdisplay_single_report(matchedreport);

}

  
  

  // ---- Tabs ----
  const renderPendingTab = () => (
    <div className="pending-section">
      <div className="section-header">
        <h3 className="text-heading-2">Pending Document Reviews</h3>
        <p className="text-body-large">Prioritize patient reviews and provide comprehensive medical reports</p>
      </div>
      {show_single_report && 
        <>
        <div key={`1`}  className="ckd-report">
          <div className="wrap">
          <div className="card" style={{ position: "relative" }}>
            <button className="close-btn" aria-label="Close" onClick={()=>setshow_single_report(false)}>
              ×
            </button>
    
            <h1 className="title">Chronic Kidney Disease (CKD) Report</h1>
            <p className="subtitle">
              Confidential medical document • Generated:{" "}
              {/* <span>{opened_report.date}</span> */}
            </p>
    
            <div className="grid mb">
              <div className="section">
                <h3>Patient Information</h3>
                <div className="row">
                  <div className="label">Name</div>
                  <div className="value">{display_single_report?.name ?? "Unknown Patient"}</div>
                </div>
                <div className="row">
                  <div className="label">Age / Sex</div>
                  <div className="value">{display_single_report?.age ?? 24}</div>
                </div>
                <div className="row">
                  <div className="label">Patient ID</div>
                  <div className="value">{display_single_report?.id ?? "id"}</div>
                </div>
                <div className="row">
                  <div className="label">Date of Birth</div>
                  <div className="value">{display_single_report?.dob ?? "dob"}</div>
                </div>
               
              </div>
    
              <div className="section">
                <h3>Summary</h3>
                <div className="row">
                  <div className="label">CKD Stage (Target_Label)</div>
                  <div className="value">
                    <span>{display_single_report.predict}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Serum creatinine (mg/dl)</div>
                  <div className="value">
                    <span>{display_single_report['Serum creatinine (mg/dl)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Blood urea (mg/dl)</div>
                  <div className="value">
                    <span>{display_single_report['Blood urea (mg/dl)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Hemoglobin level (gms)</div>
                  <div className="value">
                    <span>{display_single_report['Hemoglobin level (gms)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Blood pressure (mm/Hg)</div>
                  <div className="value">
                    <span>{display_single_report['Blood pressure (mm/Hg)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Albumin in urine</div>
                  <div className="value">
                    <span>{display_single_report['Albumin in urine']}</span>
                  </div>
                </div>
              </div>
            </div>
    
            <div className="section mb">
              <h3>Laboratory Results</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Reference Range</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Serum creatinine (mg/dl)</td>
                    <td>{display_single_report['Serum creatinine (mg/dl)']}</td>
                    <td>0.6 – 1.3 mg/dl</td>
                    <td>
                      <span className={display_single_report['Serum creatinine (mg/dl)'] >= 0.6 && display_single_report['Serum creatinine (mg/dl)']<=1.3 ? "badge ok":"badge warn"}>{display_single_report['Serum creatinine (mg/dl)'] >= 0.6 && display_single_report['Serum creatinine (mg/dl)']<=1.3 ? "Normal":"Abnormal"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Blood urea (mg/dl)</td>
                    <td>{display_single_report['Blood urea (mg/dl)']}</td>
                    <td>10 – 40 mg/dl</td>
                    <td>
                      <span className={display_single_report['Blood urea (mg/dl)'] >= 10 && display_single_report['Blood urea (mg/dl)']<=40 ? "badge ok":"badge warn"}>{display_single_report['Blood urea (mg/dl)'] >= 10 && display_single_report['Blood urea (mg/dl)']<=40 ? "Normal":"Abnormal"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Hemoglobin level (gms)</td>
                    <td>{display_single_report['Hemoglobin level (gms)']}</td>
                    <td>12 – 16 g/dl (typical adult)</td>
                    <td>
                      <span className={display_single_report['Hemoglobin level (gms)'] >= 12 && display_single_report['Hemoglobin level (gms)']<=16 ? "badge ok": "badge warn"}>{display_single_report['Hemoglobin level (gms)'] >= 12 && display_single_report['Hemoglobin level (gms)']<=16 ? "Normal":"Abnormal"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Blood pressure (mm/Hg)</td>
                    <td>{display_single_report['Blood pressure (mm/Hg)']}</td>
                    <td>90 – 130 mm/Hg</td>
                    <td>
                      <span className={display_single_report['Blood pressure (mm/Hg)'] >= 90 && display_single_report['Blood pressure (mm/Hg)']<=130 ? "badge ok": "badge warn"}>{display_single_report['Blood pressure (mm/Hg)'] >= 90 && display_single_report['Blood pressure (mm/Hg)']<=130 ? "Normal":"Abnormal"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Albumin in urine</td>
                    <td>{display_single_report['Albumin in urine']}</td>
                    <td>0 (negative)</td>
                    <td>
                      <span className={display_single_report['Albumin in urine'] >= 90 && display_single_report['Albumin in urine']<=130 ? "badge ok" : "badge warn"}>{display_single_report['Albumin in urine'] >= 90 && display_single_report['Albumin in urine']<=130 ? "Normal":"Abnormal"}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
    
            <div className="section mb">
              <h3>Stage-specific Reference Ranges</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>No_Disease</th>
                    <th>Stage_1</th>
                    <th>Stage_2</th>
                    <th>Stage_3</th>
                    <th>Stage_4</th>
                    <th>Stage_5</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Serum creatinine (mg/dl)</td>
                    <td>0.6 – 1.3</td>
                    <td>1.3 – 1.5</td>
                    <td>1.5 – 2.0</td>
                    <td>2.0 – 3.5</td>
                    <td>3.5 – 5.0</td>
                    <td>5.0 – 12.0</td>
                  </tr>
                  <tr>
                    <td>Blood urea (mg/dl)</td>
                    <td>10 – 40</td>
                    <td>30 – 60</td>
                    <td>50 – 80</td>
                    <td>80 – 120</td>
                    <td>120 – 150</td>
                    <td>150 – 300</td>
                  </tr>
                  <tr>
                    <td>Hemoglobin level (gms)</td>
                    <td>12 – 16</td>
                    <td>12 – 14</td>
                    <td>11 – 13</td>
                    <td>9 – 11</td>
                    <td>8 – 10</td>
                    <td>6 – 9</td>
                  </tr>
                  <tr>
                    <td>Blood pressure (mm/Hg)</td>
                    <td>90 – 130</td>
                    <td>130 – 140</td>
                    <td>135 – 150</td>
                    <td>145 – 160</td>
                    <td>155 – 170</td>
                    <td>170 – 200</td>
                  </tr>
                  <tr>
                    <td>Albumin in urine</td>
                    <td>0</td>
                    <td>1 – 2</td>
                    <td>2 – 3</td>
                    <td>3 – 4</td>
                    <td>4 – 5</td>
                    <td>5</td>
                  </tr>
                </tbody>
              </table>
            </div>
    
            <div className="section">
              <h3>Doctor&apos;s Notes & Recommendations</h3>
              <ul>
                <li>Monitor renal function and blood pressure; lifestyle optimization.</li>
                <li>Repeat labs as clinically indicated.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
          


        </>

        

      }

      {!show_single_report && selectedDocument ? (
        <div className="image-viewer">
          <span className='d-flex justify-content-between'>
            <button className='btn btn-primary' onClick={()=>{setSelectedDocument(null)}}>back</button>
            {isresult && (
              <button className='btn btn-success ' onClick={()=>{displayreults(selectedDocument)}}>View Result</button>
            )}
            <button className='btn btn-outline-primary'>Message</button>

          </span>
          

            <div className="card">
              <aside className="Thumbnails-sidebar" aria-label="Thumbnails sidebar">
              <div className="Thumbnails-sidebar-header">Images</div>
              <div id="thumbs" className="thumbs" role="list">
              {selectedDocument.ultrasound_data && selectedDocument.ultrasound_data.length > 0 ? (
                selectedDocument.ultrasound_data.map((imgSrc, index) => (
                  <>
                  <div key={selectedDocument.patientEmail+selectedDocument.ultrasound_data.length} className="thumb" role="listitem">
                  <img
                  src={imgSrc}
                  alt={`Thumbnail ${index + 1}`}
                  style={{
                    height: "var(--thumb-size)",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                  onClick={() => {
                    setisclinical(false);
                    document.getElementById("mainImage").src = imgSrc;
                    document.getElementById("mainImage").hidden = false;
                    document.getElementById("viewerTitle").textContent = `Image ${index + 1} of ${selectedDocument.ultrasound_data.length}`;
                    document.getElementById("viewerMeta").textContent = selectedDocument.patientEmail;
                    document.getElementById("viewerFooter").textContent = selectedDocument.description || "No description available";
                  }}
                  />
                  </div>
                  </>
                ))
              ) : (
                <p style={{ padding: "10px", color: "var(--muted)" }}>No images available</p>
              )}
              
              <button className="btn btn-primary" onClick={()=>{setisclinical(true)}}>Clinical Data</button>
              
              {/* <button className="fixed-btn bg-success text-white" onClick={()=>handlepredict(selectedDocument)}>
                Results
                </button> */}
                
                <div style={{ position: "fixed", bottom: "16px", left: "0", right: "0", zIndex: 9999 }}>
                <div className="d-flex align-items-center justify-content-between px-3">
                
                {/* Left empty space */}
                <div></div>
                
                {/* Centered Boxes */}
                <div className="d-flex gap-2 justify-content-center" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
                {prediction && (
                  <div className="p-2 border rounded bg-light text-center" style={{ minWidth: "120px" }}>
                  <div className="small text-muted">Predicted Class</div>
                  <div className="fw-bold">{prediction}</div>
                  </div>
                )}
                
                {probability !== undefined && (
                  <div className="p-2 border rounded bg-light text-center" style={{ minWidth: "120px" }}>
                  <div className="small text-muted">Probability</div>
                  <div className="fw-bold">{(probability * 100).toFixed(2)}%</div>
                  </div>
                )}
                </div>
                
                {/* Results Button on the right */}
                <button
                className="btn btn-success"
                onClick={() => handlepredict(selectedDocument)}
                disabled={loading}
                
                >
                Results
                </button>
                </div>
                </div>
                
                
                
                
                
                </div>
              </aside>
              <main className="viewer"  aria-live="polite">
              {isclinical ?(
                <>
                <div className="viewer-header">
                <div className="viewer-title" id="viewerTitle">
                Clinical Data
                </div>
                <div
                className="viewer-meta"
                id="viewerMeta"
                style={{ color: "var(--muted)", fontSize: "12px" }}
                >
                {selectedDocument.patientEmail}
                </div>
                </div>
                <div className="viewer-main" style={{ padding: "20px", overflowY: "auto" }}>
                <table className="table">
                <thead>
                <tr>
                <th>Metric</th>
                <th>Value</th>
                </tr>
                </thead>
                <tbody>
                {Object.entries(selectedDocument.clinical_data || {}).map(([key, value]) => (
                  <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                    </tbody>
                    
                    </table>
                    </div>
                    <div className="viewer-footer" id="viewerFooter">
                    {selectedDocument.description || "No description available"}
                    </div>
                    </>
                  ):(
                    <>
                    <div className="viewer-header">
                    <div className="viewer-title" id="viewerTitle">
                    Select an image
                    </div>
                    <div
                    className="viewer-meta"
                    id="viewerMeta"
                    style={{ color: "var(--muted)", fontSize: "12px" }}
                    >
                    —
                    </div>
                    </div>
                    <div className="viewer-main">
                    <img id="mainImage" alt="Selected preview" src="" hidden />
                    </div>
                    <div className="viewer-footer" id="viewerFooter">
                    No image selected
                    </div>
                    </>
                  )}
                  </main>
              </div>
                  </div>
                ) : (
                  <div className="documents-grid">
                  {!show_single_report && pendingDocuments.map(doc => (
                    <div key={`${doc.patientEmail}-${doc.date}-${doc.time}`} className="document-card card card-hover">
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
                onClick={() => handlemainitems(doc)}
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
          <div key={`${apt.patientEmail}-${apt.date}-${apt.time}`} className="appointment-card card card-hover">
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
      <div className="section-header">
        <h3 className="text-heading-2">Completed Reports</h3>
        <p className="text-body-large">Access and review all medical reports you have completed for your patients</p>
      </div>
      {clickedviewreport===true ? (
        // <div key={`${report?.patientEmail}-${report?.date || report?.id}`}  className="ckd-report">
        <div key={`1`}  className="ckd-report">
          <div className="wrap">
          <div className="card" style={{ position: "relative" }}>
            <button className="close-btn" aria-label="Close" onClick={()=>setClickedviewreport(false)}>
              ×
            </button>
    
            <h1 className="title">Chronic Kidney Disease (CKD) Report</h1>
            <p className="subtitle">
              Confidential medical document • Generated:{" "}
              {/* <span>{opened_report.date}</span> */}
            </p>
    
            <div className="grid mb">
              <div className="section">
                <h3>Patient Information</h3>
                <div className="row">
                  <div className="label">Name</div>
                  <div className="value">{patient?.name ?? "Unknown Patient"}</div>
                </div>
                <div className="row">
                  <div className="label">Age / Sex</div>
                  <div className="value">24</div>
                </div>
                <div className="row">
                  <div className="label">Patient ID</div>
                  <div className="value">{patient?._id ?? "id"}</div>
                </div>
                <div className="row">
                  <div className="label">Date of Birth</div>
                  <div className="value">{patient?.dob ?? "dob"}</div>
                </div>
               
              </div>
    
              <div className="section">
                <h3>Summary</h3>
                <div className="row">
                  <div className="label">CKD Stage (Target_Label)</div>
                  <div className="value">
                    <span>{opened_report.predict}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Serum creatinine (mg/dl)</div>
                  <div className="value">
                    <span>{opened_report['Serum creatinine (mg/dl)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Blood urea (mg/dl)</div>
                  <div className="value">
                    <span>{opened_report['Blood urea (mg/dl)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Hemoglobin level (gms)</div>
                  <div className="value">
                    <span>{opened_report['Hemoglobin level (gms)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Blood pressure (mm/Hg)</div>
                  <div className="value">
                    <span>{opened_report['Blood pressure (mm/Hg)']}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="label">Albumin in urine</div>
                  <div className="value">
                    <span>{opened_report['Albumin in urine']}</span>
                  </div>
                </div>
              </div>
            </div>
    
            <div className="section mb">
              <h3>Laboratory Results</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Reference Range</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Serum creatinine (mg/dl)</td>
                    <td>{opened_report['Serum creatinine (mg/dl)']}</td>
                    <td>0.6 – 1.3 mg/dl</td>
                    <td>
                      <span className="badge warn">Abnormal</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Blood urea (mg/dl)</td>
                    <td>{opened_report['Blood urea (mg/dl)']}</td>
                    <td>10 – 40 mg/dl</td>
                    <td>
                      <span className="badge warn">Abnormal</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Hemoglobin level (gms)</td>
                    <td>{opened_report['Hemoglobin level (gms)']}</td>
                    <td>12 – 16 g/dl (typical adult)</td>
                    <td>
                      <span className="badge ok">Normal</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Blood pressure (mm/Hg)</td>
                    <td>{opened_report['Blood pressure (mm/Hg)']}</td>
                    <td>90 – 130 mm/Hg</td>
                    <td>
                      <span className="badge warn">Abnormal</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Albumin in urine</td>
                    <td>{opened_report['Albumin in urine']}</td>
                    <td>0 (negative)</td>
                    <td>
                      <span className="badge warn">Abnormal</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
    
            <div className="section mb">
              <h3>Stage-specific Reference Ranges</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>No_Disease</th>
                    <th>Stage_1</th>
                    <th>Stage_2</th>
                    <th>Stage_3</th>
                    <th>Stage_4</th>
                    <th>Stage_5</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Serum creatinine (mg/dl)</td>
                    <td>0.6 – 1.3</td>
                    <td>1.3 – 1.5</td>
                    <td>1.5 – 2.0</td>
                    <td>2.0 – 3.5</td>
                    <td>3.5 – 5.0</td>
                    <td>5.0 – 12.0</td>
                  </tr>
                  <tr>
                    <td>Blood urea (mg/dl)</td>
                    <td>10 – 40</td>
                    <td>30 – 60</td>
                    <td>50 – 80</td>
                    <td>80 – 120</td>
                    <td>120 – 150</td>
                    <td>150 – 300</td>
                  </tr>
                  <tr>
                    <td>Hemoglobin level (gms)</td>
                    <td>12 – 16</td>
                    <td>12 – 14</td>
                    <td>11 – 13</td>
                    <td>9 – 11</td>
                    <td>8 – 10</td>
                    <td>6 – 9</td>
                  </tr>
                  <tr>
                    <td>Blood pressure (mm/Hg)</td>
                    <td>90 – 130</td>
                    <td>130 – 140</td>
                    <td>135 – 150</td>
                    <td>145 – 160</td>
                    <td>155 – 170</td>
                    <td>170 – 200</td>
                  </tr>
                  <tr>
                    <td>Albumin in urine</td>
                    <td>0</td>
                    <td>1 – 2</td>
                    <td>2 – 3</td>
                    <td>3 – 4</td>
                    <td>4 – 5</td>
                    <td>5</td>
                  </tr>
                </tbody>
              </table>
            </div>
    
            <div className="section">
              <h3>Doctor&apos;s Notes & Recommendations</h3>
              <ul>
                <li>Monitor renal function and blood pressure; lifestyle optimization.</li>
                <li>Repeat labs as clinically indicated.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      ):(

      <div className="reports-grid">
        {completedReports.map(report => (
          <div key={report._id} className="report-card card card-hover">
            <div className="report-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div className="report-content">
              <div className="report-header">
                <h5 className="text-body">{report.reportTitle}</h5>
              </div>
              <div className="report-details">
                <div className="detail-item">
                  <span className="text-label">Patient:</span>
                  <span className="text-body">{report.patientEmail}</span><br />
                <span className="completion-date text-caption">Appointed on: {new Date(report.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="text-label">Mentioned Problem:</span>
                  <span className="text-body">{report.problem}</span>
                </div>
                <div className="detail-item">
                  <span className="text-label">Diagnosis:</span>
                  <span className="text-body">{report.diagnosis}</span>
                </div>
                <div className="detail-item">
                  <span className="text-label">Recommendations:</span>
                  <span className="text-body">{report.recommendations}</span>
                </div>
              </div>
              <button
                className="view-full-report-btn"
                onClick={() => {
                  setreports(report)
                }}
              >
                View Full Report
              </button>

            </div>
          </div>
        ))}

        {completedReports.length === 0 && (
          <div className="no-reports">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
            <h4>No Completed Reports</h4>
            <p>Reports you complete will appear here</p>
          </div>
        )}
      </div>
      )}
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
