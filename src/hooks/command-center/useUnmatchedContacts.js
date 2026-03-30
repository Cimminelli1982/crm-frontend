import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const useUnmatchedContacts = (activeTab) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [statusFilter, setStatusFilter] = useState('unmatched');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ unmatched: 0, hold: 0, spam: 0, news: 0, matched: 0 });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch stats for all statuses
      const { data: statsData } = await supabase
        .from('unmatched_contacts')
        .select('status');
      if (statsData) {
        const counts = { unmatched: 0, hold: 0, spam: 0, news: 0, matched: 0 };
        statsData.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
        setStats(counts);
      }

      // Fetch filtered list
      let query = supabase
        .from('unmatched_contacts')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(c =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.domain || '').toLowerCase().includes(q) ||
          (c.mobile || '').includes(q)
        );
      }

      setContacts(filtered);
    } catch (err) {
      console.error('[UnmatchedContacts] Fetch error:', err);
      toast.error('Failed to load unmatched contacts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === 'unmatched') {
      fetchContacts();
    }
  }, [activeTab, fetchContacts]);

  // Re-fetch when window regains focus (e.g. after closing a modal)
  useEffect(() => {
    if (activeTab !== 'unmatched') return;
    const handleFocus = () => fetchContacts();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab, fetchContacts]);

  const handleMarkSpam = useCallback(async (item) => {
    try {
      // Update unmatched_contacts
      await supabase
        .from('unmatched_contacts')
        .update({ status: 'spam', resolved_at: new Date().toISOString() })
        .eq('id', item.id);

      // Also add to spam tables
      if (item.email) {
        await supabase
          .from('emails_spam')
          .upsert({ email: item.email.toLowerCase(), count: 1 }, { onConflict: 'email' });
      }
      if (item.mobile) {
        await supabase
          .from('whatsapp_spam')
          .upsert({ mobile_number: item.mobile, count: 1 }, { onConflict: 'mobile_number' });
      }

      setContacts(prev => prev.filter(c => c.id !== item.id));
      if (selectedContact?.id === item.id) setSelectedContact(null);
      setStats(prev => ({ ...prev, unmatched: prev.unmatched - 1, spam: prev.spam + 1 }));
      toast.success('Marked as spam');
    } catch (err) {
      console.error('[UnmatchedContacts] Spam error:', err);
      toast.error('Failed to mark as spam');
    }
  }, [selectedContact]);

  const handleMarkNews = useCallback(async (item) => {
    try {
      const prevStatus = item.status;

      await supabase
        .from('unmatched_contacts')
        .update({ status: 'news', resolved_at: new Date().toISOString() })
        .eq('id', item.id);

      // Add to emails_news so the email sync treats them as news
      if (item.email) {
        await supabase
          .from('emails_news')
          .upsert({ email: item.email.toLowerCase(), counter: 1, created_at: new Date().toISOString(), last_modified_at: new Date().toISOString() }, { onConflict: 'email' });
      }

      // If coming from spam, remove from spam tables so emails come through again
      if (prevStatus === 'spam' && item.email) {
        await supabase.from('emails_spam').delete().eq('email', item.email.toLowerCase());
      }
      if (prevStatus === 'spam' && item.mobile) {
        await supabase.from('whatsapp_spam').delete().eq('mobile_number', item.mobile);
      }

      setContacts(prev => prev.filter(c => c.id !== item.id));
      if (selectedContact?.id === item.id) setSelectedContact(null);
      setStats(prev => ({ ...prev, [prevStatus]: (prev[prevStatus] || 0) - 1, news: (prev.news || 0) + 1 }));
      toast.success(prevStatus === 'spam' ? 'Moved from spam to news' : 'Marked as news');
    } catch (err) {
      console.error('[UnmatchedContacts] News error:', err);
      toast.error('Failed to mark as news');
    }
  }, [selectedContact]);

  const handlePutOnHold = useCallback(async (item) => {
    try {
      await supabase
        .from('unmatched_contacts')
        .update({ status: 'hold' })
        .eq('id', item.id);

      // Also upsert into contacts_hold for backward compat
      if (item.email) {
        await supabase
          .from('contacts_hold')
          .upsert({
            email: item.email,
            full_name: item.name,
            first_name: item.first_name,
            last_name: item.last_name,
            mobile: item.mobile,
            status: 'pending',
            source_type: item.source_type || 'email',
            email_count: item.interaction_count || 1,
          }, { onConflict: 'email' });
      }

      setContacts(prev => prev.filter(c => c.id !== item.id));
      if (selectedContact?.id === item.id) setSelectedContact(null);
      setStats(prev => ({ ...prev, unmatched: prev.unmatched - 1, hold: prev.hold + 1 }));
      toast.success('Put on hold');
    } catch (err) {
      console.error('[UnmatchedContacts] Hold error:', err);
      toast.error('Failed to put on hold');
    }
  }, [selectedContact]);

  const handleDismiss = useCallback(async (item) => {
    try {
      await supabase
        .from('unmatched_contacts')
        .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
        .eq('id', item.id);

      setContacts(prev => prev.filter(c => c.id !== item.id));
      if (selectedContact?.id === item.id) setSelectedContact(null);
      setStats(prev => ({ ...prev, [item.status]: prev[item.status] - 1, dismissed: prev.dismissed + 1 }));
      toast.success('Dismissed');
    } catch (err) {
      console.error('[UnmatchedContacts] Dismiss error:', err);
      toast.error('Failed to dismiss');
    }
  }, [selectedContact]);

  const handleUndo = useCallback(async (item) => {
    try {
      const prevStatus = item.status;
      await supabase
        .from('unmatched_contacts')
        .update({ status: 'unmatched', resolved_at: null })
        .eq('id', item.id);

      // Remove from spam/hold tables if needed
      if (prevStatus === 'spam' && item.email) {
        await supabase.from('emails_spam').delete().eq('email', item.email.toLowerCase());
      }
      if (prevStatus === 'hold' && item.email) {
        await supabase.from('contacts_hold').delete().eq('email', item.email);
      }

      setContacts(prev => prev.filter(c => c.id !== item.id));
      if (selectedContact?.id === item.id) setSelectedContact(null);
      setStats(prev => ({ ...prev, [prevStatus]: prev[prevStatus] - 1, unmatched: prev.unmatched + 1 }));
      toast.success('Restored to unmatched');
    } catch (err) {
      console.error('[UnmatchedContacts] Undo error:', err);
      toast.error('Failed to undo');
    }
  }, [selectedContact]);

  return {
    contacts,
    loading,
    selectedContact,
    setSelectedContact,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    stats,
    fetchContacts,
    handleMarkSpam,
    handleMarkNews,
    handlePutOnHold,
    handleDismiss,
    handleUndo,
  };
};

export default useUnmatchedContacts;
