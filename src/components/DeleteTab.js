import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiTrash, FiAlertTriangle, FiChevronDown, FiChevronRight, FiMail, FiPhone, FiTag, FiMapPin, FiBriefcase, FiMessageCircle, FiFileText, FiClock, FiUsers, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import styled from 'styled-components';
import EmailThreadDetail from './EmailThreadDetail';

const DeleteTab = ({ contactId, theme, onClose }) => {
  const [associatedData, setAssociatedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteContact, setDeleteContact] = useState(false);
  const [spamOption, setSpamOption] = useState('none'); // 'none', 'email', 'domain'
  const [selectedThreadId, setSelectedThreadId] = useState(null);

  useEffect(() => {
    if (contactId) {
      loadAssociatedData();
    }
  }, [contactId]);

  const loadAssociatedData = async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      const results = await Promise.all([
        // Contact emails
        supabase
          .from('contact_emails')
          .select('email_id, email, type, is_primary')
          .eq('contact_id', contactId),

        // Contact mobiles
        supabase
          .from('contact_mobiles')
          .select('mobile_id, mobile, type, is_primary')
          .eq('contact_id', contactId),

        // Contact tags
        supabase
          .from('contact_tags')
          .select('entry_id, tags(tag_id, name)')
          .eq('contact_id', contactId),

        // Contact cities
        supabase
          .from('contact_cities')
          .select('entry_id, cities(city_id, name, country)')
          .eq('contact_id', contactId),

        // Contact companies with contact counts
        supabase
          .from('contact_companies')
          .select(`
            contact_companies_id,
            companies!inner(
              company_id,
              name,
              website
            ),
            relationship,
            is_primary
          `)
          .eq('contact_id', contactId),

        // Get contact counts for each company
        supabase
          .from('contact_companies')
          .select('company_id')
          .eq('contact_id', contactId)
          .then(async ({ data: companyData }) => {
            if (!companyData || companyData.length === 0) return { data: [] };
            const companyIds = [...new Set(companyData.map(c => c.company_id))];

            const counts = await Promise.all(
              companyIds.map(async (companyId) => {
                const { count } = await supabase
                  .from('contact_companies')
                  .select('*', { count: 'exact', head: true })
                  .eq('company_id', companyId);
                return { company_id: companyId, contact_count: count || 0 };
              })
            );
            return { data: counts };
          }),

        // Interactions
        supabase
          .from('interactions')
          .select('interaction_id, interaction_date, interaction_type, summary')
          .eq('contact_id', contactId)
          .order('interaction_date', { ascending: false })
          .limit(10),

        // Notes
        supabase
          .from('notes_contacts')
          .select('note_contact_id, notes(note_id, title, text, created_at)')
          .eq('contact_id', contactId)
          .limit(10),

        // Keep in touch
        supabase
          .from('keep_in_touch')
          .select('id, frequency, why_keeping_in_touch, next_follow_up_notes')
          .eq('contact_id', contactId),

        // Email threads
        supabase
          .from('contact_email_threads')
          .select('email_thread_id, contact_id')
          .eq('contact_id', contactId)
          .limit(10),

        // Attachments
        supabase
          .from('attachments')
          .select('attachment_id, file_name, file_type, created_at')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })
          .limit(10),

        // Deals
        supabase
          .from('deals_contacts')
          .select('deals_contacts_id, deal_id, relationship')
          .eq('contact_id', contactId),

        // Introductions
        supabase
          .from('introductions')
          .select('introduction_id, contact_ids, introduction_date, introduction_tool, status, text')
          .contains('contact_ids', [contactId])
          .limit(10)
      ]);

      const [
        emails,
        mobiles,
        tags,
        cities,
        companies,
        companyCounts,
        interactions,
        notes,
        keepInTouch,
        emailThreads,
        attachments,
        deals,
        introductions
      ] = results;

      // Merge company data with contact counts
      const companiesWithCounts = (companies.data || []).map(company => {
        const countData = (companyCounts.data || []).find(
          c => c.company_id === company.companies?.company_id
        );
        return {
          ...company,
          contact_count: countData?.contact_count || 0
        };
      });

      setAssociatedData({
        emails: emails.data || [],
        mobiles: mobiles.data || [],
        tags: tags.data || [],
        cities: cities.data || [],
        companies: companiesWithCounts,
        interactions: interactions.data || [],
        notes: notes.data || [],
        keepInTouch: keepInTouch.data || [],
        emailThreads: emailThreads.data || [],
        attachments: attachments.data || [],
        deals: deals.data || [],
        introductions: introductions.data || []
      });

      // Initialize selected items state
      const initialSelected = {};
      Object.keys(results).forEach((key, index) => {
        const dataKey = Object.keys({
          emails: true, mobiles: true, tags: true, cities: true,
          companies: true, interactions: true, notes: true,
          keepInTouch: true, emailThreads: true, attachments: true,
          deals: true, introductions: true
        })[index];

        if (results[index].data && results[index].data.length > 0) {
          initialSelected[dataKey] = {};
          results[index].data.forEach(item => {
            const itemId = item.email_id || item.mobile_id || item.entry_id ||
                          item.contact_companies_id || item.interaction_id ||
                          item.note_contact_id || item.attachment_id ||
                          item.deals_contacts_id || item.introduction_id ||
                          item.email_thread_id || item.id;
            if (itemId) {
              initialSelected[dataKey][itemId] = false;
            }
          });
        }
      });
      setSelectedItems(initialSelected);
    } catch (error) {
      console.error('Error loading associated data:', error);
      toast.error('Failed to load associated data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleItemSelection = (section, itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [itemId]: !prev[section]?.[itemId]
      }
    }));
  };

  const selectAllInSection = (section) => {
    const sectionData = associatedData[section];
    if (!sectionData) return;

    const allSelected = Object.values(selectedItems[section] || {}).every(v => v);

    setSelectedItems(prev => ({
      ...prev,
      [section]: Object.fromEntries(
        sectionData.map(item => {
          const itemId = item.email_id || item.mobile_id || item.entry_id ||
                        item.contact_companies_id || item.interaction_id ||
                        item.note_contact_id || item.attachment_id ||
                        item.deals_contacts_id || item.introduction_id ||
                        item.email_thread_id || item.id;
          return [itemId, !allSelected];
        })
      )
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the selected items? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    const errors = [];

    try {
      // Handle spam options if deleting contact
      if (deleteContact && spamOption !== 'none' && associatedData.emails?.length > 0) {
        const uniqueEmails = [...new Set(associatedData.emails.map(e => e.email.toLowerCase()))];

        if (spamOption === 'email') {
          // Add all contact emails to emails_spam table
          for (const email of uniqueEmails) {
            const { error } = await supabase
              .from('emails_spam')
              .insert({ email: email })
              .single();

            if (error && !error.message.includes('duplicate')) {
              console.log('Error adding email to spam:', error);
            }
          }
          toast.success(`Added ${uniqueEmails.length} email(s) to spam list`);
        } else if (spamOption === 'domain') {
          // Extract unique domains and add to domains_spam table
          const uniqueDomains = [...new Set(
            uniqueEmails
              .map(email => email.split('@')[1])
              .filter(domain => domain) // Filter out any undefined domains
          )];

          for (const domain of uniqueDomains) {
            const { error } = await supabase
              .from('domains_spam')
              .insert({ domain: domain })
              .single();

            if (error && !error.message.includes('duplicate')) {
              console.log('Error adding domain to spam:', error);
            }
          }
          toast.success(`Added ${uniqueDomains.length} domain(s) to spam list`);
        }
      }
      // Get selected interaction IDs (need to delete their attachments first)
      const selectedInteractionIds = Object.entries(selectedItems.interactions || {})
        .filter(([_, selected]) => selected)
        .map(([id, _]) => id);

      // Delete attachments for selected interactions FIRST (FK constraint)
      if (selectedInteractionIds.length > 0) {
        const { error: interactionAttachError } = await supabase
          .from('attachments')
          .delete()
          .in('interaction_id', selectedInteractionIds);

        if (interactionAttachError) {
          console.log('Error deleting interaction attachments:', interactionAttachError);
        }
      }

      // If deleting contact, delete ALL contact attachments first (FK constraint)
      if (deleteContact) {
        const { error: contactAttachError } = await supabase
          .from('attachments')
          .delete()
          .eq('contact_id', contactId);

        if (contactAttachError) {
          console.log('Error deleting contact attachments:', contactAttachError);
        }
      }

      // Delete selected items from each table
      for (const [section, items] of Object.entries(selectedItems)) {
        const selectedIds = Object.entries(items)
          .filter(([_, selected]) => selected)
          .map(([id, _]) => id);

        if (selectedIds.length === 0) continue;

        let query;
        switch (section) {
          case 'emails':
            query = supabase.from('contact_emails').delete().in('email_id', selectedIds);
            break;
          case 'mobiles':
            query = supabase.from('contact_mobiles').delete().in('mobile_id', selectedIds);
            break;
          case 'tags':
            query = supabase.from('contact_tags').delete().in('entry_id', selectedIds);
            break;
          case 'cities':
            query = supabase.from('contact_cities').delete().in('entry_id', selectedIds);
            break;
          case 'companies':
            query = supabase.from('contact_companies').delete().in('contact_companies_id', selectedIds);
            break;
          case 'interactions':
            query = supabase.from('interactions').delete().in('interaction_id', selectedIds);
            break;
          case 'notes':
            query = supabase.from('notes_contacts').delete().in('note_contact_id', selectedIds);
            break;
          case 'keepInTouch':
            query = supabase.from('keep_in_touch').delete().in('id', selectedIds);
            break;
          case 'emailThreads':
            // For contact_email_threads, we need to delete by both contact_id and email_thread_id
            query = supabase.from('contact_email_threads')
              .delete()
              .eq('contact_id', contactId)
              .in('email_thread_id', selectedIds);
            break;
          case 'attachments':
            query = supabase.from('attachments').delete().in('attachment_id', selectedIds);
            break;
          case 'deals':
            query = supabase.from('deals_contacts').delete().in('deals_contacts_id', selectedIds);
            break;
          case 'introductions':
            // For introductions, we need to update the contact_ids array
            // This is more complex and might need a different approach
            console.log('Introduction deletion needs special handling');
            continue;
        }

        if (query) {
          const { error } = await query;
          if (error) {
            errors.push(`${section}: ${error.message}`);
          }
        }
      }

      // Delete the contact itself if selected
      if (deleteContact) {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('contact_id', contactId);

        if (error) {
          errors.push(`Contact: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        toast.error(`Some items failed to delete:\n${errors.join('\n')}`);
      } else {
        toast.success('Selected items deleted successfully');
        if (deleteContact && onClose) {
          onClose();
        } else {
          loadAssociatedData();
        }
      }
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error('Failed to delete items');
    } finally {
      setIsDeleting(false);
    }
  };

  const getSelectedCount = () => {
    let count = 0;
    for (const section of Object.values(selectedItems)) {
      count += Object.values(section).filter(v => v).length;
    }
    return count;
  };

  const renderSection = (title, data, icon, sectionKey) => {
    const isExpanded = expandedSections[sectionKey];
    const sectionItems = selectedItems[sectionKey] || {};
    const selectedCount = Object.values(sectionItems).filter(v => v).length;

    if (!data || data.length === 0) return null;

    return (
      <SectionContainer theme={theme}>
        <SectionHeader
          onClick={() => toggleSection(sectionKey)}
          theme={theme}
        >
          <SectionLeft>
            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            {icon}
            <SectionTitle theme={theme}>{title}</SectionTitle>
            <Badge theme={theme}>{data.length}</Badge>
            {selectedCount > 0 && (
              <SelectedBadge>{selectedCount} selected</SelectedBadge>
            )}
          </SectionLeft>
          {data.length > 0 && (
            <SelectAllButton
              onClick={(e) => {
                e.stopPropagation();
                selectAllInSection(sectionKey);
              }}
              theme={theme}
            >
              Select All
            </SelectAllButton>
          )}
        </SectionHeader>

        {isExpanded && (
          <SectionContent theme={theme}>
            {data.map((item) => {
              const itemId = item.email_id || item.mobile_id || item.entry_id ||
                            item.contact_companies_id || item.interaction_id ||
                            item.note_contact_id || item.attachment_id ||
                            item.deals_contacts_id || item.introduction_id ||
                            item.email_thread_id || item.id;

              return (
                <DataItem key={itemId} theme={theme}>
                  <Checkbox
                    type="checkbox"
                    checked={sectionItems[itemId] || false}
                    onChange={() => toggleItemSelection(sectionKey, itemId)}
                    disabled={isDeleting}
                  />
                  <ItemContent theme={theme}>
                    {renderItemDetails(sectionKey, item, theme)}
                  </ItemContent>
                </DataItem>
              );
            })}
          </SectionContent>
        )}
      </SectionContainer>
    );
  };

  const renderItemDetails = (section, item, theme) => {
    switch (section) {
      case 'emails':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{item.email}</strong>
            {item.type && <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> ({item.type})</span>}
            {item.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
          </>
        );
      case 'mobiles':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{item.mobile}</strong>
            {item.type && <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> ({item.type})</span>}
            {item.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
          </>
        );
      case 'tags':
        return <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{item.tags?.name}</strong>;
      case 'cities':
        return <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{item.cities?.name}, {item.cities?.country}</strong>;
      case 'companies':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{item.companies?.name || 'Unnamed Company'}</strong>
            <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
              {' '}({item.contact_count || 0} contact{item.contact_count !== 1 ? 's' : ''})
            </span>
            {item.relationship && item.relationship !== 'not_set' && (
              <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> - {item.relationship.replace(/_/g, ' ')}</span>
            )}
            {item.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
          </>
        );
      case 'interactions':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{new Date(item.interaction_date).toLocaleDateString()}</strong>
            <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> - {item.interaction_type}</span>
            {item.summary && <div style={{ color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{item.summary}</div>}
          </>
        );
      case 'notes':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{new Date(item.notes?.created_at).toLocaleDateString()}</strong>
            {item.notes?.title && <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> - {item.notes.title}</span>}
            <div style={{ color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{item.notes?.text?.substring(0, 100)}...</div>
          </>
        );
      case 'keepInTouch':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>Frequency: {item.frequency}</strong>
            {item.why_keeping_in_touch && <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> - {item.why_keeping_in_touch}</span>}
          </>
        );
      case 'emailThreads':
        return (
          <ThreadItemContent>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>Thread ID: {item.email_thread_id}</strong>
            <ViewThreadButton
              theme={theme}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedThreadId(item.email_thread_id);
              }}
            >
              <FiExternalLink size={14} />
              View Thread
            </ViewThreadButton>
          </ThreadItemContent>
        );
      case 'attachments':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{item.file_name}</strong>
            <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> ({item.file_type})</span>
          </>
        );
      case 'deals':
        return (
          <>
            <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>Deal ID: {item.deal_id}</strong>
            {item.relationship && <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> - {item.relationship}</span>}
          </>
        );
      case 'introductions':
        return (
          <>
            {item.text && <strong style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{item.text.substring(0, 50)}...</strong>}
            <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> - {item.status}</span>
            {item.introduction_date && <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}> ({new Date(item.introduction_date).toLocaleDateString()})</span>}
          </>
        );
      default:
        return JSON.stringify(item);
    }
  };

  if (loading) {
    return <LoadingContainer>Loading associated data...</LoadingContainer>;
  }

  return (
    <>
      <Container theme={theme}>
        <ScrollableContent>
          {renderSection('Email Addresses', associatedData.emails, <FiMail />, 'emails')}
          {renderSection('Phone Numbers', associatedData.mobiles, <FiPhone />, 'mobiles')}
          {renderSection('Tags', associatedData.tags, <FiTag />, 'tags')}
          {renderSection('Cities', associatedData.cities, <FiMapPin />, 'cities')}
          {renderSection('Companies', associatedData.companies, <FiBriefcase />, 'companies')}
          {renderSection('Interactions', associatedData.interactions, <FiMessageCircle />, 'interactions')}
          {renderSection('Notes', associatedData.notes, <FiFileText />, 'notes')}
          {renderSection('Keep in Touch', associatedData.keepInTouch, <FiClock />, 'keepInTouch')}
          {renderSection('Email Threads', associatedData.emailThreads, <FiMail />, 'emailThreads')}
          {renderSection('Attachments', associatedData.attachments, <FiFileText />, 'attachments')}
          {renderSection('Deals', associatedData.deals, <FiBriefcase />, 'deals')}
          {renderSection('Introductions', associatedData.introductions, <FiUsers />, 'introductions')}

        {/* Spam Options Section - Only show if contact has emails */}
        {associatedData.emails?.length > 0 && (
          <SpamOptionsSection theme={theme}>
            <SpamOptionsHeader theme={theme}>
              <FiAlertTriangle />
              <span>Spam Management Options</span>
            </SpamOptionsHeader>
            <SpamOptionsContent>
              <RadioOption theme={theme}>
                <input
                  type="radio"
                  id="spamNone"
                  name="spamOption"
                  value="none"
                  checked={spamOption === 'none'}
                  onChange={(e) => setSpamOption(e.target.value)}
                  disabled={!deleteContact || isDeleting}
                />
                <label htmlFor="spamNone">
                  <strong>Don't add to spam</strong>
                  <p>Contact will be deleted without marking as spam</p>
                </label>
              </RadioOption>

              <RadioOption theme={theme}>
                <input
                  type="radio"
                  id="spamEmail"
                  name="spamOption"
                  value="email"
                  checked={spamOption === 'email'}
                  onChange={(e) => setSpamOption(e.target.value)}
                  disabled={!deleteContact || isDeleting}
                />
                <label htmlFor="spamEmail">
                  <strong>Add email(s) to spam</strong>
                  <p>
                    Will add: {associatedData.emails
                      .slice(0, 3)
                      .map(e => e.email)
                      .join(', ')}
                    {associatedData.emails.length > 3 && ` and ${associatedData.emails.length - 3} more`}
                  </p>
                </label>
              </RadioOption>

              <RadioOption theme={theme}>
                <input
                  type="radio"
                  id="spamDomain"
                  name="spamOption"
                  value="domain"
                  checked={spamOption === 'domain'}
                  onChange={(e) => setSpamOption(e.target.value)}
                  disabled={!deleteContact || isDeleting}
                />
                <label htmlFor="spamDomain">
                  <strong>Add domain(s) to spam</strong>
                  <p>
                    Will add: {[...new Set(associatedData.emails
                      .map(e => e.email.split('@')[1])
                      .filter(d => d))]
                      .slice(0, 3)
                      .join(', ')}
                    {[...new Set(associatedData.emails.map(e => e.email.split('@')[1]).filter(d => d))].length > 3 &&
                      ` and ${[...new Set(associatedData.emails.map(e => e.email.split('@')[1]).filter(d => d))].length - 3} more`}
                  </p>
                </label>
              </RadioOption>
            </SpamOptionsContent>
          </SpamOptionsSection>
        )}

        <DeleteContactSection theme={theme}>
          <Checkbox
            type="checkbox"
            id="deleteContact"
            checked={deleteContact}
            onChange={(e) => {
              setDeleteContact(e.target.checked);
              // Reset spam option when unchecking delete contact
              if (!e.target.checked) {
                setSpamOption('none');
              }
            }}
            disabled={isDeleting}
          />
          <label htmlFor="deleteContact">
            <strong>Delete the contact record itself</strong>
            <p>This will permanently remove the contact from the database</p>
          </label>
        </DeleteContactSection>
      </ScrollableContent>

      <Footer theme={theme}>
        <FooterInfo>
          {getSelectedCount()} items selected
          {deleteContact && ' + contact record'}
          {deleteContact && spamOption === 'email' && ' (emails → spam)'}
          {deleteContact && spamOption === 'domain' && ' (domains → spam)'}
        </FooterInfo>
        <DeleteButton
          onClick={handleDelete}
          disabled={isDeleting || (getSelectedCount() === 0 && !deleteContact)}
        >
          <FiTrash />
          {isDeleting ? 'Deleting...' : 'Delete Selected'}
        </DeleteButton>
      </Footer>
    </Container>

    {selectedThreadId && (
      <EmailThreadDetail
        threadId={selectedThreadId}
        onClose={() => setSelectedThreadId(null)}
        theme={theme}
      />
    )}
    </>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 60vh;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  margin-top: 16px;
`;

const SectionContainer = styled.div`
  margin-bottom: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  cursor: pointer;
  user-select: none;

  svg {
    color: ${props => props.theme === 'light' ? '#374151' : '#9CA3AF'} !important;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#111827'};
  }
`;

const SectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionTitle = styled.span`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'} !important;
`;

const Badge = styled.span`
  padding: 2px 8px;
  background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#DBEAFE'};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const SelectedBadge = styled(Badge)`
  background: #FEE2E2;
  color: #DC2626;
`;

const SelectAllButton = styled.button`
  padding: 4px 12px;
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#2563EB'};
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#1D4ED8'};
  }
`;

const SectionContent = styled.div`
  padding: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
`;

const DataItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#D1D5DB'} !important;

  * {
    color: ${props => props.theme === 'light' ? '#111827' : '#D1D5DB'} !important;
  }

  strong {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'} !important;
    font-weight: 600;
  }

  div {
    margin-top: 4px;
    color: ${props => props.theme === 'light' ? '#374151' : '#9CA3AF'} !important;
    font-size: 13px;
  }

  span {
    color: ${props => props.theme === 'light' ? '#4B5563' : '#D1D5DB'} !important;
  }
`;

const PrimaryBadge = styled.span`
  margin-left: 8px;
  padding: 2px 6px;
  background: #DBEAFE;
  color: #1E40AF;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
`;

const WhatsAppBadge = styled(PrimaryBadge)`
  background: #D1FAE5;
  color: #065F46;
`;

const SpamOptionsSection = styled.div`
  margin-top: 24px;
  padding: 0;
  background: ${props => props.theme === 'light' ? '#FFF7ED' : '#451A03'};
  border: 2px solid ${props => props.theme === 'light' ? '#FED7AA' : '#92400E'};
  border-radius: 8px;
  overflow: hidden;
`;

const SpamOptionsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFEDD5' : '#78350F'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#FED7AA' : '#92400E'};

  svg {
    color: ${props => props.theme === 'light' ? '#EA580C' : '#FB923C'};
  }

  span {
    font-weight: 600;
    color: ${props => props.theme === 'light' ? '#9A3412' : '#FED7AA'};
  }
`;

const SpamOptionsContent = styled.div`
  padding: 16px;
`;

const RadioOption = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  input[type="radio"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  label {
    flex: 1;
    cursor: pointer;

    strong {
      display: block;
      color: ${props => props.theme === 'light' ? '#92400E' : '#FED7AA'};
      margin-bottom: 4px;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: ${props => props.theme === 'light' ? '#78350F' : '#FFEDD5'};
      line-height: 1.4;
    }
  }

  input:disabled + label {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const DeleteContactSection = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #FEF2F2;
  border: 2px solid #FCA5A5;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;

  label {
    flex: 1;
    cursor: pointer;

    strong {
      display: block;
      color: #B91C1C;
      margin-bottom: 4px;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #991B1B;
    }
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
`;

const FooterInfo = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-weight: 500;
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #B91C1C;
  }

  &:disabled {
    background: #9CA3AF;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #6B7280;
`;

const ThreadItemContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ViewThreadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${props => props.theme === 'light' ? '#EBF8FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#2563EB' : '#93BBFC'};
  border: 1px solid ${props => props.theme === 'light' ? '#93C5FD' : '#2563EB'};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#2563EB'};
    border-color: ${props => props.theme === 'light' ? '#60A5FA' : '#3B82F6'};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  svg {
    transition: transform 0.2s;
  }

  &:hover svg {
    transform: rotate(12deg);
  }
`;

export default DeleteTab;