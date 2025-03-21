import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import Modal from 'react-modal';
import Select from 'react-select';
import ContactsModal from '../../components/modals/ContactsModal';

const PageContainer = styled.div`
  padding: 24px;
  background-color: white;
  border-radius: 8px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  
  p {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const IntroductionsTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 24px;
  background: #fff;
  border: none;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHead = styled.thead`
  background: white;
  th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 500;
    color: black;
    border-bottom: 1px solid black;
    &.date-col { width: 3%; }
    &.contacts-col { width: 38%; }
    &.rationale-col { width: 12%; }
    &.note-col { width: 42%; }
    &.actions-col { width: 5%; }
  }
`;

const TableBody = styled.tbody`
  tr {
    &:hover {
      background-color: #f9fafb;
    }
    /* Removing row borders */
  }
  td {
    padding: 12px 16px;
    font-size: 0.875rem;
    color: #1f2937;
    vertical-align: middle;
    border-bottom: none;
  }
`;

const Button = styled.button`
  padding: 6px 12px;
  border-radius: 0px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #000000;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #333333;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
  }

  input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
    height: 38px;
    box-sizing: border-box;
  }
  
  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
    min-height: 80px;
    font-family: inherit;
    box-sizing: border-box;
  }
  
  /* Ensure the react-select components match our styling */
  .css-13cymwt-control {
    min-height: 38px;
  }
`;

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    maxWidth: '90%',
    borderRadius: '8px',
    padding: '0',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
};

const RationaleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: white;
  border: 1.5px solid black;
  color: black;
  cursor: pointer;
  position: relative;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const ContactChip = styled.span`
  display: inline-flex;
  align-items: center;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 16px;
  margin: 2px;
  font-size: 0.75rem;

  .contact-name {
    cursor: pointer;
    &:hover {
      color: #3b82f6;
    }
  }

  button {
    background: none;
    border: none;
    margin-left: 4px;
    cursor: pointer;
    color: #4b5563;
    padding: 0 2px;
    
    &:hover {
      color: #ef4444;
    }
  }
`;

const AddContactButton = styled.button`
  background: none;
  border: 1px dashed #9ca3af;
  padding: 2px 8px;
  border-radius: 16px;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.75rem;
  margin: 2px;

  &:hover {
    background: #f3f4f6;
  }
`;

const ContactSelect = styled(Select)`
  min-width: 200px;
`;

const TruncatedText = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  position: relative;

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 0;
    top: 100%;
    background: #1f2937;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    white-space: normal;
    max-width: 400px;
    word-wrap: break-word;
    z-index: 1000;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const RationaleDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  width: 150px;
`;

const RationaleOption = styled.div`
  padding: 8px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const InlineNoteEditor = styled.div`
  position: relative;
  width: 100%;
  
  textarea {
    width: 100%;
    padding: 8px;
    font-size: 0.875rem;
    border: 1px solid black;
    border-radius: 0;
    min-height: 60px;
    font-family: inherit;
  }
  
  &::after {
    content: 'Press Enter to save, Esc to cancel';
    position: absolute;
    bottom: -20px;
    right: 0;
    font-size: 0.7rem;
    color: #6b7280;
  }
`;

const NoteText = styled.div`
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const DeleteButton = styled.button`
  padding: 4px 8px;
  background-color: ${props => props.confirm ? '#ef4444' : 'black'};
  color: white;
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-size: 0.75rem;
  
  &:hover {
    background-color: ${props => props.confirm ? '#dc2626' : '#333333'};
  }
`;

