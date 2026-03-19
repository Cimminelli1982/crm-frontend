import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

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
        .select('*, contacts(contact_id, first_name, last_name, profile_image_url, category, score, job_role, description, linkedin, birthday)')
        .is('resolved_at', null)
        .order('bucket', { ascending: true });

      if (error) throw error;

      const contactIds = (data || []).map(r => r.contact_id).filter(Boolean);
      let kitMap = {};
      if (contactIds.length > 0) {
        const { data: kitData } = await supabase
          .from('keep_in_touch')
          .select('contact_id, frequency, christmas, easter')
          .in('contact_id', contactIds);
        kitMap = Object.fromEntries((kitData || []).map(k => [k.contact_id, k]));
      }

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
        birthday: row.contacts?.birthday,
        full_name: [row.contacts?.first_name, row.contacts?.last_name].filter(Boolean).join(' ') || 'Unknown',
        kit_frequency: kitMap[row.contact_id]?.frequency || 'Not Set',
        christmas: kitMap[row.contact_id]?.christmas || 'no wishes set',
        easter: kitMap[row.contact_id]?.easter || 'no wishes set',
      }));

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

  // --- Optimistic local update ---

  const updateLocalContact = useCallback((contactId, updates) => {
    setDqContacts(prev => prev.map(c =>
      c.contact_id === contactId ? { ...c, ...updates } : c
    ));
    setSelectedDqContact(prev =>
      prev?.contact_id === contactId ? { ...prev, ...updates } : prev
    );
  }, []);

  // --- Inline edit handlers (auto-save, optimistic) ---

  const handleUpdateContactField = useCallback(async (contactId, field, value) => {
    updateLocalContact(contactId, { [field]: value });
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ [field]: value, last_modified_by: 'User', last_modified_at: new Date().toISOString() })
        .eq('contact_id', contactId);
      if (error) throw error;
    } catch (err) {
      toast.error(`Failed to save ${field}`);
    }
  }, [updateLocalContact]);

  const handleUpdateKIT = useCallback(async (contactId, field, value) => {
    const kitField = field === 'kit_frequency' ? 'frequency' : field;
    updateLocalContact(contactId, { [field]: value });
    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .upsert({ contact_id: contactId, [kitField]: value }, { onConflict: 'contact_id' });
      if (error) throw error;
    } catch (err) {
      toast.error(`Failed to save ${field}`);
    }
  }, [updateLocalContact]);

  // --- AI enrichment — fire & forget ---

  const handleFixDimension = useCallback((contact, dimension) => {
    toast.success(`Fixing ${dimension}...`, { duration: 2000 });

    fetch(`${BACKEND_URL}/contact/smart-enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contact.contact_id, dimensions: [dimension] }),
    })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          toast.success(`${contact.full_name}: ${dimension} done`, { duration: 3000 });
          fetchDqContacts();
        } else {
          toast.error(`${dimension} failed: ${result.error}`);
        }
      })
      .catch(err => toast.error(`${dimension} failed: ${err.message}`));
  }, [fetchDqContacts]);

  const handleFixAll = useCallback((contact) => {
    toast.success(`Enriching ${contact.full_name}...`, { duration: 2000 });

    fetch(`${BACKEND_URL}/contact/smart-enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contact.contact_id }),
    })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          toast.success(`${contact.full_name} enriched`, { duration: 3000 });
          fetchDqContacts();
        } else {
          toast.error(`Enrichment failed: ${result.error}`);
        }
      })
      .catch(err => toast.error(`Enrichment failed: ${err.message}`));
  }, [fetchDqContacts]);

  // --- Resolve ---

  const handleResolve = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('contacts_clarissa_processing')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      setDqContacts(prev => {
        const updated = prev.filter(c => c.id !== id);
        if (selectedDqContact?.id === id) {
          const currentIdx = prev.findIndex(c => c.id === id);
          const next = updated[Math.min(currentIdx, updated.length - 1)];
          setSelectedDqContact(next || null);
        }
        return updated;
      });
      toast.success('Contact resolved');
    } catch (err) {
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
    handleFixDimension,
    handleFixAll,
    handleUpdateContactField,
    handleUpdateKIT,
  };
};

export default useDataQualityData;
