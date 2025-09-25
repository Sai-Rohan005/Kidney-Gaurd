import React, { useEffect, useState } from 'react'
import './Auth.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Auth = () => {
  const navigate=useNavigate();
  const [isSignup, setIsSignup] = useState(false)
  const [onBack, setOnBack] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    signup: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (e) => {
    const { name, value} = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  function base64urlToBuffer(base64urlString) {
    const padding = '='.repeat((4 - (base64urlString.length % 4)) % 4);
    const base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const str = atob(base64);
    const buffer = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      buffer[i] = str.charCodeAt(i);
    }
    return buffer;
  }
  
  function bufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (const charCode of bytes) {
      str += String.fromCharCode(charCode);
    }
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
 

  const validateForm = () => {
    if (isSignup) {
      if (!formData.name.trim()) {
        setError('Name is required')
        return false
      }
      if (!formData.phone.trim()) {
        setError('Phone number is required')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        return false
      }
    }
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setError('')
    setSuccess('')

   
      // Simulate API call
      
      if (isSignup) {
        const newUserData = {
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          dob: formData.dob,
        };

        try{
          const response = await axios.post("http://localhost:5500/register", newUserData);
          setSuccess('Account created successfully! Please log in.');
          setError('');
          setIsLoading(false);
          setIsSignup(false);
          
        }catch(e){
          console.log(e);
        }
      }
      
      else {
        const user={
          email: formData.email,
          password: formData.password,
        };
        try {
          const existingUser = await axios.post("http://localhost:5500/login", user, { withCredentials: true });
        
          if (existingUser.data.status === 404) {
            setError("User Not Found");
            setIsLoading(false);
          } else if (existingUser.data.status === 401) {
            setError("Invalid Password");
            setIsLoading(false);
          } else {
            setSuccess('Login successful!');
            setError('');
            setIsLoading(false);
            // if(existingUser.data.role==="Doctor"){
            //   navigate('/doctor-dashboard');
            // }else if(existingUser.data.role==="Patient"){
            //   navigate('/patient-dashboard');
            // }else{
            //   navigate('/admin-dashboard');
            // }
            navigate('/layout')
            setOnBack(false);

          }
        } catch (err) {
          console.log(err);
        }
        
        
      }
    } 
  

  const toggleMode = () => {
    setIsSignup(!isSignup)
    setError('')
    setSuccess('')
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      signup: false,
    })
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="background-overlay"></div>
      </div>
      {onBack && !isSignup && (
        <button 
          type="button" 
          className="back-to-home-corner"
          onClick={() => {navigate('/') ; setOnBack(false);}}
          disabled={isLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9,22 9,12 15,12 15,22"></polyline>
          </svg>
          Back to Home
        </button>
      )}
      {isSignup && (
        <button 
          type="button" 
          className="back-to-login-corner"
          onClick={toggleMode}
          disabled={isLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          Back to Login
        </button>
      )}
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#2563eb"/>
                <path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white"/>
                <circle cx="16" cy="16" r="3" fill="white"/>
              </svg>
            </div>
            <h1>KidneyGuard</h1>
            <p>Medical Application Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                {success}
              </div>
            )}

            {isSignup && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Smith"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="doctor@kidneyguard.com"
                required
                disabled={isLoading}
              />
            </div>

            {isSignup && (
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  required
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {isSignup && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
              </div>
            )}
            {isSignup && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Date of Birth</label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  // placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {/* {!isSignup && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>
            )} */}

            <button 
              type="submit" 
              className={`auth-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  {isSignup ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                isSignup ? 'Create Account' : 'Sign In'
              )}
            </button>

            {!isSignup ? (
              <div className="signup-link">
                <p>Don't have an account? 
                  <button 
                    type="button" 
                    className="link-button"
                    onClick={toggleMode}
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            ): (
              <div className="signin-link">
                <p>Already have an account? 
                  <button 
                    type="button" 
                    className="link-button"
                    onClick={toggleMode}
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            )}
          </form>

          <div className="auth-footer">
          </div>
        </div>

        <div className="auth-info">
          <h2>Advanced Kidney Care Management</h2>
          <div className="features">
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span>Real-time Patient Monitoring</span>
            </div>
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Appointment Management</span>
            </div>
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Comprehensive Reports</span>
            </div>
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Critical Alerts System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth
