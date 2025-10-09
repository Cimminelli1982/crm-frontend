import React from 'react';
import { FaStar, FaInfoCircle, FaEnvelope, FaBriefcase, FaLink, FaHandshake } from 'react-icons/fa';

// Render star ratings
export const renderScoreStars = (score, size = 'small') => {
  const starSize = size === 'small' ? '12px' : '16px';
  const gap = size === 'small' ? '2px' : '4px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap }}>
      {[1, 2, 3, 4, 5].map(star => (
        <FaStar
          key={star}
          style={{
            fontSize: starSize,
            color: star <= score ? '#F59E0B' : '#D1D5DB'
          }}
        />
      ))}
    </div>
  );
};

// Get contact completeness score from database view
export const getContactCompleteness = (contact) => {
  // The completeness_score should come from the contact_completeness view
  // If it's not available, fallback to a basic calculation
  if (contact.completeness_score !== undefined) {
    return parseInt(contact.completeness_score);
  }

  // Fallback for cases where view data isn't loaded
  return 50; // Default neutral score
};

// Get completeness display info (icon, color, text)
export const getCompletenessDisplay = (completenessScore) => {
  if (completenessScore >= 100) {
    return {
      icon: '⭐',
      color: '#10B981', // Green
      backgroundColor: '#10B981',
      text: 'Perfect',
      title: `${completenessScore}% Complete - Perfect!`
    };
  } else if (completenessScore > 80) {
    return {
      icon: '🟢',
      color: '#34D399', // Lighter green
      backgroundColor: '#34D399',
      text: 'Complete',
      title: `${completenessScore}% Complete - Excellent!`
    };
  } else if (completenessScore > 60) {
    return {
      icon: '🟡',
      color: '#FCD34D', // Yellow
      backgroundColor: '#FCD34D',
      text: 'Good',
      title: `${completenessScore}% Complete - Good`
    };
  } else if (completenessScore > 40) {
    return {
      icon: '🟠',
      color: '#FB923C', // Orange
      backgroundColor: '#FB923C',
      text: 'Fair',
      title: `${completenessScore}% Complete - Needs work`
    };
  } else {
    return {
      icon: '🔴',
      color: '#F87171', // Red
      backgroundColor: '#F87171',
      text: 'Poor',
      title: `${completenessScore}% Complete - Incomplete`
    };
  }
};

// Get contact priority score based on last interaction
export const getContactPriorityScore = (contact) => {
  // Use last_interaction_at if available, otherwise fall back to created_at
  const interactionDate = contact.last_interaction_at || contact.created_at;
  if (!interactionDate) return 9999; // Very high number for contacts with no date

  const lastInteraction = new Date(interactionDate);
  const now = new Date();

  // Reset time to start of day for accurate day calculation
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const interactionDay = new Date(lastInteraction.getFullYear(), lastInteraction.getMonth(), lastInteraction.getDate());

  const daysDiff = Math.floor((today - interactionDay) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff); // Ensure non-negative
};

// Get contact priority label
export const getContactPriorityLabel = (contact, filterCategory = null, badgeType = null) => {
  // For spam contacts, show the spam counter instead of other labels
  if (contact.spam_counter !== undefined) {
    return `${contact.spam_counter}x`;
  }

  // If in Birthday filter, always show the contact category
  if (filterCategory === 'Birthday') {
    return contact.category || 'No Category';
  }

  // If badgeType is 'category', show the contact category
  if (badgeType === 'category') {
    return contact.category || 'No Category';
  }

  // Default to time-based labels
  const daysDiff = getContactPriorityScore(contact);

  if (daysDiff === 0) return 'today';
  if (daysDiff === 1) return 'yesterday';
  if (daysDiff <= 7) return 'this week';
  if (daysDiff <= 30) return 'this month';
  if (daysDiff <= 90) return 'this quarter';
  if (daysDiff <= 365) return 'this year';
  return 'ages ago';
};

// Get visible tabs based on missing fields
export const getVisibleTabs = (contact, showMissingFieldsOnly = false) => {
  if (!contact) return [];

  if (!showMissingFieldsOnly) {
    // Show all tabs in normal mode
    return [
      { id: 'Info', label: 'Info', icon: FaInfoCircle },
      { id: 'Contacts', label: 'Contacts', icon: FaEnvelope },
      { id: 'Work', label: 'Work', icon: FaBriefcase },
      { id: 'Related', label: 'Related', icon: FaLink },
      { id: 'Keep in touch', label: 'Keep in touch', icon: FaHandshake }
    ];
  }

  // In missing fields mode, only show tabs with missing data
  const missingFields = getMissingFields(contact);
  const tabs = [];

  if (missingFields.info.length > 0) tabs.push({ id: 'Info', label: 'Info', icon: FaInfoCircle });
  if (missingFields.contacts.length > 0) tabs.push({ id: 'Contacts', label: 'Contacts', icon: FaEnvelope });
  if (missingFields.work.length > 0) tabs.push({ id: 'Work', label: 'Work', icon: FaBriefcase });
  if (missingFields.related.length > 0) tabs.push({ id: 'Related', label: 'Related', icon: FaLink });
  if (missingFields.keepInTouch.length > 0) tabs.push({ id: 'Keep in touch', label: 'Keep in touch', icon: FaHandshake });

  return tabs;
};

