import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

// Existing styled components remain unchanged unless specified

const EditButton = styled.span`
  margin-left: 0.5rem;
  cursor: pointer;
  color: #0070f3;
  &:hover {
    color: #0060df;
  }
`;

const EmailButton = styled.span`
  margin-left: 0.5rem;
  cursor: pointer;
  color: #0070f3;
  &:hover {
    color: #0060df;
  }
`;

const RecentContactsList = () => {
  // Existing states remain unchanged
  const [showContactEditModal, setShowContactEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactEditData, setContactEditData] = useState({});

  // Existing useMemo, useCallback, useEffect unchanged unless specified

  const handleOpenContactEdit = useCallback((contact) => {
    setEditingContact(contact);
    setContactEditData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      contact_category: contact.contact_category || '',
      mobile: contact.mobile || '',
      mobile2: contact.mobile2 || '',
      email: contact.email || '',
      email2: contact.email2 || '',
      email3: contact.email3 || '',
      linkedin: contact.linkedin || '',
      keep_in_touch_frequency: contact.keep_in_touch_frequency || ''
    });
    setShowContactEditModal(true);
  }, []);

  const handleContactInputChange = useCallback((field, value) => {
    setContactEditData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSaveContactEdit = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(contactEditData)
        .eq('id', editingContact.id);
      if (error) throw error;
      setContacts(prev => prev.map(c =>
        c.id === editingContact.id ? { ...c, ...contactEditData } : c
      ));
      setShowContactEditModal(false);
      setEditingContact(null);
      setContactEditData({});
    } catch (error) {
      alert('Failed to update contact: ' + error.message);
    }
  }, [editingContact, contactEditData]);

  const handleEditCompany = useCallback((contact) => {
    setCurrentContact(contact);
    setCompanyData({
      name: contact.companies?.name || '',
      website: contact.companies?.website || '',
      category: contact.companies?.category || '',
      city: contact.companies?.city || '',
      nation: contact.companies?.nation || '',
      description: contact.companies?.description || ''
    });
    setShowCompanyModal(true);
  }, []);

  // Existing handleSaveCompany modified to include description
  const handleSaveCompany = useCallback(async () => {
    try {
      let companyId;
      if (currentContact.companies) {
        await supabase
          .from('companies')
          .update(companyData)
          .eq('id', currentContact.companies.id);
        companyId = currentContact.companies.id;
      } else {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();
        companyId = newCompany.id;
      }
      await supabase
        .from('contacts')
        .update({ company_id: companyId })
        .eq('id', currentContact.id);
      fetchData();
      setShowCompanyModal(false);
    } catch (error) {
      alert('Failed to save company');
    }
  }, [companyData, currentContact, fetchData]);

  return (
    <Container style={{ position: 'relative' }}>
      {/* Existing content unchanged */}
      <ContactTable>
        <TableBody>
          {contacts.map(contact => (
            <tr key={contact.id}>
              <td>
                {contact.first_name || contact.last_name ? (
                  contact.linkedin ? (
                    <a 
                      href={contact.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {`${contact.first_name || ''} ${contact.last_name || ''}`}
                    </a>
                  ) : (
                    <a 
                      href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {`${contact.first_name || ''} ${contact.last_name || ''}`}
                    </a>
                  )
                ) : (
                  '-'
                )}
                <EditButton onClick={() => handleOpenContactEdit(contact)}>✎</EditButton>
              </td>
              <td>
                {contact.companies ? (
                  <div>
                    <a 
                      href={contact.companies.website ? 
                        (contact.companies.website.startsWith('http') ? 
                          contact.companies.website : 
                          `https://${contact.companies.website}`) : 
                        '#'
                      } 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {contact.companies.name}
                    </a>
                    <EditButton onClick={() => handleEditCompany(contact)}>✎</EditButton>
                    <UnlinkButton onClick={() => handleUnlinkCompany(contact.id)}>✕</UnlinkButton>
                  </div>
                ) : (
                  <div>
                    <CompanyInput
                      value={companySearchTerm[contact.id] || ''}
                      onChange={(e) => handleCompanySearch(contact.id, e.target.value)}
                      placeholder="Type company name..."
                    />
                    {companySuggestions[contact.id]?.length > 0 && (
                      <CompanyDropdown>
                        {companySuggestions[contact.id].map((company, index) => (
                          <CompanyOption
                            key={index}
                            onClick={() => handleCompanySelect(contact.id, company)}
                          >
                            {company.name}
                          </CompanyOption>
                        ))}
                      </CompanyDropdown>
                    )}
                  </div>
                )}
              </td>
              <td>
                {contact.email ? (
                  <>
                    <a 
                      href={`https://mail.superhuman.com/search/${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {contact.email}
                    </a>
                    <EmailButton>
                      <a href={`mailto:${contact.email}`} target="_blank" rel="noopener noreferrer">✉</a>
                    </EmailButton>
                  </>
                ) : (
                  '-'
                )}
              </td>
              {/* Remaining td elements unchanged */}
            </tr>
          ))}
        </TableBody>
      </ContactTable>
      {/* Existing pagination unchanged */}
      {showContactEditModal && editingContact && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Edit Contact</h2>
              <CloseButton onClick={() => setShowContactEditModal(false)}>×</CloseButton>
            </ModalHeader>
            <MergeForm>
              <FormGroup>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={contactEditData.first_name}
                  onChange={(e) => handleContactInputChange('first_name', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={contactEditData.last_name}
                  onChange={(e) => handleContactInputChange('last_name', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Contact Category</Label>
                <select
                  value={contactEditData.contact_category}
                  onChange={(e) => handleContactInputChange('contact_category', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Category</option>
                  {CONTACT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup>
                <Label>Mobile</Label>
                <Input
                  type="text"
                  value={contactEditData.mobile}
                  onChange={(e) => handleContactInputChange('mobile', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Mobile 2</Label>
                <Input
                  type="text"
                  value={contactEditData.mobile2}
                  onChange={(e) => handleContactInputChange('mobile2', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactEditData.email}
                  onChange={(e) => handleContactInputChange('email', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email 2</Label>
                <Input
                  type="email"
                  value={contactEditData.email2}
                  onChange={(e) => handleContactInputChange('email2', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email 3</Label>
                <Input
                  type="email"
                  value={contactEditData.email3}
                  onChange={(e) => handleContactInputChange('email3', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>LinkedIn</Label>
                <Input
                  type="text"
                  value={contactEditData.linkedin}
                  onChange={(e) => handleContactInputChange('linkedin', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Keep in Touch Frequency</Label>
                <select
                  value={contactEditData.keep_in_touch_frequency}
                  onChange={(e) => handleContactInputChange('keep_in_touch_frequency', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Frequency</option>
                  {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                    <option key={frequency} value={frequency}>{frequency}</option>
                  ))}
                </select>
              </FormGroup>
            </MergeForm>
            <ButtonGroup>
              <Button onClick={() => setShowContactEditModal(false)}>Cancel</Button>
              <Button primary onClick={handleSaveContactEdit}>Save</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
      {showCompanyModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Edit Company</h2>
              <CloseButton onClick={() => setShowCompanyModal(false)}>×</CloseButton>
            </ModalHeader>
            <MergeForm>
              <FormGroup>
                <Label>Company Name</Label>
                <Input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Website</Label>
                <Input
                  type="text"
                  value={companyData.website}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Category</Label>
                <select
                  value={companyData.category}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, category: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Category</option>
                  {COMPANY_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup>
                <Label>City</Label>
                <Input
                  type="text"
                  value={companyData.city}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Nation</Label>
                <Input
                  type="text"
                  value={companyData.nation}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, nation: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={companyData.description}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                />
              </FormGroup>
            </MergeForm>
            <ButtonGroup>
              <Button onClick={() => setShowCompanyModal(false)}>Cancel</Button>
              <Button primary onClick={handleSaveCompany}>Save</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
      {/* Existing merge modal unchanged */}
    </Container>
  );
};

export default RecentContactsList;
