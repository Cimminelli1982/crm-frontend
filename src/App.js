import React, { useState, useEffect } from 'react';
import { 
  createBrowserRouter, 
  createRoutesFromElements,
  RouterProvider, 
  Routes, 
  Route, 
  Navigate, 
  Outlet 
} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewContacts from './pages/NewContacts';
import Inbox from './pages/Inbox';
import { supabase } from './lib/supabaseClient';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import new pages for navigation
import LastInteractions from './pages/contacts/LastInteractions';
import KeepInTouch from './pages/contacts/KeepInTouch';
import Introductions from './pages/contacts/Introductions';
import Lists from './pages/contacts/Lists';
import SimpleContacts from './pages/contacts/SimpleContacts';
import SimpleKeepInTouch from './pages/contacts/SimpleKeepInTouch';
import EmailInbox from './pages/contacts/EmailInbox';
import ContactsInbox from './pages/contacts/ContactsInbox';
import KeepInTouchInbox from './pages/contacts/KeepInTouchInbox';
import Interactions from './pages/contacts/Interactions';
import ContactRecord from './pages/ContactRecord';
import ContactEdit from './pages/ContactEdit';
import ContactIntegrity from './pages/ContactIntegrity';
import DuplicateManager from './pages/contacts/DuplicateManager';
import ContactCrmWorkflow from './pages/contacts/ContactCrmWorkflow';
import Companies from './pages/Companies';
import SimpleCompanies from './pages/companies/SimpleCompanies';
import CompanyRecord from './pages/CompanyRecord';
import Deals from './pages/companies/Deals';
import SimpleDeals from './pages/companies/SimpleDeals';
import Startups from './pages/companies/Startups';
import Investors from './pages/companies/Investors';
import Planner from './pages/Planner';
import ContactEnrichment from './pages/ContactEnrichment';
import HubSpotMigrationTest from './components/HubSpotMigrationTest';
import HubSpotTest from './components/HubSpotTest';

// Create a component that applies the layout
const AppLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Create a ProtectedRoute component for auth checking
  const ProtectedRoute = ({ children }) => {
    if (!session) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  // Create LoginRoute component that redirects if already logged in
  const LoginRoute = () => {
    if (session) {
      return <Navigate to="/" />;
    }
    return <Login />;
  };

  // Define routes without conditionals
  const router = createBrowserRouter(
    [
      {
        path: "/login",
        element: <LoginRoute />
      },
      {
        path: "/",
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        children: [
          {
            path: "/",
            element: <Navigate to="/contacts" />
          },
          {
            path: "dashboard",
            element: <Dashboard />
          },
          {
            path: "new-contacts",
            element: <NewContacts />
          },
          // Contacts section
          {
            path: "contacts",
            element: <Navigate to="/contacts/interactions" />
          },
          {
            path: "contacts/simple",
            element: <SimpleContacts />
          },
          {
            path: "contacts/last-interactions",
            element: <LastInteractions />
          },
          {
            path: "contacts/keep-in-touch",
            element: <SimpleKeepInTouch />
          },
          {
            path: "contacts/introductions",
            element: <Introductions />
          },
          {
            path: "contacts/lists",
            element: <Lists />
          },
          {
            path: "contacts/email-inbox",
            element: <EmailInbox />
          },
          {
            path: "contacts/inbox",
            element: <ContactsInbox />
          },
          {
            path: "contacts/interactions",
            element: <Interactions />
          },
          {
            path: "contacts/:id",
            element: <ContactRecord />
          },
          {
            path: "contacts/edit/:id",
            element: <ContactEdit />
          },
          {
            path: "contacts/integrity/:id",
            element: <ContactIntegrity />
          },
          {
            path: "contacts/workflow/:id",
            element: <ContactCrmWorkflow />
          },
          {
            path: "contacts/duplicate-manager",
            element: <DuplicateManager />
          },
          {
            path: "contacts/keep-in-touch-inbox",
            element: <KeepInTouchInbox />
          },
          // Companies section
          {
            path: "companies",
            element: <SimpleCompanies />
          },
          {
            path: "companies/:id",
            element: <CompanyRecord />
          },
          {
            path: "companies/deals",
            element: <SimpleDeals />
          },
          {
            path: "companies/startups",
            element: <Startups />
          },
          {
            path: "companies/investors",
            element: <Investors />
          },
          // Other sections
          {
            path: "planner",
            element: <Planner />
          },
          {
            path: "inbox",
            element: <Inbox />
          },
          // Admin routes
          {
            path: "admin/hubspot-migration",
            element: <HubSpotMigrationTest />
          },
          {
            path: "admin/hubspot-test",
            element: <HubSpotTest />
          },
          {
            path: "admin/contact-enrichment",
            element: <ContactEnrichment />
          }
        ]
      },
      {
        path: "*",
        element: <Navigate to="/login" />
      }
    ],
    {
      // Enable future flags for React Router v7 compatibility
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  );

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '4px',
        },
        success: {
          duration: 3000,
          style: {
            background: '#000',
            color: '#00ff00',
            border: '1px solid #00ff00',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#000',
            color: '#ff0000',
            border: '1px solid #ff0000',
          },
        },
      }} />
      <ToastContainer theme="dark" />
      <RouterProvider router={router} />
    </>
  );
};

export default App;
