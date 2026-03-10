import { Fragment, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const GOOGLE_CALENDAR_COLORS = {
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
  default: '#039BE5',
};

const HOUR_HEIGHT = 40;
const START_HOUR = 7;
const END_HOUR = 22;
const SLOT_DURATION = 45;

const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_FULL_IT = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica'];
const DAY_NAMES_FULL_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES_IT = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Styled Components ───────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const Modal = styled.div`
  position: relative;
  background: ${p => p.theme === 'light' ? '#fff' : '#1F2937'};
  border-radius: 12px;
  width: 1100px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border: none;
  border-radius: 6px;
  background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${p => p.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;
  &:hover { background: ${p => p.theme === 'light' ? '#E5E7EB' : '#4B5563'}; }
`;

const DateRange = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${p => p.theme === 'light' ? '#374151' : '#F3F4F6'};
  min-width: 180px;
  text-align: center;
`;

const TodayBtn = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid ${p => p.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 4px;
  background: transparent;
  color: ${p => p.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;
  &:hover { background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'}; }
`;

const LangToggle = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${p => p.$active ? '#3B82F6' : (p.theme === 'light' ? '#D1D5DB' : '#4B5563')};
  border-radius: 4px;
  background: ${p => p.$active ? '#3B82F6' : 'transparent'};
  color: ${p => p.$active ? '#fff' : (p.theme === 'light' ? '#374151' : '#D1D5DB')};
  cursor: pointer;
  &:hover { opacity: 0.8; }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${p => p.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 16px;
  &:hover { background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'}; }
`;

const GridWrapper = styled.div`
  overflow-y: auto;
  flex: 1;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 50px repeat(7, minmax(0, 1fr));
`;

const HeaderCell = styled.div`
  padding: 8px 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: ${p => p.$isToday ? '#F59E0B' : (p.theme === 'light' ? '#374151' : '#D1D5DB')};
  background: ${p => p.$isToday
    ? (p.theme === 'light' ? '#FEF3C7' : '#78350F')
    : (p.theme === 'light' ? '#F9FAFB' : '#111827')};
  border-bottom: 1px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const CornerCell = styled(HeaderCell)`
  background: ${p => p.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const AllDayLabel = styled.div`
  padding: 4px 4px;
  font-size: 9px;
  color: ${p => p.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  text-align: right;
  border-bottom: 2px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 28px;
`;

const AllDayCell = styled.div`
  padding: 2px 4px;
  border-bottom: 2px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-left: 1px solid ${p => p.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  min-height: 28px;
`;

const AllDayPill = styled.div`
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  background: ${p => p.$color || '#039BE5'};
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const TimeCell = styled.div`
  padding: 4px 8px;
  font-size: 10px;
  color: ${p => p.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  text-align: right;
  border-bottom: 1px solid ${p => p.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  height: ${HOUR_HEIGHT}px;
  box-sizing: border-box;
`;

const DayCell = styled.div`
  position: relative;
  border-bottom: 1px solid ${p => p.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border-left: 1px solid ${p => p.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  height: ${HOUR_HEIGHT}px;
  box-sizing: border-box;
  cursor: pointer;
  overflow: visible;
  &:hover {
    background: ${p => p.theme === 'light' ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.06)'};
  }
`;

const EventBlock = styled.div`
  position: absolute;
  left: 2px; right: 2px;
  background: ${p => p.$color || '#039BE5'};
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 10px;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 5;
  pointer-events: none;
`;

const SelectedSlotBlock = styled.div`
  position: absolute;
  left: 2px; right: 2px;
  background: rgba(16, 185, 129, 0.85);
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 10px;
  color: white;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const RemoveSlotBtn = styled.span`
  font-size: 12px;
  opacity: 0.8;
  &:hover { opacity: 1; }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-top: 1px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  flex-shrink: 0;
`;

const SlotCount = styled.span`
  font-size: 13px;
  color: ${p => p.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const ConfirmBtn = styled.button`
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  background: #10B981;
  color: white;
  cursor: pointer;
  &:hover { background: #059669; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const ResultOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${p => p.theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(17,24,39,0.95)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 20;
  padding: 40px;
`;

const ResultBox = styled.pre`
  font-family: inherit;
  font-size: 15px;
  line-height: 1.8;
  color: ${p => p.theme === 'light' ? '#1F2937' : '#F3F4F6'};
  background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'};
  padding: 20px 24px;
  border-radius: 8px;
  white-space: pre-wrap;
  max-width: 500px;
  width: 100%;
`;

const ResultActions = styled.div`
  display: flex;
  gap: 10px;
`;

const CopyAgainBtn = styled.button`
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  background: #3B82F6;
  color: white;
  cursor: pointer;
  &:hover { background: #2563EB; }
`;

const DoneBtn = styled.button`
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid ${p => p.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: transparent;
  color: ${p => p.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;
  &:hover { background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'}; }
`;

// ─── Helpers ─────────────────────────────────────────────────

function getWeekDays(date) {
  const days = [];
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    days.push(day);
  }
  return days;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(d) {
  return isSameDay(d, new Date());
}

function formatDateRange(days) {
  const first = days[0];
  const last = days[6];
  const fmtMonth = d => MONTH_NAMES_EN[d.getMonth()].slice(0, 3);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}-${last.getDate()} ${fmtMonth(first)} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${fmtMonth(first)} - ${last.getDate()} ${fmtMonth(last)} ${first.getFullYear()}`;
}

function getEventColor(event) {
  if (event._color) return event._color;
  const colorId = event.colorId || 'default';
  return GOOGLE_CALENDAR_COLORS[colorId] || GOOGLE_CALENDAR_COLORS.default;
}

function formatTime12(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatTime24(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addMinutes(h, m, mins) {
  const total = h * 60 + m + mins;
  return { h: Math.floor(total / 60), m: total % 60 };
}

// ─── Component ───────────────────────────────────────────────

const FreeSlotPickerModal = ({ theme, trigger, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [weekViewDate, setWeekViewDate] = useState(new Date());
  const [weekEvents, setWeekEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [lang, setLang] = useState(language || 'it');
  const [resultText, setResultText] = useState('');

  // Open when trigger increments
  useEffect(() => {
    if (trigger > 0) {
      setIsOpen(true);
      setWeekViewDate(new Date());
      setSelectedSlots([]);
      setResultText('');
      setLang(language || 'it');
    }
  }, [trigger, language]);

  const days = getWeekDays(weekViewDate);

  // Fetch events for the displayed week
  useEffect(() => {
    if (!isOpen) return;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const startOfWeek = new Date(days[0]);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(days[6]);
        endOfWeek.setHours(23, 59, 59, 999);
        const res = await fetch(
          `${BACKEND_URL}/google-calendar/events/all?timeMin=${startOfWeek.toISOString()}&timeMax=${endOfWeek.toISOString()}`
        );
        if (res.ok) {
          const data = await res.json();
          setWeekEvents(data.events || []);
        }
      } catch (err) {
        console.error('Error fetching week events:', err);
      }
      setLoading(false);
    };
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, weekViewDate]);

  // Separate full-day vs timed events
  const fullDayEvents = weekEvents.filter(e => e.start && e.start.date && !e.start.dateTime);
  const timedEvents = weekEvents.filter(e => e.start && e.start.dateTime);

  // Check if a 45-min window overlaps any existing event
  const isSlotFree = useCallback((day, hour, minute) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000);

    // Don't allow slots past END_HOUR
    const endHour = slotEnd.getHours();
    const endMin = slotEnd.getMinutes();
    if (endHour > END_HOUR || (endHour === END_HOUR && endMin > 0)) {
      return false;
    }

    return !timedEvents.some(event => {
      const eStart = new Date(event.start.dateTime);
      const eEnd = new Date(event.end.dateTime);
      return slotStart < eEnd && slotEnd > eStart;
    });
  }, [timedEvents]);

  // Check overlap with already-selected slots
  const overlapsSelected = useCallback((day, hour, minute) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000);

    return selectedSlots.some(s => {
      const sStart = new Date(s.day);
      sStart.setHours(s.hour, s.minute, 0, 0);
      const sEnd = new Date(sStart.getTime() + SLOT_DURATION * 60 * 1000);
      return slotStart < sEnd && slotEnd > sStart;
    });
  }, [selectedSlots]);

  const handleCellClick = (dayDate, hour, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const yRatio = (e.clientY - rect.top) / rect.height;
    const rawMinute = Math.floor(yRatio * 60);
    const minute = Math.floor(rawMinute / 15) * 15;

    if (selectedSlots.length >= 3) {
      toast('Max 3 slots', { icon: '\u26A0\uFE0F' });
      return;
    }
    if (overlapsSelected(dayDate, hour, minute)) {
      toast('Overlaps a selected slot', { icon: '\u274C' });
      return;
    }

    setSelectedSlots(prev => [...prev, { day: new Date(dayDate), hour, minute }]);
  };

  const removeSlot = (idx, e) => {
    if (e) e.stopPropagation();
    setSelectedSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = async () => {
    if (selectedSlots.length === 0) return;

    const sorted = [...selectedSlots].sort((a, b) => {
      const da = new Date(a.day); da.setHours(a.hour, a.minute);
      const db = new Date(b.day); db.setHours(b.hour, b.minute);
      return da - db;
    });

    let text;
    if (lang === 'it') {
      text = 'Ecco alcune disponibilita (orario di Londra):\n';
      text += sorted.map(s => {
        const d = new Date(s.day);
        const dayIdx = (d.getDay() + 6) % 7;
        const dayName = DAY_NAMES_FULL_IT[dayIdx];
        const monthName = MONTH_NAMES_IT[d.getMonth()];
        const end = addMinutes(s.hour, s.minute, SLOT_DURATION);
        return `- ${dayName} ${d.getDate()} ${monthName}, ore ${formatTime24(s.hour, s.minute)}-${formatTime24(end.h, end.m)}`;
      }).join('\n');
    } else {
      text = 'Here are some available slots (London time):\n';
      text += sorted.map(s => {
        const d = new Date(s.day);
        const dayIdx = (d.getDay() + 6) % 7;
        const dayName = DAY_NAMES_FULL_EN[dayIdx];
        const monthName = MONTH_NAMES_EN[d.getMonth()];
        const end = addMinutes(s.hour, s.minute, SLOT_DURATION);
        return `- ${dayName} ${monthName} ${d.getDate()}, ${formatTime12(s.hour, s.minute)} - ${formatTime12(end.h, end.m)}`;
      }).join('\n');
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Copy failed');
    }
    setResultText(text);
  };

  const handleCopyAgain = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      toast.success('Copied!');
    } catch (err) {
      toast.error('Copy failed');
    }
  };

  const handleClose = () => { setIsOpen(false); setResultText(''); };
  const prevWeek = () => setWeekViewDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekViewDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday = () => setWeekViewDate(new Date());

  if (!isOpen) return null;

  const hours = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);

  const getFullDayEventsForDay = (day) => {
    const dayStr = day.getFullYear() + '-' +
      String(day.getMonth() + 1).padStart(2, '0') + '-' +
      String(day.getDate()).padStart(2, '0');
    return fullDayEvents.filter(event => {
      const startStr = event.start.date;
      const endStr = event.end.date;
      return dayStr >= startStr && dayStr < endStr;
    });
  };

  const getEventsForCell = (day, hour) => {
    return timedEvents.filter(event => {
      const eStart = new Date(event.start.dateTime);
      return isSameDay(eStart, day) && eStart.getHours() === hour;
    });
  };

  const getSlotsForCell = (day, hour) => {
    return selectedSlots.map((s, idx) => ({ ...s, idx })).filter(s =>
      isSameDay(s.day, day) && s.hour === hour
    );
  };


  return (
    <Overlay onClick={handleClose}>
      <Modal theme={theme} onClick={e => e.stopPropagation()}>
        <Header theme={theme}>
          <HeaderLeft>
            <NavBtn theme={theme} onClick={prevWeek}>{'\u2039'}</NavBtn>
            <DateRange theme={theme}>{formatDateRange(days)}</DateRange>
            <NavBtn theme={theme} onClick={nextWeek}>{'\u203A'}</NavBtn>
            <TodayBtn theme={theme} onClick={goToday}>Today</TodayBtn>
          </HeaderLeft>
          <HeaderLeft>
            <LangToggle theme={theme} $active={lang === 'it'} onClick={() => setLang('it')}>IT</LangToggle>
            <LangToggle theme={theme} $active={lang === 'en'} onClick={() => setLang('en')}>EN</LangToggle>
            <CloseBtn theme={theme} onClick={handleClose}>{'\u2715'}</CloseBtn>
          </HeaderLeft>
        </Header>

        <GridWrapper>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
          ) : (
            <Grid>
              <CornerCell theme={theme} />
              {days.map((day, i) => (
                <HeaderCell key={i} theme={theme} $isToday={isToday(day)}>
                  {DAY_NAMES_EN[i]}<br />{day.getDate()}
                </HeaderCell>
              ))}

              <AllDayLabel theme={theme}>ALL<br/>DAY</AllDayLabel>
              {days.map((day, i) => (
                <AllDayCell key={i} theme={theme}>
                  {getFullDayEventsForDay(day).map((ev, j) => (
                    <AllDayPill key={j} $color={getEventColor(ev)} title={ev.summary}>
                      {ev.summary}
                    </AllDayPill>
                  ))}
                </AllDayCell>
              ))}

              {hours.map(hour => (
                <Fragment key={hour}>
                  <TimeCell theme={theme}>{String(hour).padStart(2, '0') + ':00'}</TimeCell>
                  {days.map((day, di) => (
                    <DayCell key={di} theme={theme} onClick={(e) => handleCellClick(day, hour, e)}>
                      {getEventsForCell(day, hour).map((event, ei) => {
                        const start = new Date(event.start.dateTime);
                        const end = new Date(event.end.dateTime);
                        const durationMins = (end - start) / (1000 * 60);
                        const heightPx = Math.max((durationMins / 60) * HOUR_HEIGHT, 16);
                        const topOffset = (start.getMinutes() / 60) * HOUR_HEIGHT;
                        return (
                          <EventBlock
                            key={ei}
                            $color={getEventColor(event)}
                            style={{ top: topOffset, height: heightPx }}
                            title={event.summary}
                          >
                            {event.summary}
                          </EventBlock>
                        );
                      })}
                      {getSlotsForCell(day, hour).map(s => {
                        const topOffset = (s.minute / 60) * HOUR_HEIGHT;
                        const heightPx = (SLOT_DURATION / 60) * HOUR_HEIGHT;
                        const end = addMinutes(s.hour, s.minute, SLOT_DURATION);
                        return (
                          <SelectedSlotBlock
                            key={'sel-' + s.idx}
                            style={{ top: topOffset, height: heightPx }}
                            onClick={e => removeSlot(s.idx, e)}
                          >
                            <span>{formatTime24(s.hour, s.minute)}-{formatTime24(end.h, end.m)}</span>
                            <RemoveSlotBtn>{'\u2715'}</RemoveSlotBtn>
                          </SelectedSlotBlock>
                        );
                      })}
                    </DayCell>
                  ))}
                </Fragment>
              ))}
            </Grid>
          )}
        </GridWrapper>

        <Footer theme={theme}>
          <SlotCount theme={theme}>
            {selectedSlots.length}/3 slot{selectedSlots.length !== 1 ? 's' : ''} selected
          </SlotCount>
          <ConfirmBtn disabled={selectedSlots.length === 0} onClick={handleConfirm}>
            {'\u2713'} Confirm
          </ConfirmBtn>
        </Footer>

        {resultText && (
          <ResultOverlay theme={theme}>
            <ResultBox theme={theme}>{resultText}</ResultBox>
            <ResultActions>
              <CopyAgainBtn onClick={handleCopyAgain}>Copy again</CopyAgainBtn>
              <DoneBtn theme={theme} onClick={handleClose}>Done</DoneBtn>
            </ResultActions>
          </ResultOverlay>
        )}
      </Modal>
    </Overlay>
  );
};

export default FreeSlotPickerModal;
