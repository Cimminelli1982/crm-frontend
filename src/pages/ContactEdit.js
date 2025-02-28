// src/pages/ContactEdit.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';

const FormContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
`;

const SaveButton = styled(Button)`
  background-color: #0070f3;
  color: white;
  border: none;
  
  &:hover {
    background-color: #0060df;
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const ContactEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    email2: '',
    email3: '',
    mobile: '',
    contact_category: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchContact(id);
    } else {
      setLoading(false);
    }
  }, [id]);
  
  async function fetchContact(contactId) {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
        
      if (error) {
        console.error('Error fetching contact:', error);
      } else {
        setContact(data || {});
      }
    } catch (error) {
      console.error('Exception fetching contact:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function handleChange(e) {
    const { name, value } = e.target;
    setContact(prev => ({
      ...prev,
      [name]: value
    }));
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id);
        
      if (error) {
        console.error('Error updating contact:', error);
        alert('Error updating contact');
      } else {
        navigate('/contacts');
      }
    } catch (error) {
      console.error('Exception updating contact:', error);
      alert('Error updating contact');
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) {
    return (
      <Layout>
        <h1>Edit Contact</h1>
        <p>Loading contact details...</p>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <h1>Edit Contact</h1>
      
      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={contact.first_name || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={contact.last_name || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email">Primary Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={contact.email || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email2">Secondary Email</Label>
            <Input
              id="email2"
              name="email2"
              type="email"
              value={contact.email2 || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email3">Additional Email</Label>
            <Input
              id="email3"
              name="email3"
              type="email"
              value={contact.email3 || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              name="mobile"
              value={contact.mobile || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="contact_category">Category</Label>
            <Select
              id="contact_category"
              name="contact_category"
              value={contact.contact_category || ''}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              <option value="Customer">Customer</option>
              <option value="Lead">Lead</option>
              <option value="Partner">Partner</option>
              <option value="Vendor">Vendor</option>
              <option value="Skip">Skip</option>
            </Select>
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={() => navigate('/contacts')}>
              Cancel
            </CancelButton>
            <SaveButton type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </SaveButton>
          </ButtonGroup>
        </Form>
      </FormContainer>
    </Layout>
  );
};

export default ContactEdit;
