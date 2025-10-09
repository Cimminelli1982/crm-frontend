// Custom hook for Keep in Touch functionality
export const useKeepInTouch = () => {
  // Format days until next contact
  const formatDaysUntilNext = (daysUntilNext, contact = null) => {
    if (daysUntilNext === null || daysUntilNext === undefined) {
      // Check if this is a birthday contact
      if (contact?.days_until_birthday !== undefined) {
        return formatBirthdayCountdown(contact.days_until_birthday, contact);
      }
      return '';
    }

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else {
      return `Due in ${days} days`;
    }
  };

  // Format birthday countdown with age info
  const formatBirthdayCountdown = (daysUntilBirthday, contact = null) => {
    const days = parseInt(daysUntilBirthday);
    const ageInfo = contact?.turning_age ? ` (turning ${contact.turning_age})` : '';

    if (days === 0) {
      return `🎉 Birthday today${ageInfo}!`;
    } else if (days === 1) {
      return `🎂 Birthday tomorrow${ageInfo}!`;
    } else if (days <= 7) {
      return `🎈 Birthday in ${days} days${ageInfo}`;
    } else if (days <= 30) {
      return `🎁 Birthday in ${days} days${ageInfo}`;
    } else {
      return `🎂 Birthday in ${days} days${ageInfo}`;
    }
  };

  // Get urgency color based on days until next contact
  const getUrgencyColor = (daysUntilNext, theme, contact = null) => {
    // Handle birthday coloring
    if (contact?.days_until_birthday !== undefined) {
      const days = parseInt(contact.days_until_birthday);
      if (days === 0) {
        return '#EF4444'; // Red for birthday today
      } else if (days <= 7) {
        return '#F59E0B'; // Amber for birthday this week
      } else {
        return '#10B981'; // Green for birthday coming up
      }
    }

    if (daysUntilNext === null || daysUntilNext === undefined) {
      return theme === 'light' ? '#6B7280' : '#9CA3AF';
    }

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return '#EF4444'; // Red for overdue
    } else if (days <= 7) {
      return '#F59E0B'; // Amber for due soon
    } else {
      return '#10B981'; // Green for coming up
    }
  };

  // Format frequency text
  const formatFrequency = (frequency) => {
    if (!frequency) return '';
    return frequency.replace(/([A-Z])/g, ' $1').trim();
  };

  // Check keep in touch data completeness status using 4 fields
  const getKeepInTouchStatus = (contact) => {
    // Check 4 fields: birthday (contacts), frequency, christmas, easter (keep_in_touch)
    const hasBirthday = !!(contact.birthday && contact.birthday !== null);
    const hasFrequency = !!(contact.keep_in_touch_frequency &&
                        contact.keep_in_touch_frequency !== 'Not Set');
    const hasChristmas = !!(contact.christmas &&
                        contact.christmas !== 'no wishes set');
    const hasEaster = !!(contact.easter &&
                     contact.easter !== 'no wishes set');

    const filledFields = [hasBirthday, hasFrequency, hasChristmas, hasEaster].filter(Boolean).length;

    // All 4 fields filled = heart
    if (filledFields === 4) {
      return 'complete';
    }
    // Only birthday missing = birthday cake
    if (!hasBirthday && hasFrequency && hasChristmas && hasEaster) {
      return 'missing_birthday';
    }
    // Everything else = incomplete
    return 'incomplete';
  };

  // Enhanced status check that considers christmas/easter wishes
  // This properly checks all fields including wishes from keep_in_touch table
  const getEnhancedKeepInTouchStatus = (contact, keepInTouchRecord = null) => {
    // Frequency complete: NOT NULL AND NOT "Not Set"
    const hasFrequency = contact.keep_in_touch_frequency &&
                        contact.keep_in_touch_frequency !== 'Not Set';

    // Birthday complete: NOT NULL AND NOT empty
    const hasBirthday = contact.birthday && contact.birthday.trim() !== '';

    // Christmas wishes complete: NOT NULL AND NOT "no wishes set"
    const hasChristmasWishes = keepInTouchRecord?.christmas &&
                              keepInTouchRecord.christmas !== 'no wishes set';

    // Easter wishes complete: NOT NULL AND NOT "no wishes set"
    const hasEasterWishes = keepInTouchRecord?.easter &&
                           keepInTouchRecord.easter !== 'no wishes set';

    const filledFields = [hasFrequency, hasBirthday, hasChristmasWishes, hasEasterWishes]
                        .filter(Boolean).length;

    // All 4 fields filled
    if (filledFields === 4) {
      return 'complete';
    }
    // Only birthday missing
    if (!hasBirthday && hasFrequency && hasChristmasWishes && hasEasterWishes) {
      return 'missing_birthday';
    }
    // Everything else is incomplete
    return 'incomplete';
  };

  // Get icon and styling based on status
  const getKeepInTouchDisplay = (contact) => {
    // Use basic status for now - could be enhanced to load keep_in_touch data for each contact
    // but that would be expensive. For now, we'll be conservative:
    // Only show 'complete' (thumbs up) if we're certain all data is present
    const status = getKeepInTouchStatus(contact);

    switch (status) {
      case 'complete':
        return {
          icon: '👍',
          backgroundColor: '#10B981',
          title: 'Keep in touch - Basic info complete (check wishes in modal)'
        };
      case 'missing_birthday':
        return {
          icon: '🎂',
          backgroundColor: '#A7F3D0',
          title: 'Keep in touch - Birthday missing'
        };
      case 'incomplete':
      default:
        return {
          icon: '📝',
          backgroundColor: '#FEF3C7',
          title: 'Keep in touch - Info incomplete'
        };
    }
  };

  return {
    formatDaysUntilNext,
    formatBirthdayCountdown,
    getUrgencyColor,
    formatFrequency,
    getKeepInTouchStatus,
    getEnhancedKeepInTouchStatus,
    getKeepInTouchDisplay
  };
};