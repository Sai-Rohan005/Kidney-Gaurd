import { useState } from 'react'
import './App.css'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'
import Header from './components/Header'
import MyProfile from './components/MyProfile'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PatientForm from './components/PatientForm'
import PatientDashboard from './components/PatientDashboard'
import DoctorDashboard from './components/DoctorDashboard'
import { NotificationProvider } from './contexts/NotificationContext'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './components/Login'
import "../src/components/DoctorDashboard.css"
import "../src/components/PatientDashboard.css"
import "../src/components/PatientForm.css"
import "../src/components/Sidebar.css"
import "../src/components/MyProfile.css"
import "../src/components/Login.css"
import "../src/components/layout.css"
import "../src/components/Header.css"
import "../src/components/LandingPage.css"
import "../src/components/Auth.css"
import "../src/components/Analytics.css"
import Layout from './components/layout'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


function App() {

  return (
    <NotificationProvider>
    
             {/* <Header> */}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              {/* <Route path="/login" element={<Login />} /> */}
              <Route path="/login" element={<Auth />} />
              {/* <Route path="/dashboard" element={<Dashboard />} /> */}
              <Route path='/layout' element={<Layout/>}/>
              <Route path="/patient-form" element={<PatientForm />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            </Routes>
    
              {/* </Header> */}
    
    </NotificationProvider>
   
  )
}

export default App