import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const useDataQualityData = (activeTab) => {
  const [dqContacts, setDqContacts] = useState([]);
  const [dqLoading, setDqLoading] = useState(false);
  const [selectedDqContact, setSelectedDqContact] = useState(null);
  const [dqSections, setDqSections] = useState({ b: true, c: true, a: false });

  const toggleDqSection = useCallback((section) => {
    setDqSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const filterByBucket = useCallback((contacts, bucket) => {
    return contacts.filter(c => c.bucket === bucket);
  }, []);

  const fetchDqContacts = useCallback(async () => {
    setDqLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts_clarissa_processing')
        .select('*, contacts(contact_id, first_name, last_name, profile_image_url, category, score, job_role, description, linkedin)')
        .is('resolved_at', null)
        .order('bucket', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(row => ({
        ...row,
        contact_id: row.contacts?.contact_id || row.contact_id,
        first_name: row.contacts?.first_name,
        last_name: row.contacts?.last_name,
        profile_image_url: row.contacts?.profile_image_url,
        category: row.contacts?.category,
        score: row.contacts?.score,
        job_role: row.contacts?.job_role,
        description: row.contacts?.description,
        linkedin: row.contacts?.linkedin,
        full_name: [row.contacts?.first_name, row.contacts?.last_name].filter(Boolean).join(' ') || 'Unknown',
      }));

      // Sort: B first, then C, then A; within each bucket alphabetical by last_name
      const bucketOrder = { b: 0, c: 1, a: 2 };
      mapped.sort((a, b) => {
        const bo = (bucketOrder[a.bucket] ?? 9) - (bucketOrder[b.bucket] ?? 9);
        if (bo !== 0) return bo;
        return (a.last_name || '').localeCompare(b.last_name || '');
      });

      setDqContacts(mapped);
    } catch (err) {
      console.error('Error fetching data quality contacts:', err);
      toast.error('Failed to load data quality contacts');
    } finally {
      setDqLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dataquality') {
      fetchDqContacts();
    }
  }, [activeTab, fetchDqContacts]);

  const handleResolve = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('contacts_clarissa_processing')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setDqContacts(prev => {
        const updated = prev.filter(c => c.id !== id);
        // Auto-select next contact
        if (selectedDqContact?.id === id) {
          const currentIdx = prev.findIndex(c => c.id === id);
          const next = updated[Math.min(currentIdx, updated.length - 1)];
          setSelectedDqContact(next || null);
        }
        return updated;
      });

      toast.success('Contact resolved');
    } catch (err) {
      console.error('Error resolving contact:', err);
      toast.error('Failed to resolve contact');
    }
  }, [selectedDqContact]);

  const handleRefresh = useCallback(() => {
    fetchDqContacts();
  }, [fetchDqContacts]);

  return {
    dqContacts,
    dqLoading,
    selectedDqContact,
    setSelectedDqContact,
    dqSections,
    toggleDqSection,
    filterByBucket,
    handleResolve,
    handleRefresh,
  };
};

export default useDataQualityData;
