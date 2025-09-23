import React from 'react'
import './Dashboard.css'

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Patients',
      value: '1,247',
      change: '+12%',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      title: 'Critical Cases',
      value: '23',
      change: '-8%',
      trend: 'down',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )
    },
    {
      title: 'Recovery Rate',
      value: '87.5%',
      change: '+5.2%',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
        </svg>
      )
    },
    {
      title: 'Appointments',
      value: '156',
      change: '+23%',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    }
  ]

  const recentPatients = [
    {
      id: 1,
      name: 'John Smith',
      age: 45,
      condition: 'Chronic Kidney Disease',
      status: 'stable',
      lastVisit: '2024-08-18'
    },
    {
      id: 2,
      name: 'Maria Garcia',
      age: 62,
      condition: 'Kidney Stones',
      status: 'critical',
      lastVisit: '2024-08-19'
    },
    {
      id: 3,
      name: 'David Johnson',
      age: 38,
      condition: 'Acute Kidney Injury',
      status: 'improving',
      lastVisit: '2024-08-17'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      age: 55,
      condition: 'Polycystic Kidney Disease',
      status: 'stable',
      lastVisit: '2024-08-16'
    }
  ]

  const upcomingAppointments = [
    {
      id: 1,
      patient: 'Robert Brown',
      time: '09:00 AM',
      type: 'Follow-up',
      date: 'Today'
    },
    {
      id: 2,
      patient: 'Lisa Anderson',
      time: '10:30 AM',
      type: 'Consultation',
      date: 'Today'
    },
    {
      id: 3,
      patient: 'Michael Davis',
      time: '02:00 PM',
      type: 'Check-up',
      date: 'Tomorrow'
    }
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <button className="back-to-home-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>
        <h1>Dashboard</h1>
        <p>Welcome back, Dr. Johnson. Here's what's happening with your patients today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
              <span className={`stat-change ${stat.trend}`}>
                {stat.change} from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Patients</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="patients-list">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="patient-item">
                <div className="patient-info">
                  <h4>{patient.name}</h4>
                  <p>{patient.condition}</p>
                  <span className="patient-age">Age: {patient.age}</span>
                </div>
                <div className="patient-status">
                  <span className={`status-badge ${patient.status}`}>
                    {patient.status}
                  </span>
                  <span className="last-visit">
                    Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Appointments</h2>
            <button className="view-all-btn">View Calendar</button>
          </div>
          <div className="appointments-list">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-time">
                  <span className="time">{appointment.time}</span>
                  <span className="date">{appointment.date}</span>
                </div>
                <div className="appointment-details">
                  <h4>{appointment.patient}</h4>
                  <p>{appointment.type}</p>
                </div>
                <button className="appointment-action">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,11 12,14 22,4"></polyline>
                    <path d="M21,12v7a2,2 0,0 1,-2,2H5a2,2 0,0 1,-2,-2V5a2,2 0,0 1,2,-2h11"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h2>Patient Recovery Trends</h2>
            <select className="time-filter">
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              <div className="bar" style={{height: '60%'}}></div>
              <div className="bar" style={{height: '80%'}}></div>
              <div className="bar" style={{height: '45%'}}></div>
              <div className="bar" style={{height: '90%'}}></div>
              <div className="bar" style={{height: '70%'}}></div>
              <div className="bar" style={{height: '85%'}}></div>
              <div className="bar" style={{height: '95%'}}></div>
            </div>
            <p className="chart-label">Recovery rate improving by 12% this month</p>
          </div>
        </div>

        <div className="dashboard-card alerts-card">
          <div className="card-header">
            <h2>Critical Alerts</h2>
            <span className="alert-count">3 new</span>
          </div>
          <div className="alerts-list">
            <div className="alert-item high">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div className="alert-content">
                <h4>High Creatinine Level</h4>
                <p>Patient: Maria Garcia - Requires immediate attention</p>
                <span className="alert-time">5 minutes ago</span>
              </div>
            </div>
            <div className="alert-item medium">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="alert-content">
                <h4>Missed Appointment</h4>
                <p>Patient: John Smith - Follow-up required</p>
                <span className="alert-time">2 hours ago</span>
              </div>
            </div>
            <div className="alert-item low">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <div className="alert-content">
                <h4>Lab Results Ready</h4>
                <p>Patient: David Johnson - Review required</p>
                <span className="alert-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
