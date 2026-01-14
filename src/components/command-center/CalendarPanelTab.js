import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight, FaCopy, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

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

const CalendarPanelTab = ({ theme }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'it'
  const [copiedHour, setCopiedHour] = useState(null);

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
    </Container>
  );
};

export default CalendarPanelTab;
