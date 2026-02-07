import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight, FaCopy, FaCheck, FaPlus, FaCalendarAlt, FaTimes, FaBuilding, FaVideo, FaUsers, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
`;

const LanguageToggle = styled.div`
  display: flex;
  gap: 4px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 6px;
  padding: 2px;
`;

const LangButton = styled.button`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#fff' : '#4B5563')
    : 'transparent'};
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#374151' : '#F3F4F6')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')};
  box-shadow: ${props => props.$active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  gap: 4px;
  background: ${props => props.$primary
    ? '#F59E0B'
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  color: ${props => props.$primary
    ? '#fff'
    : (props.theme === 'light' ? '#374151' : '#D1D5DB')};

  &:hover {
    background: ${props => props.$primary
      ? '#D97706'
      : (props.theme === 'light' ? '#E5E7EB' : '#4B5563')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const DaysContainer = styled.div`
  display: flex;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
`;

const DayButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 44px;
  background: ${props => props.$active
    ? '#F59E0B'
    : props.$isToday
      ? (props.theme === 'light' ? '#FEF3C7' : '#78350F')
      : 'transparent'};
  color: ${props => props.$active
    ? '#fff'
    : props.theme === 'light' ? '#374151' : '#D1D5DB'};

  &:hover {
    background: ${props => props.$active ? '#F59E0B' : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  }
`;

const DayName = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.7;
`;

const DayNumber = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const Timeline = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-top: 8px;
`;

const HourRow = styled.div`
  display: flex;
  align-items: flex-start;
  min-height: 32px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  position: relative;
`;

const HourLabel = styled.div`
  width: 45px;
  flex-shrink: 0;
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  padding-top: 2px;
`;

const HourContent = styled.div`
  flex: 1;
  min-height: 32px;
  position: relative;
  cursor: ${props => props.$hasEvent ? 'default' : 'pointer'};
  overflow: visible;

  &:hover {
    background: ${props => props.$hasEvent ? 'transparent' : (props.theme === 'light' ? '#F9FAFB' : '#1F2937')};
  }
`;

// Google Calendar color mapping (colorId -> color)
const GOOGLE_CALENDAR_COLORS = {
  '1': '#7986CB',  // Lavender
  '2': '#33B679',  // Sage
  '3': '#8E24AA',  // Grape
  '4': '#E67C73',  // Flamingo
  '5': '#F6BF26',  // Banana
  '6': '#F4511E',  // Tangerine
  '7': '#039BE5',  // Peacock
  '8': '#616161',  // Graphite
  '9': '#3F51B5',  // Blueberry
  '10': '#0B8043', // Basil
  '11': '#D50000', // Tomato
  default: '#039BE5' // Default to Peacock
};

const EventBlock = styled.div`
  background: ${props => props.$color || GOOGLE_CALENDAR_COLORS.default};
  border-radius: 4px;
  padding: 4px 8px;
  margin: 2px 0;
  font-size: 12px;
  color: white;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: ${props => props.$height || 32}px;
  z-index: 10;
  overflow: hidden;
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);
`;

const EventTitle = styled.div`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EventTime = styled.div`
  font-size: 10px;
  opacity: 0.7;
`;

const FreeSlotOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;

  ${HourContent}:hover & {
    opacity: 1;
  }
`;

const CopyHint = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#fff' : '#374151'};
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

// Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#fff' : '#1F2937'};
  border-radius: 12px;
  width: 90%;
  max-width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ModalTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#fff' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #F59E0B;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#fff' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  resize: vertical;
  min-height: 60px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #F59E0B;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#fff' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #F59E0B;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ColorPicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ColorDot = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${props => props.$selected ? '#F59E0B' : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;

  &:hover {
    transform: scale(1.1);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: #F59E0B;
  color: white;

  &:hover:not(:disabled) {
    background: #D97706;
  }
`;

const SecondaryButton = styled(Button)`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const ExtractingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#FDE68A'};
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 16px;
`;

// Quick location presets
const LOCATION_PRESETS = [
  { id: 'office', label: 'Office', value: 'The Roof Gardens', icon: FaBuilding },
  { id: 'meet', label: 'Google Meet', value: 'Google Meet (link will be created)', icon: FaVideo }
];

// Styled components for attendees and location
const LocationButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const LocationBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid ${props => props.$active
    ? '#F59E0B'
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')};
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FEF3C7' : '#78350F')
    : 'transparent'};
  border-radius: 16px;
  font-size: 12px;
  color: ${props => props.$active
    ? '#D97706'
    : (props.theme === 'light' ? '#374151' : '#D1D5DB')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #F59E0B;
    background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  }
`;

const AttendeesSection = styled.div`
  margin-top: 4px;
`;

const AttendeesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

const AttendeeChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  background: ${props => props.$suggested
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  border: 1px solid ${props => props.$suggested
    ? (props.theme === 'light' ? '#93C5FD' : '#3B82F6')
    : 'transparent'};
  border-radius: 16px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const AttendeeRemove = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  }
`;

const AttendeeSearch = styled.div`
  position: relative;
`;

const AttendeeSearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  padding: 0 8px;
  background: ${props => props.theme === 'light' ? '#fff' : '#1F2937'};
`;

const AttendeeInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F3F4F6'};
  outline: none;

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const AttendeeSearchIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  display: flex;
`;

const AttendeeDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: ${props => props.theme === 'light' ? '#fff' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 180px;
  overflow-y: auto;
  z-index: 100;
`;

const AttendeeOption = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const AttendeeOptionName = styled.div`
  font-weight: 500;
`;

const AttendeeOptionEmail = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SuggestedLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #3B82F6;
  margin-left: 4px;
`;

// Event colors from Google Calendar
const EVENT_COLORS = [
  { id: '1', name: 'Lavender', hex: '#7986CB' },
  { id: '2', name: 'Sage', hex: '#33B679' },
  { id: '3', name: 'Grape', hex: '#8E24AA' },
  { id: '4', name: 'Flamingo', hex: '#E67C73' },
  { id: '5', name: 'Banana', hex: '#F6BF26' },
  { id: '6', name: 'Tangerine', hex: '#F4511E' },
  { id: '7', name: 'Peacock', hex: '#039BE5' },
  { id: '8', name: 'Graphite', hex: '#616161' },
  { id: '9', name: 'Blueberry', hex: '#3F51B5' },
  { id: '10', name: 'Basil', hex: '#0B8043' },
  { id: '11', name: 'Tomato', hex: '#D50000' }
];

// Generate time slots for dropdowns
const TIME_SLOTS = [];
for (let h = 0; h < 24; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

// Week View Modal Styled Components
const WeekModalContent = styled(ModalContent)`
  max-width: 95vw;
  width: 1100px;
  max-height: 90vh;
`;

const WeekModalHeader = styled(ModalHeader)`
  padding: 12px 20px;
`;

const WeekNavHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WeekNavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const WeekDateRange = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  min-width: 180px;
  text-align: center;
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: 50px repeat(7, 1fr);
  overflow-y: auto;
  max-height: calc(90vh - 120px);
`;

const WeekHeaderRow = styled.div`
  display: contents;
`;

const WeekHeaderCell = styled.div`
  padding: 8px 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$isToday
    ? '#F59E0B'
    : (props.theme === 'light' ? '#374151' : '#D1D5DB')};
  background: ${props => props.$isToday
    ? (props.theme === 'light' ? '#FEF3C7' : '#78350F')
    : (props.theme === 'light' ? '#F9FAFB' : '#111827')};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const WeekTimeCell = styled.div`
  padding: 4px 8px;
  font-size: 10px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  text-align: right;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  height: 40px;
  box-sizing: border-box;
`;

const WeekDayCell = styled.div`
  position: relative;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border-left: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  height: 40px;
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const WeekEventBlock = styled.div`
  position: absolute;
  left: 2px;
  right: 2px;
  background: ${props => props.$color || '#039BE5'};
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 10px;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 5;
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
  }
`;

const CalendarPanelTab = ({ theme, targetDate, onTargetDateHandled, emailContext, contactContext, addEventTrigger, weekViewTrigger }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'it'
  const [copiedHour, setCopiedHour] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);

  // React to external triggers (from left panel buttons)
  useEffect(() => {
    if (addEventTrigger > 0) setShowAddModal(true);
  }, [addEventTrigger]);

  useEffect(() => {
    if (weekViewTrigger > 0) setShowWeekModal(true);
  }, [weekViewTrigger]);

  // Attendees state
  const [attendees, setAttendees] = useState([]); // [{contact_id, name, email, suggested}]
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeResults, setAttendeeResults] = useState([]);
  const [searchingAttendees, setSearchingAttendees] = useState(false);

  // Add Event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    description: '',
    colorId: '7' // Default to Peacock (blue)
  });
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);

  // Week View state
  const [weekViewDate, setWeekViewDate] = useState(new Date());
  const [weekEvents, setWeekEvents] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);

  // Navigate to target date when received from parent (email text selection)
  useEffect(() => {
    if (targetDate && targetDate instanceof Date && !isNaN(targetDate)) {
      setSelectedDate(targetDate);
      onTargetDateHandled?.();
      toast.success(`Calendar: ${targetDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`);
    }
  }, [targetDate, onTargetDateHandled]);

  // Get week days around selected date
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start from Monday
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch events from Google Calendar
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const response = await fetch(
          `${BACKEND_URL}/google-calendar/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedDate]);

  // Generate 30-minute slots from 6am to 11pm (6:00, 6:30, 7:00, ... 23:00)
  const slots = [];
  for (let hour = 6; hour <= 23; hour++) {
    slots.push({ hour, minute: 0 });
    if (hour < 23) {
      slots.push({ hour, minute: 30 });
    }
  }

  // Check if a slot has events starting in it
  const getEventsForSlot = (hour, minute) => {
    return events.filter(event => {
      const start = new Date(event.start?.dateTime || event.start?.date);
      // Only show event in the slot where it starts
      return start.getHours() === hour &&
             ((minute === 0 && start.getMinutes() < 30) ||
              (minute === 30 && start.getMinutes() >= 30));
    });
  };

  // Check if a slot is blocked by an event (for showing as occupied but no card)
  const isSlotOccupied = (hour, minute) => {
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(selectedDate);
    slotEnd.setHours(hour, minute + 30, 0, 0);

    return events.some(event => {
      const start = new Date(event.start?.dateTime || event.start?.date);
      const end = new Date(event.end?.dateTime || event.end?.date);
      return start < slotEnd && end > slotStart;
    });
  };

  // Calculate event height based on duration (each slot is 33px = 32px + 1px border)
  const SLOT_HEIGHT = 33;
  const calculateEventHeight = (event) => {
    const start = new Date(event.start?.dateTime || event.start?.date);
    const end = new Date(event.end?.dateTime || event.end?.date);
    const durationMinutes = (end - start) / (1000 * 60);
    const slots = Math.ceil(durationMinutes / 30);
    return Math.max(slots * SLOT_HEIGHT - 4, 28); // -4 for margin, min 28px
  };

  // Format date for copy text
  const formatDateForCopy = (date, hour, minute = 0) => {
    const dayNames = {
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      it: ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato']
    };

    const monthNames = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
    };

    const dayName = dayNames[language][date.getDay()];
    const dayNumber = date.getDate();
    const month = monthNames[language][date.getMonth()];

    // Format time
    let timeFormatted;
    if (language === 'en') {
      const h = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const ampm = hour >= 12 ? 'pm' : 'am';
      timeFormatted = minute === 0 ? `${h} ${ampm}` : `${h}:30 ${ampm}`;
    } else {
      timeFormatted = minute === 0 ? `${hour}:00` : `${hour}:30`;
    }

    if (language === 'en') {
      const ordinal = dayNumber === 1 || dayNumber === 21 || dayNumber === 31 ? 'st'
        : dayNumber === 2 || dayNumber === 22 ? 'nd'
        : dayNumber === 3 || dayNumber === 23 ? 'rd'
        : 'th';
      return `${dayName} ${dayNumber}${ordinal} ${month} at ${timeFormatted}`;
    } else {
      return `${dayName} ${dayNumber} ${month} alle ${timeFormatted}`;
    }
  };

  // Handle click on free slot
  const handleSlotClick = (hour, minute) => {
    if (isSlotOccupied(hour, minute)) return;

    const text = formatDateForCopy(selectedDate, hour, minute);
    navigator.clipboard.writeText(text);
    setCopiedHour(`${hour}:${minute}`);
    toast.success(`Copied: "${text}"`);

    setTimeout(() => setCopiedHour(null), 2000);
  };

  // Search CRM contacts for attendees
  const searchCRMContacts = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setAttendeeResults([]);
      return;
    }

    setSearchingAttendees(true);
    try {
      // Search first_name
      const { data: firstNameData } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          contact_emails (email, is_primary)
        `)
        .ilike('first_name', `%${searchText}%`)
        .not('category', 'eq', 'Skip')
        .limit(10);

      // Search last_name
      const { data: lastNameData } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          contact_emails (email, is_primary)
        `)
        .ilike('last_name', `%${searchText}%`)
        .not('category', 'eq', 'Skip')
        .limit(10);

      // Combine and dedupe
      const combined = [...(firstNameData || [])];
      (lastNameData || []).forEach(contact => {
        if (!combined.some(c => c.contact_id === contact.contact_id)) {
          combined.push(contact);
        }
      });

      // Filter out already added attendees
      const filtered = combined.filter(c =>
        !attendees.some(a => a.contact_id === c.contact_id)
      );

      // Format results
      const results = filtered.map(contact => {
        const primaryEmail = contact.contact_emails?.find(e => e.is_primary)?.email
          || contact.contact_emails?.[0]?.email || '';
        return {
          contact_id: contact.contact_id,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
          email: primaryEmail
        };
      });

      setAttendeeResults(results.slice(0, 8));
    } catch (err) {
      console.error('Error searching contacts:', err);
    }
    setSearchingAttendees(false);
  }, [attendees]);

  // Debounced search for attendees
  useEffect(() => {
    const timer = setTimeout(() => {
      if (attendeeSearch.length >= 2) {
        searchCRMContacts(attendeeSearch);
      } else {
        setAttendeeResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [attendeeSearch, searchCRMContacts]);

  // Add attendee
  const addAttendee = (contact) => {
    if (!attendees.some(a => a.contact_id === contact.contact_id)) {
      setAttendees(prev => [...prev, { ...contact, suggested: false }]);
    }
    setAttendeeSearch('');
    setAttendeeResults([]);
  };

  // Remove attendee
  const removeAttendee = (contactId) => {
    setAttendees(prev => prev.filter(a => a.contact_id !== contactId));
  };

  // Handle location preset click
  const handleLocationPreset = (preset) => {
    if (preset.id === 'meet') {
      setNewEvent(prev => ({
        ...prev,
        location: 'Google Meet',
        addConference: true
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        location: preset.value,
        addConference: false
      }));
    }
  };

  // Week View helpers
  const getWeekViewDays = () => {
    const days = [];
    const startOfWeek = new Date(weekViewDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekViewDays = showWeekModal ? getWeekViewDays() : [];

  // Fetch week events when modal opens
  useEffect(() => {
    if (!showWeekModal) return;

    const fetchWeekEvents = async () => {
      setWeekLoading(true);
      try {
        const days = getWeekViewDays();
        const startOfWeek = new Date(days[0]);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(days[6]);
        endOfWeek.setHours(23, 59, 59, 999);

        const response = await fetch(
          `${BACKEND_URL}/google-calendar/events?timeMin=${startOfWeek.toISOString()}&timeMax=${endOfWeek.toISOString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setWeekEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching week events:', error);
      }
      setWeekLoading(false);
    };

    fetchWeekEvents();
  }, [showWeekModal, weekViewDate]);

  // Navigate week in Week View modal
  const navigateWeekView = (direction) => {
    const newDate = new Date(weekViewDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setWeekViewDate(newDate);
  };

  // Get events for a specific day in week view
  const getWeekDayEvents = (day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return weekEvents.filter(event => {
      const eventStart = new Date(event.start?.dateTime || event.start?.date);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  // Open add modal from week view with pre-filled date/time
  const openAddFromWeekView = (day, hour) => {
    const selectedDay = new Date(day);
    setNewEvent({
      title: '',
      date: selectedDay,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      location: '',
      description: '',
      colorId: '7'
    });
    setShowAddModal(true);
  };

  // Format week date range
  const formatWeekRange = () => {
    if (weekViewDays.length === 0) return '';
    const start = weekViewDays[0];
    const end = weekViewDays[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth} ${end.getFullYear()}`;
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
  };

  // Open Add Event modal
  const openAddModal = async () => {
    // Reset form with current selected date
    setNewEvent({
      title: '',
      date: selectedDate,
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: '',
      colorId: '7',
      addConference: false
    });

    // Reset attendees and add suggested contact if available
    const suggestedAttendees = [];
    if (contactContext) {
      // Contact from WhatsApp/Email context
      const primaryEmail = contactContext.emails?.find(e => e.is_primary)?.email
        || contactContext.emails?.[0]?.email || '';
      if (contactContext.contact_id) {
        suggestedAttendees.push({
          contact_id: contactContext.contact_id,
          name: `${contactContext.first_name || ''} ${contactContext.last_name || ''}`.trim(),
          email: primaryEmail,
          suggested: true
        });
      }
    }
    setAttendees(suggestedAttendees);
    setAttendeeSearch('');
    setAttendeeResults([]);

    setShowAddModal(true);

    // Extract event from email if available
    if (emailContext) {
      setExtracting(true);
      try {
        const res = await fetch(`${BACKEND_URL}/calendar/extract-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: {
              subject: emailContext.subject || '',
              body_text: emailContext.body_text || emailContext.body_html || emailContext.snippet || '',
              from_email: emailContext.from_email || '',
              from_name: emailContext.from_name || '',
              to_recipients: emailContext.to_recipients || [],
              cc_recipients: emailContext.cc_recipients || [],
              date: emailContext.date || ''
            }
          })
        });
        const data = await res.json();
        if (data.event && data.event.found_event) {
          // Parse datetime if present
          let eventDate = selectedDate;
          let startTime = '09:00';
          let endTime = '10:00';

          if (data.event.datetime) {
            const dt = new Date(data.event.datetime);
            if (!isNaN(dt)) {
              eventDate = dt;
              startTime = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
              // Calculate end time based on duration
              const durationMins = data.event.duration_minutes || 60;
              const endDt = new Date(dt.getTime() + durationMins * 60000);
              endTime = `${endDt.getHours().toString().padStart(2, '0')}:${endDt.getMinutes().toString().padStart(2, '0')}`;
            }
          }

          setNewEvent(prev => ({
            ...prev,
            title: data.event.title || prev.title,
            date: eventDate,
            startTime: startTime,
            endTime: endTime,
            location: data.event.location || prev.location,
            description: data.event.description || prev.description
          }));

          toast.success('Event details extracted from email');
        }
      } catch (err) {
        console.error('Extract event error:', err);
      }
      setExtracting(false);
    }
  };

  // Create event
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setCreating(true);
    try {
      // Combine date and time
      const [startHour, startMin] = newEvent.startTime.split(':').map(Number);
      const [endHour, endMin] = newEvent.endTime.split(':').map(Number);

      const startDate = new Date(newEvent.date);
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date(newEvent.date);
      endDate.setHours(endHour, endMin, 0, 0);

      // Format attendees for API
      const attendeeEmails = attendees
        .filter(a => a.email)
        .map(a => ({ email: a.email, displayName: a.name }));

      const res = await fetch(`${BACKEND_URL}/google-calendar/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title.trim(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          location: newEvent.addConference ? undefined : (newEvent.location.trim() || undefined),
          description: newEvent.description.trim() || undefined,
          colorId: newEvent.colorId,
          timezone: 'Europe/Rome',
          attendees: attendeeEmails.length > 0 ? attendeeEmails : undefined,
          addConference: newEvent.addConference || false
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Event created!');
        setShowAddModal(false);
        // Refresh events if we're on the same date
        const eventDate = new Date(newEvent.date);
        eventDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(selectedDate);
        currentDate.setHours(0, 0, 0, 0);
        if (eventDate.getTime() === currentDate.getTime()) {
          // Trigger re-fetch by updating selectedDate
          setSelectedDate(new Date(selectedDate));
        }
      } else {
        toast.error(data.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Create event error:', err);
      toast.error('Failed to create event');
    }
    setCreating(false);
  };

  // Navigate week
  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  // Format day name
  const formatDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
  };

  // Check if date is today
  const isToday = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  // Check if date is selected
  const isSelected = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const s = new Date(selectedDate);
    s.setHours(0, 0, 0, 0);
    return d.getTime() === s.getTime();
  };

  return (
    <Container>
      <Header>
        <Title theme={theme}>Calendar</Title>
        <HeaderActions>
          <ActionButton
            theme={theme}
            onClick={() => setSelectedDate(new Date())}
            disabled={isToday(selectedDate)}
            title="Go to today"
          >
            Today
          </ActionButton>
          <ActionButton
            theme={theme}
            onClick={openAddModal}
            $primary
            title="Add event"
          >
            <FaPlus size={10} />
          </ActionButton>
          <ActionButton
            theme={theme}
            onClick={() => setShowWeekModal(true)}
            title="Week view"
          >
            <FaCalendarAlt size={10} />
          </ActionButton>
          <LanguageToggle theme={theme}>
            <LangButton
              theme={theme}
              $active={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              EN
            </LangButton>
            <LangButton
              theme={theme}
              $active={language === 'it'}
              onClick={() => setLanguage('it')}
            >
              IT
            </LangButton>
          </LanguageToggle>
        </HeaderActions>
      </Header>

      <WeekNav>
        <NavButton theme={theme} onClick={() => navigateWeek(-1)}>
          <FaChevronLeft size={12} />
        </NavButton>
        <DaysContainer>
          {weekDays.map((day, index) => (
            <DayButton
              key={index}
              theme={theme}
              $active={isSelected(day)}
              $isToday={isToday(day)}
              onClick={() => setSelectedDate(day)}
            >
              <DayName>{formatDayName(day)}</DayName>
              <DayNumber>{day.getDate()}</DayNumber>
            </DayButton>
          ))}
        </DaysContainer>
        <NavButton theme={theme} onClick={() => navigateWeek(1)}>
          <FaChevronRight size={12} />
        </NavButton>
      </WeekNav>

      {loading ? (
        <LoadingState theme={theme}>Loading events...</LoadingState>
      ) : (
        <Timeline>
          {slots.map(({ hour, minute }) => {
            const slotEvents = getEventsForSlot(hour, minute);
            const hasEvents = slotEvents.length > 0;
            const isOccupied = isSlotOccupied(hour, minute);
            const slotKey = `${hour}:${minute}`;

            return (
              <HourRow key={slotKey} theme={theme}>
                <HourLabel theme={theme}>
                  {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                </HourLabel>
                <HourContent
                  theme={theme}
                  $hasEvent={isOccupied && !hasEvents}
                  onClick={() => handleSlotClick(hour, minute)}
                >
                  {hasEvents ? (
                    slotEvents.map((event, idx) => {
                      const eventColor = GOOGLE_CALENDAR_COLORS[event.colorId] || event.backgroundColor || GOOGLE_CALENDAR_COLORS.default;
                      return (
                        <EventBlock key={idx} theme={theme} $height={calculateEventHeight(event)} $color={eventColor}>
                          <EventTitle>{event.summary || 'Busy'}</EventTitle>
                          <EventTime>
                            {new Date(event.start?.dateTime || event.start?.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(event.end?.dateTime || event.end?.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </EventTime>
                        </EventBlock>
                      );
                    })
                  ) : isOccupied ? (
                    null // Event block from previous slot covers this
                  ) : (
                    <FreeSlotOverlay>
                      <CopyHint theme={theme}>
                        {copiedHour === slotKey ? (
                          <>
                            <FaCheck size={10} style={{ color: '#10B981' }} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <FaCopy size={10} />
                            Click to copy
                          </>
                        )}
                      </CopyHint>
                    </FreeSlotOverlay>
                  )}
                </HourContent>
              </HourRow>
            );
          })}
        </Timeline>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <ModalOverlay onClick={() => setShowAddModal(false)}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>Add Event</ModalTitle>
              <CloseButton theme={theme} onClick={() => setShowAddModal(false)}>
                <FaTimes size={14} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {extracting && (
                <ExtractingBadge theme={theme}>
                  Extracting event details from email...
                </ExtractingBadge>
              )}

              <FormGroup>
                <FormLabel theme={theme}>Title *</FormLabel>
                <FormInput
                  theme={theme}
                  type="text"
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel theme={theme}>Date</FormLabel>
                <FormInput
                  theme={theme}
                  type="date"
                  value={newEvent.date instanceof Date ? newEvent.date.toISOString().split('T')[0] : ''}
                  onChange={e => setNewEvent(prev => ({ ...prev, date: new Date(e.target.value) }))}
                />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <FormLabel theme={theme}>Start Time</FormLabel>
                  <FormSelect
                    theme={theme}
                    value={newEvent.startTime}
                    onChange={e => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel theme={theme}>End Time</FormLabel>
                  <FormSelect
                    theme={theme}
                    value={newEvent.endTime}
                    onChange={e => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </FormSelect>
                </FormGroup>
              </FormRow>

              <FormGroup>
                <FormLabel theme={theme}>Location</FormLabel>
                <LocationButtons>
                  {LOCATION_PRESETS.map(preset => (
                    <LocationBtn
                      key={preset.id}
                      theme={theme}
                      $active={
                        (preset.id === 'meet' && newEvent.addConference) ||
                        (preset.id === 'office' && newEvent.location === preset.value)
                      }
                      onClick={() => handleLocationPreset(preset)}
                    >
                      <preset.icon size={12} />
                      {preset.label}
                    </LocationBtn>
                  ))}
                </LocationButtons>
                <FormInput
                  theme={theme}
                  type="text"
                  placeholder="Location (optional)"
                  value={newEvent.location}
                  onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value, addConference: false }))}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel theme={theme}>
                  <FaUsers size={12} style={{ marginRight: 6 }} />
                  Attendees
                </FormLabel>
                <AttendeesSection>
                  {attendees.length > 0 && (
                    <AttendeesList>
                      {attendees.map(attendee => (
                        <AttendeeChip key={attendee.contact_id} theme={theme} $suggested={attendee.suggested}>
                          {attendee.name}
                          {attendee.email && ` (${attendee.email})`}
                          {attendee.suggested && <SuggestedLabel>suggested</SuggestedLabel>}
                          <AttendeeRemove
                            theme={theme}
                            onClick={() => removeAttendee(attendee.contact_id)}
                          >
                            <FaTimes size={8} />
                          </AttendeeRemove>
                        </AttendeeChip>
                      ))}
                    </AttendeesList>
                  )}
                  <AttendeeSearch>
                    <AttendeeSearchInput theme={theme}>
                      <AttendeeSearchIcon theme={theme}>
                        <FaSearch size={12} />
                      </AttendeeSearchIcon>
                      <AttendeeInput
                        theme={theme}
                        type="text"
                        placeholder="Search contact name or enter email..."
                        value={attendeeSearch}
                        onChange={e => setAttendeeSearch(e.target.value)}
                      />
                    </AttendeeSearchInput>
                    {attendeeResults.length > 0 && (
                      <AttendeeDropdown theme={theme}>
                        {attendeeResults.map(contact => (
                          <AttendeeOption
                            key={contact.contact_id}
                            theme={theme}
                            onClick={() => addAttendee(contact)}
                          >
                            <AttendeeOptionName>{contact.name}</AttendeeOptionName>
                            {contact.email && (
                              <AttendeeOptionEmail theme={theme}>{contact.email}</AttendeeOptionEmail>
                            )}
                          </AttendeeOption>
                        ))}
                      </AttendeeDropdown>
                    )}
                  </AttendeeSearch>
                </AttendeesSection>
              </FormGroup>

              <FormGroup>
                <FormLabel theme={theme}>Description</FormLabel>
                <FormTextarea
                  theme={theme}
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel theme={theme}>Color</FormLabel>
                <ColorPicker>
                  {EVENT_COLORS.map(color => (
                    <ColorDot
                      key={color.id}
                      $color={color.hex}
                      $selected={newEvent.colorId === color.id}
                      title={color.name}
                      onClick={() => setNewEvent(prev => ({ ...prev, colorId: color.id }))}
                    />
                  ))}
                </ColorPicker>
              </FormGroup>
            </ModalBody>
            <ModalFooter theme={theme}>
              <SecondaryButton theme={theme} onClick={() => setShowAddModal(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                onClick={handleCreateEvent}
                disabled={creating || !newEvent.title.trim()}
              >
                {creating ? 'Creating...' : 'Create Event'}
              </PrimaryButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Week View Modal */}
      {showWeekModal && (
        <ModalOverlay onClick={() => setShowWeekModal(false)}>
          <WeekModalContent theme={theme} onClick={e => e.stopPropagation()}>
            <WeekModalHeader theme={theme}>
              <WeekNavHeader>
                <WeekNavBtn theme={theme} onClick={() => navigateWeekView(-1)}>
                  <FaChevronLeft size={12} />
                </WeekNavBtn>
                <WeekDateRange theme={theme}>{formatWeekRange()}</WeekDateRange>
                <WeekNavBtn theme={theme} onClick={() => navigateWeekView(1)}>
                  <FaChevronRight size={12} />
                </WeekNavBtn>
                <ActionButton
                  theme={theme}
                  onClick={() => setWeekViewDate(new Date())}
                  style={{ marginLeft: 8 }}
                >
                  Today
                </ActionButton>
              </WeekNavHeader>
              <CloseButton theme={theme} onClick={() => setShowWeekModal(false)}>
                <FaTimes size={14} />
              </CloseButton>
            </WeekModalHeader>
            <WeekGrid>
              {/* Header row */}
              <WeekHeaderCell theme={theme} style={{ background: 'transparent' }} />
              {weekViewDays.map((day, idx) => {
                const dayToday = new Date();
                dayToday.setHours(0, 0, 0, 0);
                const dayNorm = new Date(day);
                dayNorm.setHours(0, 0, 0, 0);
                const isDayToday = dayNorm.getTime() === dayToday.getTime();
                return (
                  <WeekHeaderCell key={idx} theme={theme} $isToday={isDayToday}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    <br />
                    {day.getDate()}
                  </WeekHeaderCell>
                );
              })}

              {/* Time rows */}
              {Array.from({ length: 17 }, (_, i) => i + 6).map(hour => (
                <React.Fragment key={hour}>
                  <WeekTimeCell theme={theme}>
                    {hour.toString().padStart(2, '0')}:00
                  </WeekTimeCell>
                  {weekViewDays.map((day, dayIdx) => {
                    const dayEvents = getWeekDayEvents(day).filter(event => {
                      const eventStart = new Date(event.start?.dateTime || event.start?.date);
                      return eventStart.getHours() === hour;
                    });
                    return (
                      <WeekDayCell
                        key={dayIdx}
                        theme={theme}
                        onClick={() => openAddFromWeekView(day, hour)}
                      >
                        {dayEvents.map((event, eventIdx) => {
                          const start = new Date(event.start?.dateTime || event.start?.date);
                          const end = new Date(event.end?.dateTime || event.end?.date);
                          const durationMins = (end - start) / (1000 * 60);
                          const heightPx = Math.max((durationMins / 60) * 40, 16);
                          const topOffset = (start.getMinutes() / 60) * 40;
                          const color = GOOGLE_CALENDAR_COLORS[event.colorId] || event.backgroundColor || GOOGLE_CALENDAR_COLORS.default;
                          return (
                            <WeekEventBlock
                              key={eventIdx}
                              $color={color}
                              style={{ top: topOffset, height: heightPx }}
                              title={`${event.summary}\n${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                              onClick={e => e.stopPropagation()}
                            >
                              {event.summary || 'Busy'}
                            </WeekEventBlock>
                          );
                        })}
                      </WeekDayCell>
                    );
                  })}
                </React.Fragment>
              ))}
            </WeekGrid>
          </WeekModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default CalendarPanelTab;
