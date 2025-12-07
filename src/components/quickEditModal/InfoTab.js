import React, { useState } from 'react';
import { FaStar, FaMagic } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import {
  FormGroup,
  Label,
  Input,
  Select,
  Textarea,
  ScoreContainer
} from './StyledComponents';

const InfoTab = ({
  contact,
  linkedin,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  category,
  setCategory,
  score,
  setScore,
  description,
  setDescription,
  theme,
  shouldShowField,
  categoryOptions = [
    'Not Set',
    'Advisor',
    'Client',
    'Colleague',
    'Corporation',
    'Founder',
    'Friend and Family',
    'Inbox',
    'Institution',
    'Manager',
    'Media',
    'Other',
    'Professional Investor',
    'Service Provider',
    'Skip',
    'SME',
    'Student',
    'Supplier',
    'Team',
    'WhatsApp Group Contact'
  ]
}) => {
  const [fetchingAbout, setFetchingAbout] = useState(false);

  // Fetch LinkedIn About section from Apollo
  const handleFetchAbout = async () => {
    if (!linkedin || !contact?.contact_id) {
      toast.error('LinkedIn URL is required');
      return;
    }

    setFetchingAbout(true);

    try {
      const { data, error } = await supabase.functions.invoke('apollo-about', {
        body: {
          contactId: contact.contact_id,
          linkedinUrl: linkedin
        }
      });

      if (error) throw error;

      if (data?.success && data?.aboutText) {
        setDescription(data.aboutText);
        toast.success('LinkedIn About section fetched successfully');
      } else {
        toast.error(data?.message || 'No About section found');
      }
    } catch (error) {
      console.error('Error fetching LinkedIn About:', error);
      toast.error('Failed to fetch About section from Apollo');
    } finally {
      setFetchingAbout(false);
    }
  };

  return (
    <>
      {/* First Name */}
      {shouldShowField('first_name') && (
        <FormGroup>
          <Label theme={theme}>First Name</Label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name..."
            theme={theme}
          />
        </FormGroup>
      )}

      {/* Last Name */}
      {shouldShowField('last_name') && (
        <FormGroup>
          <Label theme={theme}>Last Name</Label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name..."
            theme={theme}
          />
        </FormGroup>
      )}

      {/* Category */}
      {shouldShowField('category') && (
        <FormGroup>
          <Label theme={theme}>Category</Label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            theme={theme}
          >
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </FormGroup>
      )}

      {/* Score Rating */}
      {shouldShowField('score') && (
        <FormGroup>
          <Label theme={theme}>Score Rating</Label>
          <ScoreContainer theme={theme}>
            {[1, 2, 3, 4, 5].map(star => (
              <FaStar
                key={star}
                onClick={() => setScore(star)}
                style={{
                  fontSize: '24px',
                  color: star <= score ? '#FCD34D' : '#E5E7EB',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  filter: star <= score ? 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.4))' : 'none'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2) rotate(-10deg)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1) rotate(0deg)'}
              />
            ))}
            <span style={{
              marginLeft: '12px',
              fontSize: '14px',
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
              {score > 0 ? `${score}/5` : 'Not rated'}
            </span>
          </ScoreContainer>
        </FormGroup>
      )}

      {/* Description */}
      {shouldShowField('description') && (
        <FormGroup>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Label theme={theme} style={{ margin: 0 }}>Description / Notes</Label>
            {linkedin && (
              <button
                onClick={handleFetchAbout}
                disabled={fetchingAbout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  background: fetchingAbout ? '#9CA3AF' : '#8B5CF6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: fetchingAbout ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!fetchingAbout) {
                    e.target.style.background = '#7C3AED';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!fetchingAbout) {
                    e.target.style.background = '#8B5CF6';
                  }
                }}
                title="Fetch profile data from Apollo"
              >
                <FaMagic size={10} />
                {fetchingAbout ? 'Fetching...' : 'Apollo About'}
              </button>
            )}
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description or notes..."
            rows={4}
            theme={theme}
          />
        </FormGroup>
      )}
    </>
  );
};

export default InfoTab;