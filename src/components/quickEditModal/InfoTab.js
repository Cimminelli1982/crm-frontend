import React from 'react';
import { FaStar } from 'react-icons/fa';
import {
  FormGroup,
  Label,
  Input,
  Select,
  Textarea,
  ScoreContainer
} from './StyledComponents';

const InfoTab = ({
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
    'Corporation',
    'Founder',
    'Friend',
    'Inbox',
    'Institution',
    'Investor',
    'Media',
    'Professional Investor',
    'Service Provider',
    'Skip',
    'SME'
  ]
}) => {
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
          <Label theme={theme}>Description / Notes</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description or notes..."
            rows={2}
            theme={theme}
          />
        </FormGroup>
      )}
    </>
  );
};

export default InfoTab;