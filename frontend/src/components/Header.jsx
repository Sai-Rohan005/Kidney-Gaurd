import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount(user?.email);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Fetch user info
  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await axios.get('http://localhost:5500/getuser', {
          withCredentials: true
        });
        if (userData.data) setUser(userData.data.user);
      } catch (err) {
        console.log(err);
      }
    };
    getUser();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => setShowProfileDropdown(!showProfileDropdown);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5500/logout', {}, { withCredentials: true });
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* Use onToggleSidebar from props */}
        {!isMobile && (
          <button className="menu-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )
        
        }
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2563eb"/>
            <path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white"/>
            <circle cx="16" cy="16" r="3" fill="white"/>
          </svg>
          <span className="logo-text">KidneyGuard</span>
        </div>
      </div>

      <div className="header-center">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" placeholder="Search patients, reports..." className="search-input" />
        </div>
      </div>

      <div className="header-right">
        <button className="notification-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>

        <div className="profile-dropdown" ref={dropdownRef}>
          <button className="user-profile" onClick={handleProfileClick}>
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=face"} 
              alt={user?.name || "User"} 
              className="profile-avatar"
            />
            <div className="profile-info">
              <span className="profile-name">{user?.name }</span>
              <span className="profile-role">{user?.role }</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`dropdown-arrow ${showProfileDropdown ? 'rotated' : ''}`}>
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header">
                {/* <img src={user?.avatar} alt={user?.name} className="dropdown-avatar" /> */}
                <div className="dropdown-user-info">
                  <span className="p-2 dropdown-name">{user?.name}</span>
                  <span className="p-2 dropdown-id">{user?.role === 'Patient' ? `Patient ID: ${user?._id}` : user?.email}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-actions">
                <button className="p-2 dropdown-item" onClick={() => { navigate('/profile'); setShowProfileDropdown(false); }}>
                  My Profile
                </button>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-logout">
                <button className="p-2 dropdown-item logout-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
