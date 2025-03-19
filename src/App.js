import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import NewContacts from './pages/NewContacts';
import { supabase } from './lib/supabaseClient';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';

// Import new pages for navigation
import LastInteractions from './pages/contacts/LastInteractions';
import KeepInTouch from './pages/contacts/KeepInTouch';
import Introductions from './pages/contacts/Introductions';
import Lists from './pages/contacts/Lists';
import Companies from './pages/Companies';
import Deals from './pages/companies/Deals';
import Startups from './pages/companies/Startups';
import Investors from './pages/companies/Investors';
import Planner from './pages/Planner';

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

  return (
    <Router>
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
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected routes */}
        {session ? (
          <Route element={<AppLayout />}>
            {/* Main routes */}
            <Route path="/" element={<Navigate to="/contacts" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-contacts" element={<NewContacts />} />

            {/* Contacts section */}
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/last-interactions" element={<LastInteractions />} />
            <Route path="/contacts/keep-in-touch" element={<KeepInTouch />} />
            <Route path="/contacts/introductions" element={<Introductions />} />
            <Route path="/contacts/lists" element={<Lists />} />

            {/* Companies section */}
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/deals" element={<Deals />} />
            <Route path="/companies/startups" element={<Startups />} />
            <Route path="/companies/investors" element={<Investors />} />

            {/* Other main sections */}
            <Route path="/planner" element={<Planner />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
