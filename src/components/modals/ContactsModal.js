import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiSave, FiPlus, FiSearch, FiX as FiXCircle, FiTag, FiLink } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import TagsModal from './TagsModal';
import CompanyModal from './CompanyModal';

// Define Contact Categories with the specified options
const ContactCategories = [
  'Founder', 
  'Professional Investor', 
  'Advisor', 
  'Team', 
  'Friend and Family', 
  'Manager', 
  'Institution', 
  'Media', 
  'Student', 
  'Supplier', 
  'Skip'
];

// Styled Components with improved styling and consistency
const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  
  .header-content {
    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #111827;
      font-weight: 600;
      line-height: 1.3;
    }
    
    .dates {
      margin-top: 6px;
      font-size: 0.813rem;
      color: #6b7280;
      
      span {
        margin-right: 20px;
        display: inline-block;
      }
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const TabButton = styled.button`
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#007BFF' : 'transparent'};
  color: ${props => props.active ? '#007BFF' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 0.938rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.active ? '#007BFF' : '#1f2937'};
  }
  
  &:disabled {
    color: #9ca3af;
    font-style: italic;
    cursor: not-allowed;
  }
`;

const ContentSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
`;

const FormContent = styled.div`
  width: 90%;
  margin: 0 auto;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 40px;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  color: #111827;
  margin: 32px 0 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  
  &.full-width {
    grid-column: span 3;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  line-height: 24px;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }

  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  line-height: 24px;
  
  /* Custom styling to ensure consistent appearance */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  
  /* Custom dropdown arrow */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }
  
  &::-ms-expand {
    display: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 90%;
  margin: 0 auto;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
`;

const SaveButton = styled(Button)`
  background-color: #007BFF;
  color: white;
  border: none;
  
  &:hover {
    background-color: #0069d9;
  }
`;

// Add new styled components for tags and companies
const TagsContainer = styled.div`
  position: relative;
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#374151'};
  border-radius: 16px;
  font-size: 0.875rem;
  gap: 6px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  button {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  padding-right: 30px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;

  &:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SuggestionList = styled.div`
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #111827;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const NewItemButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background-color: #f3f4f6;
  cursor: pointer;
  font-size: 0.875rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e5e7eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const CompanyItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: #f9fafb;
  border-radius: 4px;
  border-left: 4px solid ${props => props.color || '#3b82f6'};

  .company-info {
    flex: 1;
    overflow: hidden;
    
    h4 {
      margin: 0 0 2px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    p {
      margin: 0;
      font-size: 0.75rem;
      color: #6b7280;
    }
  }

  button {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: #ef4444;
    }
  }
`;

// Helper function to get a color for a tag based on its name
const getTagColor = (tagName) => {
  const colors = [
    { bg: '#fee2e2', text: '#b91c1c' }, // Red
    { bg: '#fef3c7', text: '#92400e' }, // Amber
    { bg: '#ecfccb', text: '#3f6212' }, // Lime
    { bg: '#d1fae5', text: '#065f46' }, // Emerald
    { bg: '#e0f2fe', text: '#0369a1' }, // Sky
    { bg: '#ede9fe', text: '#5b21b6' }, // Violet
    { bg: '#fae8ff', text: '#86198f' }, // Fuchsia
    { bg: '#fce7f3', text: '#9d174d' }  // Pink
  ];
  
  let sum = 0;
  for (let i = 0; i < tagName.length; i++) {
    sum += tagName.charCodeAt(i);
  }
  
  const colorIndex = sum % colors.length;
  return colors[colorIndex];
};

// Helper function to get a color for a company
const getCompanyColor = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']; 
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

// Update the styling for buttons
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  svg {
    color: #6b7280;
    font-size: 14px;
  }
`;

const ContactsModal = ({ isOpen, onRequestClose, contact }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    email2: '',
    email3: '',
    mobile: '',
    mobile2: '',
    job_title: '',
    contact_category: '',
    about_the_contact: '',
    linkedin: ''
  });
  
  // State for tags and companies
  const [contactTags, setContactTags] = useState([]);
  const [relatedCompanies, setRelatedCompanies] = useState([]);
  
  // State for external modals
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  
  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        email2: contact.email2 || '',
        email3: contact.email3 || '',
        mobile: contact.mobile || '',
        mobile2: contact.mobile2 || '',
        job_title: contact.job_title || '',
        contact_category: contact.contact_category || '',
        about_the_contact: contact.about_the_contact || '',
        linkedin: contact.linkedin || ''
      });
      
      // Fetch tags and companies when contact changes
      fetchContactTags();
      fetchRelatedCompanies();
    }
  }, [contact]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Tags functionality
  const fetchContactTags = async () => {
    if (!contact || !contact.id) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select(`
          tag_id,
          tags:tag_id(id, name)
        `)
        .eq('contact_id', contact.id);
        
      if (error) throw error;
      
      const formattedTags = data.map(item => ({
        id: item.tag_id,
        name: item.tags.name
      }));
      
      setContactTags(formattedTags);
    } catch (error) {
      console.error('Error fetching contact tags:', error);
    }
  };
  
  const handleRemoveTag = async (tagToRemove) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact.id)
        .eq('tag_id', tagToRemove.id);
        
      if (error) throw error;
      
      setContactTags(prev => prev.filter(tag => tag.id !== tagToRemove.id));
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };
  
  // Companies functionality
  const fetchRelatedCompanies = async () => {
    if (!contact || !contact.id) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          company_id,
          companies:company_id(id, name, website, category)
        `)
        .eq('contact_id', contact.id);
        
      if (error) throw error;
      
      const formattedCompanies = data.map(item => ({
        id: item.company_id,
        name: item.companies.name,
        website: item.companies.website,
        category: item.companies.category
      }));
      
      setRelatedCompanies(formattedCompanies);
    } catch (error) {
      console.error('Error fetching related companies:', error);
    }
  };
  
  const handleRemoveCompany = async (companyToRemove) => {
    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_id', contact.id)
        .eq('company_id', companyToRemove.id);
        
      if (error) throw error;
      
      setRelatedCompanies(prev => prev.filter(company => company.id !== companyToRemove.id));
    } catch (error) {
      console.error('Error removing company:', error);
    }
  };
  
  // Modal handlers
  const handleOpenTagsModal = () => {
    setShowTagsModal(true);
  };
  
  const handleCloseTagsModal = () => {
    setShowTagsModal(false);
    fetchContactTags(); // Refresh tags after modal closes
  };
  
  const handleOpenCompanyModal = () => {
    setShowCompanyModal(true);
  };
  
  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    fetchRelatedCompanies(); // Refresh companies after modal closes
  };
  
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          email2: formData.email2,
          email3: formData.email3,
          mobile: formData.mobile,
          mobile2: formData.mobile2,
          job_title: formData.job_title,
          contact_category: formData.contact_category,
          about_the_contact: formData.about_the_contact,
          linkedin: formData.linkedin,
          last_modified: new Date()
        })
        .eq('id', contact.id);
        
      if (error) throw error;
      
      onRequestClose();
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Failed to update contact. Please try again.');
    }
  };
  
  const renderAboutTab = () => {
    return (
      <FormContent>
        <SectionTitle>Contact Information</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter first name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Enter last name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              placeholder="Enter job title"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="contact_category">Main Category</Label>
            <Select
              id="contact_category"
              name="contact_category"
              value={formData.contact_category}
              onChange={handleInputChange}
            >
              <option value="">Select Category</option>
              {ContactCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Keywords</Label>
            <TagsList>
              {contactTags.map((tag) => {
                const { bg, text } = getTagColor(tag.name);
                return (
                  <Tag key={tag.id} color={bg} textColor={text}>
                    <span>{tag.name}</span>
                    <button onClick={() => handleRemoveTag(tag)}>
                      <FiX size={14} />
                    </button>
                  </Tag>
                );
              })}
            </TagsList>
            <ActionButton onClick={handleOpenTagsModal}>
              <FiTag size={14} /> Manage Tags
            </ActionButton>
          </FormGroup>
          
          <FormGroup>
            <Label>Related Companies</Label>
            <CompanyList>
              {relatedCompanies.map((company) => (
                <CompanyItem key={company.id} color={getCompanyColor()}>
                  <div className="company-info">
                    <h4>{company.name}</h4>
                    <p>{company.category}</p>
                  </div>
                  <button onClick={() => handleRemoveCompany(company)}>
                    <FiX size={16} />
                  </button>
                </CompanyItem>
              ))}
            </CompanyList>
            <ActionButton onClick={handleOpenCompanyModal}>
              <FiLink size={14} /> Manage Companies
            </ActionButton>
          </FormGroup>
        </FormGrid>
        
        <SectionTitle>Contact Details</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="text"
              name="linkedin"
              value={formData.linkedin || ''}
              onChange={handleInputChange}
              placeholder="https://www.linkedin.com/in/username"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              placeholder="+447597685011"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="mobile2">Mobile 2</Label>
            <Input
              id="mobile2"
              type="tel"
              name="mobile2"
              value={formData.mobile2}
              onChange={handleInputChange}
              placeholder="+447597685011"
            />
          </FormGroup>
        </FormGrid>
        
        <FormGrid>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email2">Email 2</Label>
            <Input
              id="email2"
              type="email"
              name="email2"
              value={formData.email2}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email3">Email 3</Label>
            <Input
              id="email3"
              type="email"
              name="email3"
              value={formData.email3}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </FormGroup>
        </FormGrid>
        
        <SectionTitle>Additional Information</SectionTitle>
        <FormGrid>
          <FormGroup className="full-width">
            <Label htmlFor="about_the_contact">About the Contact</Label>
            <TextArea
              id="about_the_contact"
              name="about_the_contact"
              value={formData.about_the_contact}
              onChange={handleInputChange}
              placeholder="Enter notes and details about this contact..."
            />
          </FormGroup>
        </FormGrid>
      </FormContent>
    );
  };
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '24px',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: '75%',
            maxHeight: '85vh',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <ModalContainer>
          <ModalHeader>
            <div className="header-content">
              <h2>{`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'}</h2>
              <div className="dates">
                <span>Created: {formatDate(contact.created_at)}</span>
                <span>Last Modified: {formatDate(contact.last_modified)}</span>
              </div>
            </div>
            <CloseButton onClick={onRequestClose} aria-label="Close modal">
              <FiX size={20} />
            </CloseButton>
          </ModalHeader>
          
          <TabsContainer>
            <TabButton 
              active={activeTab === 'about'} 
              onClick={() => setActiveTab('about')}
            >
              About
            </TabButton>
            <TabButton 
              active={activeTab === 'intros'} 
              onClick={() => setActiveTab('intros')}
              disabled
            >
              Intros (Coming Soon)
            </TabButton>
            <TabButton 
              active={activeTab === 'deals'} 
              onClick={() => setActiveTab('deals')}
              disabled
            >
              Deals (Coming Soon)
            </TabButton>
            <TabButton 
              active={activeTab === 'notes'} 
              onClick={() => setActiveTab('notes')}
              disabled
            >
              Notes (Coming Soon)
            </TabButton>
          </TabsContainer>
          
          <ContentSection>
            {activeTab === 'about' && renderAboutTab()}
            {activeTab === 'intros' && <div>Intros tab content coming soon</div>}
            {activeTab === 'deals' && <div>Deals tab content coming soon</div>}
            {activeTab === 'notes' && <div>Notes tab content coming soon</div>}
          </ContentSection>
          
          <ButtonContainer>
            <CancelButton onClick={onRequestClose}>
              Cancel
            </CancelButton>
            <SaveButton onClick={handleSave}>
              <FiSave size={16} />
              Save Changes
            </SaveButton>
          </ButtonContainer>
        </ModalContainer>
      </Modal>
      
      {/* External modals */}
      {showTagsModal && (
        <TagsModal 
          isOpen={showTagsModal}
          onRequestClose={handleCloseTagsModal}
          contact={contact}
        />
      )}
      
      {showCompanyModal && (
        <CompanyModal
          isOpen={showCompanyModal}
          onRequestClose={handleCloseCompanyModal}
          contact={contact}
        />
      )}
    </>
  );
};

export default ContactsModal; 