import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getUnreadCount = (userEmail) => {
    return notifications.filter(
      notification => 
        notification.targetUser === userEmail && 
        !notification.read
    ).length;
  };

  const getUserNotifications = (userEmail) => {
    return notifications.filter(
      notification => notification.targetUser === userEmail
    );
  };

  // Notification for when patient books appointment
  const notifyAppointmentBooked = (patientName, patientEmail, doctorEmail, appointmentDate) => {
    addNotification({
      type: 'appointment_booked',
      title: 'New Appointment Booked',
      message: `${patientName} has booked an appointment for ${appointmentDate}`,
      targetUser: doctorEmail,
      sourceUser: patientEmail,
      data: {
        patientName,
        patientEmail,
        appointmentDate
      }
    });
  };

  // Notification for when doctor completes report
  const notifyReportCompleted = (doctorName, doctorEmail, patientEmail, reportType) => {
    addNotification({
      type: 'report_completed',
      title: 'Medical Report Ready',
      message: `Dr. ${doctorName} has completed your ${reportType} report`,
      targetUser: patientEmail,
      sourceUser: doctorEmail,
      data: {
        doctorName,
        doctorEmail,
        reportType
      }
    });
  };

  // Notification for when patient uploads document
  const notifyDocumentUploaded = (patientName, patientEmail, doctorEmail, documentType) => {
    addNotification({
      type: 'document_uploaded',
      title: 'New Document Uploaded',
      message: `${patientName} has uploaded a new ${documentType}`,
      targetUser: doctorEmail,
      sourceUser: patientEmail,
      data: {
        patientName,
        patientEmail,
        documentType
      }
    });
  };

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getUnreadCount,
    getUserNotifications,
    notifyAppointmentBooked,
    notifyReportCompleted,
    notifyDocumentUploaded
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
