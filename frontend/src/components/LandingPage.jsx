import React from 'react'
import './LandingPage.css'
import { useNavigate } from 'react-router-dom'

const LandingPage = ({ onGetStarted }) => {
  const navigate = useNavigate();
  return (
    <div className="landing-container">
      <div className="landing-background">
        <div className="background-overlay"></div>
      </div>
      
      <div className="landing-content">
        <div className="hero-section">
          <div className="logo-section">
            <div className="logo">
              <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#2563eb"/>
                <path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white"/>
                <circle cx="16" cy="16" r="3" fill="white"/>
              </svg>
            </div>
            <h1>KidneyGuard</h1>
          </div>

          <div className="hero-text">
            <h2>Understanding Chronic Kidney Disease (CKD)</h2>
            <p className="hero-subtitle">
              Early detection and proper management can significantly improve outcomes for kidney health
            </p>
          </div>
        </div>

        <div className="info-section">
          <div className="ckd-info">
            <div className="info-card">
              <div className="info-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h3>What is CKD?</h3>
              <p>
                Chronic Kidney Disease is a condition where kidneys gradually lose function over time. 
                It affects millions worldwide and often goes undetected until advanced stages.
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h3>Early Warning Signs</h3>
              <ul>
                <li>Fatigue and weakness</li>
                <li>Swelling in legs, ankles, or feet</li>
                <li>Changes in urination patterns</li>
                <li>High blood pressure</li>
                <li>Nausea and loss of appetite</li>
              </ul>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <h3>How We Help</h3>
              <p>
                KidneyGuard provides comprehensive monitoring, expert consultations, 
                and personalized care plans to help manage your kidney health effectively.
              </p>
            </div>
          </div>

        </div>

        <div className="cta-section">
          <h3>Take Control of Your Kidney Health Today</h3>
          <p>
            Join thousands of patients and healthcare providers using KidneyGuard 
            for better kidney care management and monitoring.
          </p>
          
          <div className="cta-buttons">
            <button className="cta-primary" onClick={()=>navigate('/login')}>
              Let's Go
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12,5 19,12 12,19"></polyline>
              </svg>
            </button>
          </div>

          <div className="features-preview">
            <div className="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4m-4 0V9a2 2 0 0 1 4 0v2m-6 0h6"></path>
              </svg>
              <span>Secure Patient Portal</span>
            </div>
            <div className="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Easy Appointment Booking</span>
            </div>
            <div className="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Digital Health Records</span>
            </div>
            <div className="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="m22 21-3-3m0 0a5.5 5.5 0 1 1-7.8-7.8 5.5 5.5 0 0 1 7.8 7.8Z"></path>
              </svg>
              <span>Expert Medical Consultations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
