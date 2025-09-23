import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import axios from 'axios';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [dashboard, setDashboard] = useState('doctor-dashboard'); // role-level dashboard
  const [activeSection, setActiveSection] = useState('dashboard'); // tab/section inside dashboard
  const [userRole, setUserRole] = useState('Patient');
  const [isMobile,setIsMobile]=useState(window.innerWidth <= 768);
  useEffect(()=>{
    setIsMobile(window.innerWidth <= 768);
  },[])

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user_role = await axios.get("http://localhost:5500/getRole", {
          withCredentials: true,
        });
        if (user_role.data.role === 'Doctor') {
          setUserRole("Doctor");
          setDashboard("doctor-dashboard");
        } else if (user_role.data.role === "Patient") {
          setUserRole("Patient");
          setDashboard("patient-dashboard");
        } else {
          setUserRole("Admin");
          setDashboard("admin-dashboard");
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchUserRole();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const renderContent = () => {
    if (dashboard === 'doctor-dashboard') {
      return <DoctorDashboard activeView={activeSection} />;
    }
    if (dashboard === 'patient-dashboard') {
      return <PatientDashboard activeView={activeSection} />;
    }
    return <div>Select a section</div>;
  };

  return (
    <div className={`layout ${(isSidebarOpen && !isMobile) ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Header onToggleSidebar={toggleSidebar} />
      <div className="main-wrapper">
        <Sidebar
          isOpen={isSidebarOpen}
          activeView={activeSection}
          setActiveView={setActiveSection}
          userRole={userRole}
        />
        <main className="content">{renderContent()}</main>
      </div>
    </div>



  );
};

export default Layout;
