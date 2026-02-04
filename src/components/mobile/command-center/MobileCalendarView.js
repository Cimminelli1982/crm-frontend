import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight, FaCalendar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';

// Google Calendar color mapping
const CALENDAR_COLORS = {
  '1': '#7986CB',
  '2': '#33B679',
  '3': '#8E24AA',
  '4': '#E67C73',
  '5': '#F6BF26',
  '6': '#F4511E',
  '7': '#039BE5',
  '8': '#616161',
  '9': '#3F51B5',
  '10': '#0B8043',
  '11': '#D50000',
  default: '#039BE5'
};

/**
 * MobileCalendarView - Calendar day view optimized for mobile
 * Shows week navigation at top and timeline of events
 */
const MobileCalendarView = ({
  events = [],
  selectedDate,
  onDateChange,
  onEventSelect,
  loading,
  theme = 'dark',
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Get week days
  const getWeekDays = () => {
    const days = [];
    const startDay = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDay, i));
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleDateSelect = (date) => {
    setCurrentDate(date);
    onDateChange?.(date);
  };

  const navigateWeek = (direction) => {
    const newDate = addDays(currentDate, direction * 7);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const formatDayName = (date) => {
    return format(date, 'EEE').substring(0, 2);
  };

  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start?.dateTime || event.start?.date);
    return isSameDay(eventDate, currentDate);
  }).sort((a, b) => {
    const aStart = new Date(a.start?.dateTime || a.start?.date);
    const bStart = new Date(b.start?.dateTime || b.start?.date);
    return aStart - bStart;
  });

  const formatEventTime = (event) => {
    const start = new Date(event.start?.dateTime || event.start?.date);
    const end = new Date(event.end?.dateTime || event.end?.date);
    
    if (event.start?.date && !event.start?.dateTime) {
      return 'All day';
    }
    
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  const getEventColor = (event) => {
    return CALENDAR_COLORS[event.colorId] || event.backgroundColor || CALENDAR_COLORS.default;
  };

  // Generate time slots (6am to 11pm)
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    timeSlots.push(hour);
  }

  const getEventsForHour = (hour) => {
    return dayEvents.filter(event => {
      const start = new Date(event.start?.dateTime || event.start?.date);
      return start.getHours() === hour;
    });
  };

  const isHourOccupied = (hour) => {
    return dayEvents.some(event => {
      const start = new Date(event.start?.dateTime || event.start?.date);
      const end = new Date(event.end?.dateTime || event.end?.date);
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(currentDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      return start < slotEnd && end > slotStart;
    });
  };

  return (
    <Container theme={theme}>
      {/* Week Navigation */}
      <WeekNav theme={theme}>
        <NavButton theme={theme} onClick={() => navigateWeek(-1)}>
          <FaChevronLeft size={14} />
        </NavButton>
        <DaysContainer>
          {weekDays.map((day, index) => (
            <DayButton
              key={index}
              theme={theme}
              $active={isSameDay(day, currentDate)}
              $isToday={isToday(day)}
              onClick={() => handleDateSelect(day)}
            >
              <DayName>{formatDayName(day)}</DayName>
              <DayNumber>{format(day, 'd')}</DayNumber>
            </DayButton>
          ))}
        </DaysContainer>
        <NavButton theme={theme} onClick={() => navigateWeek(1)}>
          <FaChevronRight size={14} />
        </NavButton>
      </WeekNav>

      {/* Date Header */}
      <DateHeader theme={theme}>
        <DateText theme={theme}>{format(currentDate, 'EEEE, MMMM d')}</DateText>
        <EventCount theme={theme}>{dayEvents.length} events</EventCount>
      </DateHeader>

      {/* Events List / Timeline */}
      <Content>
        {loading ? (
          <LoadingState theme={theme}>
            <FaCalendar size={32} style={{ opacity: 0.3 }} />
            <span>Loading events...</span>
          </LoadingState>
        ) : dayEvents.length === 0 ? (
          <EmptyState theme={theme}>
            <FaCalendar size={48} style={{ opacity: 0.3 }} />
            <EmptyTitle theme={theme}>No events</EmptyTitle>
            <EmptyText theme={theme}>Your calendar is clear for today</EmptyText>
          </EmptyState>
        ) : (
          <EventsList>
            {dayEvents.map((event, index) => (
              <EventCard
                key={event.id || index}
                theme={theme}
                $color={getEventColor(event)}
                onClick={() => onEventSelect?.(event)}
              >
                <EventColorBar $color={getEventColor(event)} />
                <EventContent>
                  <EventTitle theme={theme}>{event.summary || 'Busy'}</EventTitle>
                  <EventMeta>
                    <EventTime theme={theme}>
                      <FaClock size={11} />
                      {formatEventTime(event)}
                    </EventTime>
                    {event.location && (
                      <EventLocation theme={theme}>
                        <FaMapMarkerAlt size={11} />
                        {event.location.length > 30 
                          ? event.location.substring(0, 30) + '...' 
                          : event.location}
                      </EventLocation>
                    )}
                  </EventMeta>
                  {event.description && (
                    <EventDescription theme={theme}>
                      {event.description.length > 100 
                        ? event.description.substring(0, 100) + '...' 
                        : event.description}
                    </EventDescription>
                  )}
                </EventContent>
              </EventCard>
            ))}
          </EventsList>
        )}
      </Content>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;

  &:active {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const DaysContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 4px;
  justify-content: space-between;
`;

const DayButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  min-width: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active
    ? '#3B82F6'
    : props.$isToday
      ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
      : 'transparent'};
  color: ${props => props.$active
    ? '#FFFFFF'
    : props.theme === 'light' ? '#374151' : '#D1D5DB'};

  &:active {
    background: ${props => props.$active ? '#3B82F6' : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  }
`;

const DayName = styled.span`
  font-size: 11px;
  font-weight: 500;
  opacity: 0.7;
  text-transform: uppercase;
`;

const DayNumber = styled.span`
  font-size: 16px;
  font-weight: 600;
`;

const DateHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const DateText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const EventCount = styled.span`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const EventsList = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EventCard = styled.div`
  display: flex;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  min-height: 72px;

  &:active {
    opacity: 0.9;
  }
`;

const EventColorBar = styled.div`
  width: 4px;
  background: ${props => props.$color || '#039BE5'};
  flex-shrink: 0;
`;

const EventContent = styled.div`
  flex: 1;
  padding: 12px;
`;

const EventTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 6px 0;
`;

const EventMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const EventTime = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EventLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EventDescription = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 8px;
  line-height: 1.4;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 16px 0 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

export default MobileCalendarView;
