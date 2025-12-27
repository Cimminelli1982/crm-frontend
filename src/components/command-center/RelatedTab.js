import React, { useState, useEffect } from 'react';
import { FaTag, FaUser } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * RelatedTab - Shows contacts related by tags
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' or 'light'
 * @param {Array} props.contactTags - Tags of the currently selected contact
 * @param {string} props.currentContactId - ID of the current contact (to exclude from results)
 * @param {Function} props.onContactClick - Callback(contactId) when clicking a contact
 * @param {string} props.initialSelectedTagId - Pre-selected tag ID
 */
const RelatedTab = ({
  theme,
  contactTags = [],
  currentContactId,
  onContactClick,
  initialSelectedTagId,
}) => {
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Set selectedTagId when initialSelectedTagId changes
  useEffect(() => {
    if (initialSelectedTagId) {
      setSelectedTagId(initialSelectedTagId);
    }
  }, [initialSelectedTagId]);

  // Auto-select first tag when contactTags change (only if no initial tag)
  useEffect(() => {
    if (contactTags.length > 0 && !selectedTagId && !initialSelectedTagId) {
      const firstTag = contactTags[0];
      setSelectedTagId(firstTag.tag_id || firstTag.tags?.tag_id);
    }
  }, [contactTags, selectedTagId, initialSelectedTagId]);

  // Reset selected tag when contact changes
  useEffect(() => {
    if (!initialSelectedTagId) {
      setSelectedTagId(null);
    }
    setRelatedContacts([]);
  }, [currentContactId, initialSelectedTagId]);

  // Fetch contacts with the selected tag
  useEffect(() => {
    const fetchRelatedContacts = async () => {
      if (!selectedTagId) {
        setRelatedContacts([]);
        return;
      }

      setLoading(true);
      try {
        // Get all contact_ids with this tag
        const { data: taggedContacts, error: tagError } = await supabase
          .from('contact_tags')
          .select('contact_id')
          .eq('tag_id', selectedTagId);

        if (tagError) throw tagError;

        const contactIds = (taggedContacts || [])
          .map(tc => tc.contact_id)
          .filter(id => id !== currentContactId); // Exclude current contact

        if (contactIds.length === 0) {
          setRelatedContacts([]);
          setLoading(false);
          return;
        }

        // Fetch contact details (minimal)
        const { data: contacts, error: contactError } = await supabase
          .from('contacts')
          .select(`
            contact_id,
            first_name,
            last_name,
            job_role,
            profile_image_url
          `)
          .in('contact_id', contactIds)
          .order('last_name');

        if (contactError) throw contactError;

        // Fetch primary company for these contacts
        const { data: companies } = await supabase
          .from('contact_companies')
          .select('contact_id, companies(name)')
          .in('contact_id', contactIds)
          .eq('is_primary', true);

        // Merge data
        const enrichedContacts = (contacts || []).map(contact => {
          const company = companies?.find(c => c.contact_id === contact.contact_id);
          return {
            ...contact,
            primary_company: company?.companies?.name
          };
        });

        setRelatedContacts(enrichedContacts);
      } catch (err) {
        console.error('Error fetching related contacts:', err);
        setRelatedContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedContacts();
  }, [selectedTagId, currentContactId]);

  // Get tag name from tag object
  const getTagName = (tag) => tag.name || tag.tags?.name || 'Unknown';
  const getTagId = (tag) => tag.tag_id || tag.tags?.tag_id;

  // Styles
  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
    background: theme === 'dark' ? '#374151' : '#FFFFFF',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '13px',
    cursor: 'pointer'
  };

  // No tags
  if (contactTags.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
        textAlign: 'center'
      }}>
        <FaTag size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <div style={{ fontSize: '14px', fontWeight: 500 }}>No tags</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>This contact has no tags</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tag Selector */}
      <div style={{
        padding: '12px',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
        background: theme === 'dark' ? '#1F2937' : '#F9FAFB'
      }}>
        <select
          value={selectedTagId || ''}
          onChange={(e) => setSelectedTagId(e.target.value || null)}
          style={selectStyle}
        >
          <option value="">Choose a tag...</option>
          {contactTags.map((tag, idx) => (
            <option key={getTagId(tag) || idx} value={getTagId(tag)}>
              {getTagName(tag)}
            </option>
          ))}
        </select>
      </div>

      {/* Results Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        background: theme === 'dark' ? '#111827' : '#F3F4F6'
      }}>
        {!selectedTagId ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
          }}>
            <FaTag size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div style={{ fontSize: '13px' }}>Select a tag to see related contacts</div>
          </div>
        ) : loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
          }}>
            Loading...
          </div>
        ) : relatedContacts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
          }}>
            <FaUser size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div style={{ fontSize: '13px' }}>No other contacts with this tag</div>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: '11px',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              marginBottom: '10px'
            }}>
              {relatedContacts.length} contact{relatedContacts.length !== 1 ? 's' : ''}
            </div>
            {relatedContacts.map((contact) => (
              <div
                key={contact.contact_id}
                onClick={() => onContactClick && onContactClick(contact.contact_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: onContactClick ? 'pointer' : 'default',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
                }}
              >
                {/* Avatar - smaller */}
                {contact.profile_image_url ? (
                  <img
                    src={contact.profile_image_url}
                    alt=""
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: theme === 'dark' ? '#374151' : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    flexShrink: 0
                  }}>
                    {(contact.first_name?.[0] || '').toUpperCase()}{(contact.last_name?.[0] || '').toUpperCase()}
                  </div>
                )}

                {/* Name and subtitle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {contact.first_name} {contact.last_name}
                  </div>
                  {(contact.job_role || contact.primary_company) && (
                    <div style={{
                      fontSize: '11px',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {contact.job_role}{contact.job_role && contact.primary_company ? ' @ ' : ''}{contact.primary_company}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default RelatedTab;
