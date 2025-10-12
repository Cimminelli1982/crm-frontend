import React from 'react';
import { FaHeart, FaCalendarAlt } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import {
  FormGroup,
  Label,
  Select,
  ClearButton,
  SaveButton
} from './StyledComponents';

const KeepInTouchTab = ({
  contact,
  frequency,
  setFrequency,
  birthdayDay,
  setBirthdayDay,
  birthdayMonth,
  setBirthdayMonth,
  ageEstimate,
  setAgeEstimate,
  christmasWishes,
  setChristmasWishes,
  easterWishes,
  setEasterWishes,
  handleSaveFrequency,
  handleSaveBirthday,
  handleSaveChristmasWishes,
  handleSaveEasterWishes,
  theme,
  shouldShowField,
  frequencyOptions = ['Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch']
}) => {
  const handleClearBirthday = async () => {
    if (!contact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: null })
        .eq('contact_id', contact.contact_id);
      if (error) throw error;
      setBirthdayDay('');
      setBirthdayMonth('');
      setAgeEstimate('');
      toast.success('Birthday cleared successfully!');
    } catch (error) {
      console.error('Error clearing birthday:', error);
      toast.error('Failed to clear birthday');
    }
  };

  return (
    <>
      {/* Keep in Touch Frequency */}
      {shouldShowField('frequency') && (
        <FormGroup>
          <Label theme={theme}>
            <FaHeart style={{ marginRight: '6px' }} />
            Keep in Touch Frequency
          </Label>
          <Select
            value={frequency}
            onChange={(e) => {
              const newFrequency = e.target.value;
              setFrequency(newFrequency);

              // If "Do not keep in touch" is selected, set both wishes to "no wishes"
              if (newFrequency === 'Do not keep in touch') {
                setChristmasWishes('no wishes');
                setEasterWishes('no wishes');
              }
              // Removed immediate save - will save with main Save Details button
            }}
            theme={theme}
          >
            <option value="">Select frequency...</option>
            {frequencyOptions.map(freq => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </Select>
        </FormGroup>
      )}

      {/* Date of Birth */}
      {shouldShowField('birthday') && (
        <FormGroup>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Label theme={theme} style={{ margin: 0 }}>
              <FaCalendarAlt style={{ marginRight: '6px' }} />
              Date of Birth
            </Label>
            <ClearButton
              onClick={handleClearBirthday}
              theme={theme}
            >
              <FiX size={14} />
            </ClearButton>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <Select
              value={birthdayDay}
              onChange={(e) => setBirthdayDay(e.target.value)}
              theme={theme}
              style={{ flex: 1 }}
            >
              <option value="">Day</option>
              {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </Select>

            <Select
              value={birthdayMonth}
              onChange={(e) => setBirthdayMonth(e.target.value)}
              theme={theme}
              style={{ flex: 1 }}
            >
              <option value="">Month</option>
              {['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
                <option key={i} value={i + 1}>{month}</option>
              ))}
            </Select>
          </div>

          <Select
            value={ageEstimate}
            onChange={(e) => setAgeEstimate(e.target.value)}
            theme={theme}
          >
            <option value="">Age estimate (for birthday calculation)</option>
            {[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
            <option value="80+">80+</option>
          </Select>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <SaveButton onClick={handleSaveBirthday}>
              Save Birthday
            </SaveButton>
          </div>
        </FormGroup>
      )}

      {/* Christmas Wishes */}
      {shouldShowField('christmas') && (
        <FormGroup>
          <Label theme={theme}>
            🎄 Christmas Wishes
          </Label>
          <Select
            value={christmasWishes}
            onChange={(e) => {
              setChristmasWishes(e.target.value);
              // Removed immediate save - will save with main Save Details button
            }}
            theme={theme}
          >
            <option value="">Select Christmas wishes...</option>
            <option value="no wishes set">Not set</option>
            <option value="no wishes">No wishes</option>
            <option value="whatsapp standard">WhatsApp standard</option>
            <option value="email standard">Email standard</option>
            <option value="email custom">Email custom</option>
            <option value="whatsapp custom">WhatsApp custom</option>
            <option value="call">Call</option>
            <option value="present">Present</option>
          </Select>
        </FormGroup>
      )}

      {/* Easter Wishes */}
      {shouldShowField('easter') && (
        <FormGroup>
          <Label theme={theme}>
            🐰 Easter Wishes
          </Label>
          <Select
            value={easterWishes}
            onChange={(e) => {
              setEasterWishes(e.target.value);
              // Removed immediate save - will save with main Save Details button
            }}
            theme={theme}
          >
            <option value="">Select Easter wishes...</option>
            <option value="no wishes set">Not set</option>
            <option value="no wishes">No wishes</option>
            <option value="whatsapp standard">WhatsApp standard</option>
            <option value="email standard">Email standard</option>
            <option value="email custom">Email custom</option>
            <option value="whatsapp custom">WhatsApp custom</option>
            <option value="call">Call</option>
            <option value="present">Present</option>
          </Select>

          {/* Quick Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '10px'
          }}>
            {/* WhatsApp Standard Quick Button */}
            <button
              onClick={() => {
                setChristmasWishes('whatsapp standard');
                setEasterWishes('whatsapp standard');
                toast.success('Set both to WhatsApp Standard');
              }}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#20B858';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#25D366';
              }}
            >
              WhatsApp Standard 🎄🐰
            </button>

            {/* No Wishes Quick Button */}
            <button
              onClick={() => {
                setChristmasWishes('no wishes');
                setEasterWishes('no wishes');
                toast.success('Set both to No wishes');
              }}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: theme === 'light' ? '#E5E7EB' : '#374151',
                color: theme === 'light' ? '#4B5563' : '#9CA3AF',
                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme === 'light' ? '#D1D5DB' : '#4B5563';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme === 'light' ? '#E5E7EB' : '#374151';
              }}
            >
              No wishes 🚫
            </button>
          </div>
        </FormGroup>
      )}
    </>
  );
};

export default KeepInTouchTab;