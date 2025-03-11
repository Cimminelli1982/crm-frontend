import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import NotificationsList from '../components/contacts/NotificationsList';
import RecentContactsList from '../components/contacts/RecentContactsList';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #0070f3;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6c757d;
`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

async function fetchStats() {
  setLoading(true);
  
  try {
    // Get total contacts (excluding Skip)
    const { count: totalCount, error: totalError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .or('contact_category.is.null,contact_category.neq.Skip');
    
    // Get today's contacts (excluding Skip)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { count: todayCount, error: todayError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
      .or('contact_category.is.null,contact_category.neq.Skip');
    
    // Get this week's contacts (excluding Skip)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const { count: weekCount, error: weekError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStartStr)
      .or('contact_category.is.null,contact_category.neq.Skip');
    
    if (totalError || todayError || weekError) {
      console.error("Error fetching stats:", { totalError, todayError, weekError });
    } else {
      setStats({
        todayCount: todayCount || 0,
        weekCount: weekCount || 0,
        totalCount: totalCount || 0
      });
    }
  } catch (error) {
    console.error("Exception fetching stats:", error);
  } finally {
    setLoading(false);
  }
}
  return (
    <>
      <h1>Dashboard</h1>
      <StatsContainer>
        <StatCard>
          <StatValue>{loading ? '...' : stats.todayCount}</StatValue>
          <StatLabel>New Contacts Today</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{loading ? '...' : stats.weekCount}</StatValue>
          <StatLabel>Contacts This Week</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{loading ? '...' : stats.totalCount}</StatValue>
          <StatLabel>Total Contacts</StatLabel>
        </StatCard>
      </StatsContainer>
      
      <NotificationsList />
      
      <RecentContactsList />
    </>
  );
};

export default Dashboard;
