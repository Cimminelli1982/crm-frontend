import React from 'react';
import Contacts from '../Contacts';

// This component now renders the main Contacts page with 'lastInteraction' as default filter
const LastInteractions = () => {
  // The Contacts component handles all the logic and UI
  return <Contacts defaultFilter="lastInteraction" />;
};

export default LastInteractions; 