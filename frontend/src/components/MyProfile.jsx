import React, { useEffect, useState } from 'react'
import './MyProfile.css'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import Header from './Header';

const MyProfile = ({ user, onBack }) => {
  const navigate=useNavigate();
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '+1 (555) 123-4567')
  const [tempPhone, setTempPhone] = useState('')
  const [message, setMessage] = useState('')
  const [details,setdetails]=useState({});
  const [role,setrole]=useState("");
  useEffect(()=>{
    async function getRole(){
        try{
          const user_role=await axios.get("http://localhost:5500/getRole",{
            withCredentials: true,
          });
          // console.log(user_role.data.role);
          if(user_role.data.role=='Doctor'){
            setrole("Doctor");
          }else if(user_role.data.role=="Patient"){
            setrole("Patient");
          }else{
            setrole("Admin");
          }
        }catch(e){
          console.log(e);
        }
    }
    const userdetails=async()=>{
      try{
        const user_details=await axios.get("http://localhost:5500/getuser",{
          withCredentials: true,
        });
        setdetails(user_details.data.user);
        // console.log(user_details.data);
      }catch(e){
        console.log(e);
      }
    }
    getRole();
    userdetails();
  },[])
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const handleEditPhone = () => {
    setTempPhone(phoneNumber)
    setIsEditingPhone(true)
    setMessage('')
  }

  const handleSavePhone = () => {
    if (tempPhone.trim()) {
      setPhoneNumber(tempPhone)
      setIsEditingPhone(false)
      setMessage('Phone number updated successfully.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleCancelPhone = () => {
    setTempPhone('')
    setIsEditingPhone(false)
    setMessage('')
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
    setPasswordError('')
    setPasswordSuccess('')
  }

  const validatePassword = (password) => {
    const minLength = password.length >= 8
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    return minLength && hasNumber && hasSpecial
  }

  const handlePasswordSubmit = async(e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.')
      return
    }

    if (!validatePassword(passwordForm.newPassword)) {
      setPasswordError('New password must be at least 8 characters with at least one number and one special character.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    try{
      const responsepassword=await axios.post("http://localhost:5500/changePassword",{
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      },{
        withCredentials: true,
      });
      if(responsepassword.data.message==="Password changed successfully'"){
        setPasswordSuccess('Your password has been changed successfully.')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }


    }catch(e){
      console.log(e);
    }

    // Simulate password update
    
  }

  const handleback=()=>{
    navigate('/layout')
  }

  return (
    <>
    {/* <Header/> */}
    
    <div className="my-profile">
      <div className="profile-header">
        <h1>
          <button className="back-button" onClick={handleback}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back
          </button>
          My Profile
        </h1>
      </div>

      {message && (
        <div className="success-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          {message}
        </div>
      )}

      <div className="profile-content">
        {/* Personal Information Section */}
        <div className="profile-section">
          <h2>Personal Information</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <span className="info-value">{details?.name || 'Sarah Wilson'}</span>
            </div>

            <div className="info-item">
              <label>Email Address</label>
              <span className="info-value">{details?.email || 's.wilson@email.com'}</span>
            </div>

            <div className="info-item">
              <label>{details?.role === 'Patient' ? 'Patient ID' : 'Doctor ID'}</label>
              <span className="info-value">{details?._id || '1353523'}</span>
            </div>

            <div className="info-item">
              <label>Phone Number</label>
              <div className="phone-container">
                {isEditingPhone ? (
                  <div className="phone-edit">
                    <input
                      type="tel"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      className="phone-input"
                      placeholder="Enter phone number"
                    />
                    <div className="phone-actions">
                      <button className="save-btn" onClick={handleSavePhone}>
                        Save
                      </button>
                      <button className="cancel-btn" onClick={handleCancelPhone}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="phone-display">
                    <span className="info-value">{phoneNumber}</span>
                    <button className="edit-btn" onClick={handleEditPhone}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Section */}
        <div className="profile-section">
          <h2>Change Password</h2>
          
          <form onSubmit={handlePasswordSubmit} className="password-form">
            {passwordError && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="success-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                {passwordSuccess}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <p className="password-requirements">
                Minimum 8 characters, with at least one number and one special character.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <button type="submit" className="update-password-btn">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}

export default MyProfile
