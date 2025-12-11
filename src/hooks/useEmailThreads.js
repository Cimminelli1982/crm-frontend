import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Custom hook for managing email threads from command_center_inbox
 * Handles fetching, grouping by thread_id, and selection
 */
const useEmailThreads = (activeTab) => {
  const [emails, setEmails] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);

  // Group emails by thread_id
  const groupByThread = useCallback((emailList) => {
    const threadMap = new Map();

    for (const email of emailList) {
      const threadId = email.thread_id || email.id; // fallback to id if no thread_id
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId).push(email);
    }

    // Sort each thread by date descending (newest first)
    const result = [];
    for (const [threadId, threadEmails] of threadMap) {
      threadEmails.sort((a, b) => new Date(b.date) - new Date(a.date));
      result.push({
        threadId,
        emails: threadEmails,
        latestEmail: threadEmails[0],
        count: threadEmails.length
      });
    }

    // Sort threads by latest email date descending
    result.sort((a, b) => new Date(b.latestEmail.date) - new Date(a.latestEmail.date));
    return result;
  }, []);

  // Fetch emails from Supabase
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('command_center_inbox')
      .select('*')
      .or('type.eq.email,type.is.null')  // Only fetch emails, not WhatsApp
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching emails:', error);
    } else {
      setEmails(data || []);
      const grouped = groupByThread(data || []);
      setThreads(grouped);
      if (grouped.length > 0) {
        setSelectedThread(grouped[0].emails);
      }
    }
    setLoading(false);
  }, [groupByThread]);

  // Fetch on mount
  useEffect(() => {
    fetchEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also fetch when activeTab changes back to 'email'
  useEffect(() => {
    if (activeTab === 'email') {
      fetchEmails();
    }
  }, [activeTab, fetchEmails]);

  // Select a thread
  const selectThread = useCallback((threadEmails) => {
    setSelectedThread(threadEmails);
  }, []);

  // Refresh threads (re-fetch from database)
  const refreshThreads = useCallback(() => {
    return fetchEmails();
  }, [fetchEmails]);

  // Remove emails by sender (for spam/delete operations)
  const removeEmailsBySender = useCallback((senderEmail) => {
    const emailLower = senderEmail.toLowerCase();

    setThreads(prev => {
      const updated = prev.map(thread => ({
        ...thread,
        emails: thread.emails.filter(e => e.from_email?.toLowerCase() !== emailLower)
      })).filter(thread => thread.emails.length > 0);

      // Update latestEmail for remaining threads
      return updated.map(t => ({
        ...t,
        latestEmail: t.emails[0],
        count: t.emails.length
      }));
    });

    // Clear selected thread if it was from this sender
    setSelectedThread(prev => {
      if (!prev) return prev;
      const filtered = prev.filter(e => e.from_email?.toLowerCase() !== emailLower);
      return filtered.length > 0 ? filtered : null;
    });
  }, []);

  return {
    // State
    emails,
    threads,
    selectedThread,
    loading,
    // Setters (for external mutations)
    setEmails,
    setThreads,
    setSelectedThread,
    // Actions
    selectThread,
    refreshThreads,
    removeEmailsBySender,
    // Helpers
    groupByThread
  };
};

export default useEmailThreads;
