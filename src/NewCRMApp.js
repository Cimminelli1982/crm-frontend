import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NewNavigation from './components/NewNavigation';
import NotificationBar from './components/NotificationBar';
import SortPage from './pages/SortPage';
import InteractionsPage from './pages/InteractionsPage';
import SearchPage from './pages/SearchPage';
import KeepInTouchPage from './pages/KeepInTouchPage';
import ContactDetail from './pages/ContactDetail';
import ContactEditNew from './pages/ContactEditNew';
import CityContactsPage from './pages/CityContactsPage';
import TagContactsPage from './pages/TagContactsPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import CommandCenterPage from './pages/CommandCenterPage';
import DealSubmissionPage from './pages/DealSubmissionPage';
import NewCRMLogin from './pages/NewCRMLogin';
import AuthCallback from './pages/AuthCallback';
import { supabase } from './lib/supabaseClient';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    transition: background-color 0.3s ease, color 0.3s ease;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme === 'light' ? '#9CA3AF' : '#9CA3AF'};
  }

  /* Disable text selection on UI elements */
  button, nav, .nav-item {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ContentContainer = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;

  /* Mobile: Add bottom padding for mobile nav */
  @media (max-width: 767px) {
    padding-bottom: 40px;
  }

  /* Tablet: Add left margin for side nav */
  @media (min-width: 768px) and (max-width: 1024px) {
    margin-left: 280px !important;
  }

  /* Desktop: Add left margin for side nav */
  @media (min-width: 1025px) {
    margin-left: ${props => props.$navCollapsed ? '80px' : '320px'} !important;
    transition: margin-left 0.3s ease;
  }
`;

const PageContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  @media (max-width: 767px) {
    min-height: calc(100vh - 80px);
  }
`;

// Main App Component with Navigation and Routing Logic
const CRMAppContent = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('crm-theme') || 'light';
  });
  const [navCollapsed, setNavCollapsed] = useState(() => {
    // On desktop, default to non-collapsed for better UX
    const saved = localStorage.getItem('crm-nav-collapsed');
    return saved ? saved === 'true' : false;
  });
  const [inboxCount, setInboxCount] = useState(0);
  const [keepInTouchCount, setKeepInTouchCount] = useState(0);
  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    visible: false
  });
  const [birthdayContacts, setBirthdayContacts] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Check if current route is public (no navigation needed)
  const isPublicRoute = ['/deal-submission', '/login', '/auth/callback'].includes(location.pathname);

  // Map paths to page IDs for navigation highlighting
  const getPageIdFromPath = (pathname) => {
    if (pathname.includes('/command-center')) return 'command-center';
    if (pathname.includes('/sort')) return 'sort';
    if (pathname.includes('/interactions')) return 'interactions';
    if (pathname.includes('/search')) return 'search';
    if (pathname.includes('/keep-in-touch')) return 'keep-in-touch';
    return 'sort'; // default to sort instead of interactions
  };

  const currentPage = getPageIdFromPath(location.pathname);

  const handleNavigation = (pageId, path) => {
    navigate(path);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('crm-theme', newTheme);
  };

  const showNotification = (message, type = 'info', duration = 0) => {
    setNotification({ message, type, visible: true });
    if (duration > 0) {
      setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, duration);
    }
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  // Get today's date key for localStorage (format: YYYY-MM-DD)
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Get dismissed birthday contact IDs for today
  const getDismissedBirthdays = () => {
    const todayKey = getTodayKey();
    const stored = localStorage.getItem('crm-dismissed-birthdays');
    if (!stored) return [];
    try {
      const data = JSON.parse(stored);
      // Only return IDs if they're from today, otherwise clear old data
      if (data.date === todayKey) {
        return data.contactIds || [];
      }
      return [];
    } catch {
      return [];
    }
  };

  // Dismiss a birthday notification
  const handleDismissBirthday = (contactId) => {
    const todayKey = getTodayKey();
    const dismissed = getDismissedBirthdays();
    const newDismissed = [...dismissed, contactId];

    // Save to localStorage
    localStorage.setItem('crm-dismissed-birthdays', JSON.stringify({
      date: todayKey,
      contactIds: newDismissed
    }));

    // Update notification - filter out dismissed contact
    setNotification(prev => {
      const remainingContacts = (prev.contacts || []).filter(c => c.contact_id !== contactId);
      if (remainingContacts.length === 0) {
        return { ...prev, visible: false, contacts: [] };
      }
      return { ...prev, contacts: remainingContacts };
    });
  };

  const fetchTodayBirthdays = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const { data: birthdays, error } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, birthday')
        .not('birthday', 'is', null)
        .order('first_name');

      if (error) {
        console.error('Error fetching birthdays:', error);
        return false;
      }

      const todayBirthdays = birthdays.filter(contact => {
        const birthdayDate = new Date(contact.birthday);
        const contactMonth = birthdayDate.getMonth() + 1;
        const contactDay = birthdayDate.getDate();
        return contactMonth === month && contactDay === day;
      });

      // Filter out already dismissed birthdays
      const dismissedIds = getDismissedBirthdays();
      const filteredBirthdays = todayBirthdays.filter(
        contact => !dismissedIds.includes(contact.contact_id)
      );

      setBirthdayContacts(filteredBirthdays);

      if (filteredBirthdays.length > 0) {
        setNotification({
          message: '',
          type: 'success',
          visible: true,
          contacts: filteredBirthdays,
          notificationType: 'birthday'
        });
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, visible: false }));
        }, 8000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to fetch today birthdays:', error);
      return false;
    }
  };


  // Listen for navigation collapse changes
  useEffect(() => {
    const handleNavCollapse = (event) => {
      setNavCollapsed(event.detail.collapsed);
      localStorage.setItem('crm-nav-collapsed', event.detail.collapsed.toString());
    };

    window.addEventListener('navCollapseChange', handleNavCollapse);
    return () => window.removeEventListener('navCollapseChange', handleNavCollapse);
  }, []);


  // Fetch birthday notifications on load
  useEffect(() => {
    fetchTodayBirthdays();
  }, []);


  // Render public routes without navigation
  if (isPublicRoute) {
    return (
      <>
        <GlobalStyles theme="light" />
        <Routes>
          <Route path="/deal-submission" element={<DealSubmissionPage />} />
          <Route path="/login" element={<NewCRMLogin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </>
    );
  }

  return (
    <AppContainer theme={theme}>
      <GlobalStyles theme={theme} />

      <NewNavigation
        currentPage={currentPage}
        onNavigate={handleNavigation}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onCollapseChange={setNavCollapsed}
        initialCollapsed={navCollapsed}
        inboxCount={inboxCount}
        keepInTouchCount={keepInTouchCount}
      />

      <ContentContainer
        $navCollapsed={navCollapsed}
        style={{
          marginLeft: window.innerWidth >= 1025 ? (navCollapsed ? '80px' : '320px') :
                     window.innerWidth >= 768 ? '280px' : '0'
        }}
      >
        <NotificationBar
          message={notification.message}
          type={notification.type}
          visible={notification.visible}
          onClose={hideNotification}
          theme={theme}
          contacts={notification.contacts}
          onContactClick={(contactId) => navigate(`/contact/${contactId}`)}
          onDismissBirthday={handleDismissBirthday}
          notificationType={notification.notificationType}
        />
        <PageContainer>
          <Routes>
            <Route path="/" element={<Navigate to="/command-center" replace />} />
            <Route path="/command-center" element={<ProtectedRoute><CommandCenterPage theme={theme} /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage theme={theme} /></ProtectedRoute>} />
            <Route path="/sort" element={<ProtectedRoute><SortPage theme={theme} onInboxCountChange={setInboxCount} /></ProtectedRoute>} />
            <Route path="/interactions" element={<ProtectedRoute><InteractionsPage theme={theme} /></ProtectedRoute>} />
            <Route path="/keep-in-touch" element={<ProtectedRoute><KeepInTouchPage theme={theme} onKeepInTouchCountChange={setKeepInTouchCount} /></ProtectedRoute>} />
            <Route path="/contact/:contactId" element={<ProtectedRoute><ContactDetail theme={theme} /></ProtectedRoute>} />
            <Route path="/contact/:contactId/edit" element={<ProtectedRoute><ContactEditNew theme={theme} /></ProtectedRoute>} />
            <Route path="/city/:cityId/contacts" element={<ProtectedRoute><CityContactsPage theme={theme} /></ProtectedRoute>} />
            <Route path="/tag/:tagId/contacts" element={<ProtectedRoute><TagContactsPage theme={theme} /></ProtectedRoute>} />
            <Route path="/company/:companyId" element={<ProtectedRoute><CompanyDetailPage theme={theme} /></ProtectedRoute>} />
            <Route path="/deal-submission" element={<DealSubmissionPage />} />
            <Route path="/login" element={<NewCRMLogin />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/command-center" replace />} />
          </Routes>
        </PageContainer>
      </ContentContainer>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: theme === 'light' ? '#FFFFFF' : '#1F2937',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '500px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: theme === 'light' ? '#10B981' : '#34D399',
              secondary: theme === 'light' ? '#FFFFFF' : '#1F2937',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: theme === 'light' ? '#EF4444' : '#F87171',
              secondary: theme === 'light' ? '#FFFFFF' : '#1F2937',
            },
          },
        }}
      />
    </AppContainer>
  );
};

// Main App Component with Router
const NewCRMApp = () => {

  try {
    return (
      <Router basename="/new-crm">
        <AuthProvider>
          <CRMAppContent />
        </AuthProvider>
      </Router>
    );
  } catch (error) {
    console.error('Error in NewCRMApp:', error);
    return <div style={{ padding: '20px', color: 'red' }}>Error loading CRM: {error.message}</div>;
  }
};

export default NewCRMApp;