const Introductions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [introductions, setIntroductions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIntro, setEditingIntro] = useState(null);
  const [showContactSelect, setShowContactSelect] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [activeRationaleDropdown, setActiveRationaleDropdown] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [deletingIntro, setDeletingIntro] = useState(null);
  const [formData, setFormData] = useState({
    intro_date: format(new Date(), 'yyyy-MM-dd'),
    contacts_introduced: [],
    introduction_rationale: '',
    introduction_note: '',
  });

  const rationaleOptions = [
    { value: 'Karma Points', label: '🎰 Karma Points' },
    { value: 'Dealflow Related', label: '🌈 Dealflow' },
    { value: 'Portfolio Company Related', label: '🤑 Portfolio' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch contacts - get all contacts with no limit
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .order('last_modified', { ascending: false });
      
      if (contactsError) throw contactsError;
      setContacts(contactsData);

      // Fetch introductions
      const { data: introductionsData, error: introductionsError } = await supabase
        .from('contact_introductions')
        .select('*')
        .order('intro_date', { ascending: false });

      if (introductionsError) throw introductionsError;
      
      // Log the introductions data to debug contact IDs
      console.log('Introductions data:', introductionsData);
      if (introductionsData && introductionsData.length > 0) {
        console.log('First introduction contacts_introduced type:', 
                   typeof introductionsData[0].contacts_introduced,
                   'value:', introductionsData[0].contacts_introduced);
      }
      
      setIntroductions(introductionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle key presses in the modal
  const handleModalKeyDown = (e) => {
    // If Enter is pressed (not in a textarea) and not with modifiers, submit the form
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // If Escape is pressed, close the modal
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.contacts_introduced.length) {
        alert('Please select at least one contact');
        return;
      }
      if (!formData.introduction_rationale) {
        alert('Please select a rationale');
        return;
      }

      const { data, error } = await supabase
        .from('contact_introductions')
        .insert([{
          intro_date: formData.intro_date,
          contacts_introduced: formData.contacts_introduced,
          introduction_rationale: formData.introduction_rationale,
          introduction_note: formData.introduction_note,
          created_by: (await supabase.auth.getUser()).data.user.id
        }])
        .select();

      if (error) throw error;
      
      setIsModalOpen(false);
      fetchData();
      setFormData({
        intro_date: format(new Date(), 'yyyy-MM-dd'),
        contacts_introduced: [],
        introduction_rationale: '',
        introduction_note: '',
      });
      
      // Show success message
      alert('Introduction created successfully!');
    } catch (error) {
      console.error('Error creating introduction:', error);
      alert('Error creating introduction: ' + error.message);
    }
  };

  const handleEdit = (intro) => {
    setEditingIntro(intro);
    setFormData({
      intro_date: format(new Date(intro.intro_date), 'yyyy-MM-dd'),
      contacts_introduced: intro.contacts_introduced,
      introduction_rationale: intro.introduction_rationale,
      introduction_note: intro.introduction_note,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('contact_introductions')
        .update({
          intro_date: formData.intro_date,
          contacts_introduced: formData.contacts_introduced,
          introduction_rationale: formData.introduction_rationale,
          introduction_note: formData.introduction_note,
        })
        .eq('intro_id', editingIntro.intro_id);

      if (error) throw error;
      
      setIsEditModalOpen(false);
      fetchData();
      alert('Introduction updated successfully!');
    } catch (error) {
      console.error('Error updating introduction:', error);
      alert('Error updating introduction: ' + error.message);
    }
  };

  const handleRemoveContact = async (introId, contactIdToRemove) => {
    try {
      const intro = introductions.find(i => i.intro_id === introId);
      const updatedContacts = intro.contacts_introduced.filter(id => id !== contactIdToRemove);
      
      if (updatedContacts.length < 2) {
        alert('An introduction must have at least 2 contacts');
        return;
      }

      const { error } = await supabase
        .from('contact_introductions')
        .update({ contacts_introduced: updatedContacts })
        .eq('intro_id', introId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error removing contact:', error);
      alert('Error removing contact: ' + error.message);
    }
  };

  const handleAddContact = async (introId, newContactId) => {
    try {
      const intro = introductions.find(i => i.intro_id === introId);
      const updatedContacts = [...intro.contacts_introduced, newContactId];

      const { error } = await supabase
        .from('contact_introductions')
        .update({ contacts_introduced: updatedContacts })
        .eq('intro_id', introId);

      if (error) throw error;
      setShowContactSelect(null);
      fetchData();
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Error adding contact: ' + error.message);
    }
  };

  const getContactNames = (contactIds) => {
    // Log for debugging purposes
    console.log('Contact IDs to find:', contactIds);
    console.log('Available contacts:', contacts.map(c => c.id));
    
    return contactIds
      .map(id => {
        const contact = contacts.find(c => c.id === id);
        if (!contact) {
          console.log('Contact not found for ID:', id);
        }
        return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
      })
      .join(', ');
  };

  const handleContactClick = async (contactId) => {
    try {
      const { data: contactData, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      
      setSelectedContact(contactData);
      setIsContactModalOpen(true);
    } catch (error) {
      console.error('Error fetching contact details:', error);
      alert('Error fetching contact details');
    }
  };
  
  const handleRationaleClick = (introId, e) => {
    // Close any active dropdown when clicking anywhere else
    if (activeRationaleDropdown && activeRationaleDropdown !== introId) {
      setActiveRationaleDropdown(null);
    }
    
    // Toggle the dropdown
    setActiveRationaleDropdown(activeRationaleDropdown === introId ? null : introId);
    e.stopPropagation(); // Prevent event from propagating to the document
  };
  
  const handleRationaleChange = async (introId, newRationale) => {
    try {
      console.log(`Updating introduction ${introId} with new rationale: ${newRationale}`);
      
      // Using the exact intro_id as a number, not a string
      const numericIntroId = parseInt(introId, 10);
      
      // Update the record using the correct field name and ID
      const { data, error } = await supabase
        .from('contact_introductions')
        .update({ introduction_rationale: newRationale })
        .eq('intro_id', numericIntroId);

      if (error) {
        console.error('Update error details:', error);
        throw error;
      }
      
      console.log('Update successful, response:', data);
      
      // Close the dropdown
      setActiveRationaleDropdown(null);
      
      // Refresh the data
      fetchData();
    } catch (error) {
      console.error('Error updating rationale:', error);
      alert('Error updating rationale: ' + error.message);
    }
  };
  
  // Function to handle inline note editing
  const handleNoteClick = (intro) => {
    setEditingNote(intro.intro_id);
    setEditingNoteText(intro.introduction_note || '');
  };
  
  const handleNoteSave = async () => {
    try {
      // Convert to numeric ID
      const numericIntroId = parseInt(editingNote, 10);
      
      const { error } = await supabase
        .from('contact_introductions')
        .update({ introduction_note: editingNoteText })
        .eq('intro_id', numericIntroId);
        
      if (error) throw error;
      
      // Exit edit mode
      setEditingNote(null);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Error updating note: ' + error.message);
    }
  };
  
  const handleNoteCancel = () => {
    setEditingNote(null);
  };
  
  // Handle delete functionality with confirmation
  const handleDeleteClick = (introId) => {
    if (deletingIntro === introId) {
      // This is the confirmation click, proceed with deletion
      deleteIntroduction(introId);
      setDeletingIntro(null);
    } else {
      // First click, set up confirmation
      setDeletingIntro(introId);
      
      // Auto-reset confirmation after 5 seconds
      setTimeout(() => {
        if (deletingIntro === introId) {
          setDeletingIntro(null);
        }
      }, 5000);
    }
  };
  
  const deleteIntroduction = async (introId) => {
    try {
      const numericIntroId = parseInt(introId, 10);
      
      // Delete the introduction
      const { error } = await supabase
        .from('contact_introductions')
        .delete()
        .eq('intro_id', numericIntroId);
        
      if (error) throw error;
      
      // Refresh the data
      fetchData();
    } catch (error) {
      console.error('Error deleting introduction:', error);
      alert('Error deleting introduction: ' + error.message);
    }
  };
  
  // Add click handler to close dropdown when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => {
      if (activeRationaleDropdown !== null) {
        setActiveRationaleDropdown(null);
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeRationaleDropdown]);

  const renderContactsCell = (intro) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      {intro.contacts_introduced.map(contactId => (
        <ContactChip key={contactId}>
          <span 
            className="contact-name"
            onClick={() => handleContactClick(contactId)}
          >
            {getContactNames([contactId])}
          </span>
          <button onClick={() => handleRemoveContact(intro.intro_id, contactId)}>×</button>
        </ContactChip>
      ))}
      {showContactSelect === intro.intro_id ? (
        <ContactSelect
          options={contacts
            .filter(c => !intro.contacts_introduced.includes(c.id))
            .map(c => ({
              value: c.id,
              label: `${c.first_name} ${c.last_name}`
            }))}
          onChange={(selected) => handleAddContact(intro.intro_id, selected.value)}
          onBlur={() => setShowContactSelect(null)}
          autoFocus
        />
      ) : (
        <AddContactButton onClick={() => setShowContactSelect(intro.intro_id)}>
          + Add Contact
        </AddContactButton>
      )}
    </div>
  );

  const renderNote = (intro) => {
    if (editingNote === intro.intro_id) {
      // Show inline editor when this note is being edited
      return (
        <InlineNoteEditor>
          <textarea 
            value={editingNoteText}
            onChange={(e) => setEditingNoteText(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              // Save on Enter (without shift for newlines)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleNoteSave();
              }
              // Cancel on Escape
              if (e.key === 'Escape') {
                e.preventDefault();
                handleNoteCancel();
              }
            }}
          />
        </InlineNoteEditor>
      );
    } else {
      // Show text with click handler to enter edit mode
      const note = intro.introduction_note;
      return (
        <NoteText onClick={() => handleNoteClick(intro)}>
          {!note ? '-' : (
            <TruncatedText data-tooltip={note}>
              {note}
            </TruncatedText>
          )}
        </NoteText>
      );
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <h1>Introductions</h1>
        <p>Manage your professional introductions and networking connections.</p>
      </PageHeader>
      
      <Button onClick={() => setIsModalOpen(true)}>New Introduction</Button>
      
      <IntroductionsTable>
        <TableHead>
          <tr>
            <th className="date-col">Date</th>
            <th className="contacts-col">Contacts Introduced</th>
            <th className="rationale-col">Rationale</th>
            <th className="note-col">Note</th>
            <th className="actions-col">Actions</th>
          </tr>
        </TableHead>
        <TableBody>
          {introductions.map(intro => (
            <tr key={intro.intro_id}>
              <td>{format(new Date(intro.intro_date), 'MM/yy')}</td>
              <td>{renderContactsCell(intro)}</td>
              <td>
                <RationaleBadge onClick={(e) => handleRationaleClick(intro.intro_id, e)}>
                  {intro.introduction_rationale === 'Karma Points' && (
                    <>🎰 Karma Points</>
                  )}
                  {intro.introduction_rationale === 'Dealflow Related' && (
                    <>🌈 Dealflow</>
                  )}
                  {intro.introduction_rationale === 'Portfolio Company Related' && (
                    <>🤑 Portfolio</>
                  )}
                  
                  {activeRationaleDropdown === intro.intro_id && (
                    <RationaleDropdown onClick={(e) => e.stopPropagation()}>
                      <RationaleOption 
                        onClick={() => handleRationaleChange(intro.intro_id, 'Karma Points')}
                      >
                        🎰 Karma Points
                      </RationaleOption>
                      <RationaleOption 
                        onClick={() => handleRationaleChange(intro.intro_id, 'Dealflow Related')}
                      >
                        🌈 Dealflow
                      </RationaleOption>
                      <RationaleOption 
                        onClick={() => handleRationaleChange(intro.intro_id, 'Portfolio Company Related')}
                      >
                        🤑 Portfolio
                      </RationaleOption>
                    </RationaleDropdown>
                  )}
                </RationaleBadge>
              </td>
              <td>{renderNote(intro)}</td>
              <td>
                <DeleteButton 
                  confirm={deletingIntro === intro.intro_id}
                  onClick={() => handleDeleteClick(intro.intro_id)}
                >
                  {deletingIntro === intro.intro_id ? 'Confirm' : 'Delete'}
                </DeleteButton>
              </td>
            </tr>
          ))}
        </TableBody>
      </IntroductionsTable>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={modalStyles}
        contentLabel="New Introduction"
      >
        <ModalContent>
          <h2 style={{ marginBottom: '24px' }}>New Introduction</h2>
          <form onSubmit={handleSubmit} onKeyDown={handleModalKeyDown}>
            <FormGroup>
              <label>Date</label>
              <div style={{ height: '38px' }}>
                <input
                  type="date"
                  value={formData.intro_date}
                  onChange={(e) => setFormData({ ...formData, intro_date: e.target.value })}
                  required
                  style={{ 
                    width: '100%',
                    height: '38px',
                    padding: '2px 8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </FormGroup>

            <FormGroup>
              <label>Contacts</label>
              <Select
                isMulti
                value={contacts
                  .filter(contact => formData.contacts_introduced.includes(contact.id))
                  .map(contact => ({
                    value: contact.id,
                    label: `${contact.first_name} ${contact.last_name}`
                  }))}
                options={contacts.map(contact => ({
                  value: contact.id,
                  label: `${contact.first_name} ${contact.last_name}`
                }))}
                onChange={(selected) => setFormData({
                  ...formData,
                  contacts_introduced: selected ? selected.map(option => option.value) : []
                })}
              />
            </FormGroup>

            <FormGroup>
              <label>Rationale</label>
              <Select
                value={rationaleOptions.find(option => option.value === formData.introduction_rationale)}
                options={rationaleOptions}
                onChange={(selected) => setFormData({
                  ...formData,
                  introduction_rationale: selected ? selected.value : ''
                })}
              />
            </FormGroup>

            <FormGroup>
              <label>Note</label>
              <textarea
                value={formData.introduction_note}
                onChange={(e) => setFormData({ ...formData, introduction_note: e.target.value })}
                placeholder="Add any relevant notes about this introduction..."
              />
            </FormGroup>

            <ButtonGroup>
              <Button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                style={{ backgroundColor: '#6b7280' }}
              >
                Cancel (Esc)
              </Button>
              <Button 
                type="submit"
                disabled={!formData.contacts_introduced.length || !formData.introduction_rationale}
                style={{ backgroundColor: '#000000' }}
              >
                Create Introduction (Enter)
              </Button>
            </ButtonGroup>
            <div style={{ 
              marginTop: '15px', 
              fontSize: '0.75rem', 
              color: '#6b7280',
              textAlign: 'center' 
            }}>
              Tip: Press Enter to submit, Esc to cancel
            </div>
          </form>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        style={modalStyles}
        contentLabel="Edit Introduction"
      >
        <ModalContent>
          <h2 style={{ marginBottom: '24px' }}>Edit Introduction</h2>
          <form onSubmit={handleUpdate}>
            <FormGroup>
              <label>Date</label>
              <input
                type="date"
                value={formData.intro_date}
                onChange={(e) => setFormData({ ...formData, intro_date: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Contacts</label>
              <Select
                isMulti
                value={contacts
                  .filter(contact => formData.contacts_introduced.includes(contact.id))
                  .map(contact => ({
                    value: contact.id,
                    label: `${contact.first_name} ${contact.last_name}`
                  }))}
                options={contacts.map(contact => ({
                  value: contact.id,
                  label: `${contact.first_name} ${contact.last_name}`
                }))}
                onChange={(selected) => {
                  const newContacts = selected ? selected.map(option => option.value) : [];
                  if (newContacts.length < 2) {
                    alert('An introduction must have at least 2 contacts');
                    return;
                  }
                  setFormData({
                    ...formData,
                    contacts_introduced: newContacts
                  });
                }}
              />
            </FormGroup>

            <FormGroup>
              <label>Rationale</label>
              <Select
                value={rationaleOptions.find(option => option.value === formData.introduction_rationale)}
                options={rationaleOptions}
                onChange={(selected) => setFormData({
                  ...formData,
                  introduction_rationale: selected ? selected.value : ''
                })}
              />
            </FormGroup>

            <FormGroup>
              <label>Note</label>
              <textarea
                value={formData.introduction_note}
                onChange={(e) => setFormData({ ...formData, introduction_note: e.target.value })}
                placeholder="Add any relevant notes about this introduction..."
              />
            </FormGroup>

            <ButtonGroup>
              <Button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                style={{ backgroundColor: '#6b7280' }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!formData.contacts_introduced.length || !formData.introduction_rationale}
                style={{ backgroundColor: '#000000' }}
              >
                Update Introduction
              </Button>
            </ButtonGroup>
          </form>
        </ModalContent>
      </Modal>

      {/* Add ContactsModal */}
      {isContactModalOpen && selectedContact && (
        <ContactsModal
          isOpen={isContactModalOpen}
          onRequestClose={() => {
            setIsContactModalOpen(false);
            setSelectedContact(null);
            fetchData(); // Refresh data after modal closes
          }}
          contact={selectedContact}
        />
      )}
    </PageContainer>
  );
};

export default Introductions; 