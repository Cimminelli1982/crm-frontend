import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { Toaster } from 'react-hot-toast';

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
    padding-bottom: 80px;
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

  // Map paths to page IDs for navigation highlighting
  const getPageIdFromPath = (pathname) => {
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

      setBirthdayContacts(todayBirthdays);

      if (todayBirthdays.length > 0) {
        setNotification({
          message: '',
          type: 'success',
          visible: true,
          contacts: todayBirthdays,
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

  // Set up real-time subscription for new interactions
  useEffect(() => {
    const subscription = supabase
      .channel('interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interactions',
          filter: 'direction=eq.received'
        },
        async (payload) => {
          console.log('🔔 New interaction payload:', payload.new);

          // Fetch contact details for the interaction
          const { data: contact, error } = await supabase
            .from('contacts')
            .select('first_name, last_name')
            .eq('contact_id', payload.new.contact_id)
            .single();

          console.log('🔔 Contact fetch result:', contact, error);

          if (contact && !error) {
            const messagePreview = payload.new.interaction_type === 'whatsapp'
              ? payload.new.summary?.substring(0, 100) + (payload.new.summary?.length > 100 ? '...' : '')
              : payload.new.summary?.substring(0, 60) + (payload.new.summary?.length > 60 ? '...' : '');

            const messageText = `📩 ${contact.first_name}: ${messagePreview}`;
            console.log('🔔 Message notification text:', messageText);

            // Force hide any existing notification first
            setNotification(prev => ({ ...prev, visible: false }));

            // Small delay to ensure the previous notification is hidden
            setTimeout(() => {
              console.log('🔔 Setting message notification');
              setNotification({
                message: messageText,
                type: 'info',
                visible: true,
                contacts: [{
                  ...payload.new,
                  contacts: contact,
                  // Ensure we have the necessary IDs for action buttons
                  email_thread_id: payload.new.email_thread_id,
                  chat_id: payload.new.chat_id,
                  interaction_type: payload.new.interaction_type
                }],
                notificationType: 'messages'
              });

              // Auto-hide after 10 seconds
              setTimeout(() => {
                setNotification(prev => ({ ...prev, visible: false }));
              }, 10000);
            }, 100);
          } else {
            console.log('🔔 Contact fetch failed:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Fetch birthday notifications on load
  useEffect(() => {
    fetchTodayBirthdays();
  }, []);


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
          notificationType={notification.notificationType}
        />
        <PageContainer>
          <Routes>
            <Route path="/" element={<Navigate to="/sort" replace />} />
            <Route path="/sort" element={<SortPage theme={theme} onInboxCountChange={setInboxCount} />} />
            <Route path="/interactions" element={<InteractionsPage theme={theme} />} />
            <Route path="/search" element={<SearchPage theme={theme} />} />
            <Route path="/keep-in-touch" element={<KeepInTouchPage theme={theme} onKeepInTouchCountChange={setKeepInTouchCount} />} />
            <Route path="/contact/:contactId" element={<ContactDetail theme={theme} />} />
            <Route path="/contact/:contactId/edit" element={<ContactEditNew theme={theme} />} />
            <Route path="/city/:cityId/contacts" element={<CityContactsPage theme={theme} />} />
            <Route path="/tag/:tagId/contacts" element={<TagContactsPage theme={theme} />} />
            <Route path="/company/:companyId" element={<CompanyDetailPage theme={theme} />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/sort" replace />} />
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
  console.log('NewCRMApp component rendering...');

  try {
    return (
      <Router basename="/new-crm">
        <CRMAppContent />
      </Router>
    );
  } catch (error) {
    console.error('Error in NewCRMApp:', error);
    return <div style={{ padding: '20px', color: 'red' }}>Error loading CRM: {error.message}</div>;
  }
};

export default NewCRMApp;