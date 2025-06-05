import React from 'react';

const ContactsIcon = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main user figure (darker green) */}
      <circle
        cx="9"
        cy="7"
        r="4"
        fill="#00cc00"
      />
      <path
        d="M2 21c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke="#00cc00"
        strokeWidth="2"
        fill="#00cc00"
        opacity="0.8"
      />
      
      {/* Secondary user figure (lighter green, overlapping) */}
      <circle
        cx="16"
        cy="6"
        r="3.5"
        fill="#66ff66"
        opacity="0.9"
      />
      <path
        d="M10 20c0-3.5 2.5-6.5 6-6.5s6 3 6 6.5"
        stroke="#66ff66"
        strokeWidth="1.8"
        fill="#66ff66"
        opacity="0.7"
      />
    </svg>
  );
};

export default ContactsIcon; 