// src/pages/contacts/DuplicateManager.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiRefreshCw, FiEdit } from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 20px 40px 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h1`
  color: #00ff00;
  margin: 0;
  font-family: 'Courier New', monospace;
`;

const ActionButton = styled.button`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  
  &:hover {
    background-color: #333;
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: #00ff00;
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 70, 70, 0.2);
  border: 1px solid #ff4646;
  color: #ff9999;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DuplicateList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
`;

const DuplicateItem = styled.div`
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  background-color: #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background-color: #333;
  }
`;

const DuplicateDetails = styled.div`
  flex: 1;
`;

const DuplicateName = styled.h3`
  margin: 0 0 8px 0;
  color: #00ff00;
`;

const DuplicateDate = styled.div`
  color: #999;
  font-size: 0.85rem;
`;

const DuplicateNote = styled.div`
  margin-top: 5px;
  font-style: italic;
  color: #ccc;
`;

const NoData = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
`;

const DuplicateManager = () => {
  const navigate = useNavigate();
  
  // State
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load duplicates list
  useEffect(() => {
    loadDuplicates();
  }, []);
  
  const loadDuplicates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simple query to get all duplicates
      const { data, error } = await supabase
        .from('contact_duplicates')
        .select(`
          duplicate_id,
          primary_contact_id,
          duplicate_contact_id,
          detected_at,
          notes,
          status,
          primary_contact:contacts!primary_contact_id(first_name, last_name),
          duplicate_contact:contacts!duplicate_contact_id(first_name, last_name)
        `)
        .order('detected_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter duplicates to only include those with exactly matching first and last names
      const exactMatches = data ? data.filter(duplicate => {
        const primary = duplicate.primary_contact || {};
        const dup = duplicate.duplicate_contact || {};
        
        // Check if both first_name and last_name match exactly (ignoring case)
        return (
          primary.first_name && 
          dup.first_name && 
          primary.last_name && 
          dup.last_name && 
          primary.first_name.toLowerCase() === dup.first_name.toLowerCase() && 
          primary.last_name.toLowerCase() === dup.last_name.toLowerCase()
        );
      }) : [];
      
      setDuplicates(exactMatches);
      
    } catch (err) {
      console.error('Error loading duplicates:', err);
      setError('Failed to load duplicate contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open the ContactCrmWorkflow page for a duplicate
  const handleDuplicateClick = (duplicate) => {
    // Store the contact_id in session storage for the workflow
    sessionStorage.setItem('workflow_contact_id', duplicate.primary_contact_id);
    
    // Navigate to the ContactCrmWorkflow page
    navigate(`/contacts/workflow/${duplicate.primary_contact_id}`);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };
  
  if (loading) {
    return (
      <Container>
        <LoadingScreen>
          <div>Loading duplicates...</div>
        </LoadingScreen>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <ActionButton onClick={loadDuplicates}>
          <FiRefreshCw /> Refresh
        </ActionButton>
      </Header>
      
      {error && (
        <ErrorMessage>
          <FiAlertTriangle />
          <div>{error}</div>
        </ErrorMessage>
      )}
      
      {duplicates.length === 0 ? (
        <NoData>
          No duplicate contacts found
        </NoData>
      ) : (
        <DuplicateList>
          {duplicates.map(duplicate => (
            <DuplicateItem 
              key={duplicate.duplicate_id} 
              onClick={() => handleDuplicateClick(duplicate)}
            >
              <DuplicateDetails>
                <DuplicateName>
                  {duplicate.primary_contact?.first_name || 'Unknown'} {duplicate.primary_contact?.last_name || ''} & {duplicate.duplicate_contact?.first_name || 'Unknown'} {duplicate.duplicate_contact?.last_name || ''}
                </DuplicateName>
                <DuplicateDate>
                  Detected: {formatDate(duplicate.detected_at)}
                </DuplicateDate>
                {duplicate.notes && (
                  <DuplicateNote>
                    {duplicate.notes}
                  </DuplicateNote>
                )}
              </DuplicateDetails>
              <ActionButton onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent item click
                handleDuplicateClick(duplicate);
              }}>
                <FiEdit /> Edit and Match
              </ActionButton>
            </DuplicateItem>
          ))}
        </DuplicateList>
      )}
    </Container>
  );
};

export default DuplicateManager;