// Check if a field should be shown based on missing data
export const shouldShowField = (contact, fieldName, showMissingFieldsOnly = false) => {
  if (!contact || !showMissingFieldsOnly) return true;

  // Direct field checking - show field if it's missing/empty
  switch (fieldName) {
    case 'first_name': return !contact.first_name || !contact.first_name.trim();
    case 'last_name': return !contact.last_name || !contact.last_name.trim();
    case 'category': return !contact.category || contact.category === 'Not Set';
    case 'score': return !contact.score || contact.score <= 0;
    case 'description': return !contact.description || !contact.description.trim();
    case 'job_role': return !contact.job_role || !contact.job_role.trim();
    case 'linkedin': return !contact.linkedin || !contact.linkedin.trim();
    case 'email': return contact.contact_emails !== undefined && (!contact.contact_emails || contact.contact_emails.length === 0);
    case 'mobile': return contact.contact_mobiles !== undefined && (!contact.contact_mobiles || contact.contact_mobiles.length === 0);
    case 'company': return !contact.companies || contact.companies.length === 0;
    case 'cities': return contact.contact_cities !== undefined && (!contact.contact_cities || contact.contact_cities.length === 0);
    case 'tags': return contact.contact_tags !== undefined && (!contact.contact_tags || contact.contact_tags.length === 0);
    case 'birthday': return !contact.birthday || !contact.birthday.trim();
    case 'keep_in_touch_frequency': return !contact.keep_in_touch_frequency || contact.keep_in_touch_frequency === 'Not Set';
    case 'christmas': return !contact.christmas || contact.christmas === 'no wishes set';
    case 'easter': return !contact.easter || contact.easter === 'no wishes set';
    case 'age_estimate': return !contact.age_estimate || contact.age_estimate <= 0;
    default: return true;
  }
};

// Get missing fields for a contact
export const getMissingFields = (contact) => {
  if (!contact) return {
    info: [],
    contacts: [],
    work: [],
    related: [],
    keepInTouch: []
  };

  const missing = {
    info: [],
    contacts: [],
    work: [],
    related: [],
    keepInTouch: []
  };

  // Info tab missing fields - exactly match the scoring logic
  if (!contact.first_name || !contact.first_name.trim()) missing.info.push('first_name');
  if (!contact.last_name || !contact.last_name.trim()) missing.info.push('last_name');
  if (!contact.category) missing.info.push('category');
  if (!contact.score || contact.score <= 0) missing.info.push('score');
  if (!contact.description || !contact.description.trim()) missing.info.push('description');

  // Work tab fields
  if (!contact.job_role || !contact.job_role.trim()) missing.work.push('job_role');
  if (!contact.linkedin || !contact.linkedin.trim()) missing.work.push('linkedin');

  // Contacts tab - check if contact has emails/mobiles arrays
  if (!contact.contact_emails || contact.contact_emails.length === 0) missing.contacts.push('email');
  if (!contact.contact_mobiles || contact.contact_mobiles.length === 0) missing.contacts.push('mobile');

  // Work tab - check if contact has companies
  if (!contact.companies || contact.companies.length === 0) missing.work.push('company');

  // Related tab - only check if arrays are explicitly empty (not undefined/not loaded)
  // We can't assume undefined means missing since it might just not be loaded
  if (contact.contact_cities !== undefined && (!contact.contact_cities || contact.contact_cities.length === 0)) missing.related.push('cities');
  if (contact.contact_tags !== undefined && (!contact.contact_tags || contact.contact_tags.length === 0)) missing.related.push('tags');

  // Keep in Touch tab - check actual values (including birthday which is in this tab)
  if (!contact.birthday) missing.keepInTouch.push('birthday');
  if (!contact.keep_in_touch_frequency && !contact.kit_frequency) missing.keepInTouch.push('frequency');
  if (!contact.christmas) missing.keepInTouch.push('christmas');
  if (!contact.easter) missing.keepInTouch.push('easter');

  return missing;
};