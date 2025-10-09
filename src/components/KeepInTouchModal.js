import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { FaHeart, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import {
  FrequencyModalContent,
  FrequencyModalHeader,
  FrequencyModalCloseButton,
  FrequencyModalBody
} from './ContactsListDRY.styles';

const KeepInTouchModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  onContactUpdate
}) => {
  const [formData, setFormData] = useState({
    frequency: '',
    birthday: '',
    birthdayDay: '',
    birthdayMonth: '',
    ageEstimate: '',
    christmasWishes: '',
    easterWishes: ''
  });

  // Load existing keep in touch data when modal opens
  useEffect(() => {
    if (isOpen && contact) {
      loadKeepInTouchData();
    }
  }, [isOpen, contact]);

  const loadKeepInTouchData = async () => {
    if (!contact) return;

    try {
      const { data: existingKeepInTouchData, error } = await supabase
        .from('keep_in_touch')
        .select('frequency, christmas, easter')
        .eq('contact_id', contact.contact_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading keep in touch data:', error);
      }

      // Pre-populate form with existing data
      const birthdayComponents = parseBirthdayIntoComponents(contact.birthday);
      setFormData({
        frequency: existingKeepInTouchData?.frequency || '',
        birthday: contact.birthday || '',
        birthdayDay: birthdayComponents.day,
        birthdayMonth: birthdayComponents.month,
        ageEstimate: birthdayComponents.ageEstimate,
        christmasWishes: existingKeepInTouchData?.christmas || '',
        easterWishes: existingKeepInTouchData?.easter || ''
      });
    } catch (error) {
      console.error('Error loading keep in touch data:', error);
      // Set default values if loading fails
      const birthdayComponents = parseBirthdayIntoComponents(contact.birthday);
      setFormData({
        frequency: '',
        birthday: contact.birthday || '',
        birthdayDay: birthdayComponents.day,
        birthdayMonth: birthdayComponents.month,
        ageEstimate: birthdayComponents.ageEstimate,
        christmasWishes: '',
        easterWishes: ''
      });
    }
  };

  // Calculate birthday from day, month and age estimate
  const calculateBirthdayFromComponents = (day, month, ageEstimate) => {
    if (!day || !month || !ageEstimate) return '';

    const currentYear = new Date().getFullYear();
    let birthYear;

    if (ageEstimate === '80+') {
      birthYear = currentYear - 85; // Use 85 as average for 80+
    } else {
      birthYear = currentYear - parseInt(ageEstimate);
    }

    // Format as YYYY-MM-DD for database storage
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    return `${birthYear}-${paddedMonth}-${paddedDay}`;
  };

  // Parse existing birthday into components
  const parseBirthdayIntoComponents = (birthday) => {
    if (!birthday) return { day: '', month: '', ageEstimate: '' };

    try {
      const date = new Date(birthday);
      const currentYear = new Date().getFullYear();
      const birthYear = date.getFullYear();
      const age = currentYear - birthYear;

      // Find closest age estimate
      const ageOptions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      let closestAge = '80+';

      if (age <= 82) {
        closestAge = ageOptions.reduce((prev, curr) =>
          Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
        ).toString();
      }

      return {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        ageEstimate: closestAge
      };
    } catch (error) {
      console.error('Error parsing birthday:', error);
      return { day: '', month: '', ageEstimate: '' };
    }
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-calculate birthday when any component changes
      if (['birthdayDay', 'birthdayMonth', 'ageEstimate'].includes(field)) {
        const day = field === 'birthdayDay' ? value : prev.birthdayDay;
        const month = field === 'birthdayMonth' ? value : prev.birthdayMonth;
        const age = field === 'ageEstimate' ? value : prev.ageEstimate;

        updated.birthday = calculateBirthdayFromComponents(day, month, age);
      }

      return updated;
    });
  };

  // Handle saving keep in touch data
  const handleSave = async () => {
    if (!contact) return;

    try {
      // Update birthday in contacts table - handle empty strings properly
      const birthdayValue = formData.birthday && formData.birthday.trim() !== ''
                           ? formData.birthday
                           : null;

      if (birthdayValue !== contact.birthday) {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({ birthday: birthdayValue })
          .eq('contact_id', contact.contact_id);

        if (contactError) throw contactError;
      }

      // Check if keep_in_touch record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contact.contact_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Prepare keep in touch data - handle NULL and empty values properly
      const keepInTouchUpdateData = {
        contact_id: contact.contact_id,
        frequency: formData.frequency && formData.frequency.trim() !== ''
                  ? formData.frequency
                  : 'Not Set',
        christmas: formData.christmasWishes && formData.christmasWishes.trim() !== ''
                  ? formData.christmasWishes
                  : 'no wishes set',
        easter: formData.easterWishes && formData.easterWishes.trim() !== ''
                ? formData.easterWishes
                : 'no wishes set'
      };

      let keepInTouchError;
      if (existingRecord) {
        // Update existing record
        ({ error: keepInTouchError } = await supabase
          .from('keep_in_touch')
          .update(keepInTouchUpdateData)
          .eq('contact_id', contact.contact_id));
      } else {
        // Insert new record
        ({ error: keepInTouchError } = await supabase
          .from('keep_in_touch')
          .insert(keepInTouchUpdateData));
      }

      if (keepInTouchError) throw keepInTouchError;

      toast.success('Keep in Touch data updated successfully!');
      onClose();

      // Refresh data if callback provided
      if (onContactUpdate) {
        onContactUpdate();
      }
    } catch (error) {
      console.error('Error updating keep in touch data:', error);
      toast.error('Failed to update keep in touch data: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle clearing birthday
  const handleClearBirthday = async () => {
    try {
      // Clear birthday in database
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: null })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      // Clear form fields
      setFormData(prev => ({
        ...prev,
        birthday: '',
        birthdayDay: '',
        birthdayMonth: '',
        ageEstimate: ''
      }));

      toast.success('Birthday cleared successfully!');
    } catch (error) {
      console.error('Error clearing birthday:', error);
      toast.error('Failed to clear birthday');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '0',
          border: 'none',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          background: 'transparent'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <FrequencyModalContent theme={theme}>
        <FrequencyModalHeader theme={theme}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Keep in Touch Settings</h3>
          <FrequencyModalCloseButton
            onClick={onClose}
            theme={theme}
          >
            <FiX />
          </FrequencyModalCloseButton>
        </FrequencyModalHeader>
        <FrequencyModalBody>
          <div style={{ padding: '20px' }}>

            {/* Keep in Touch Frequency */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                <FaHeart style={{ marginRight: '6px' }} />
                Keep in Touch Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleFormChange('frequency', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '6px',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                  color: theme === 'light' ? '#111827' : '#F9FAFB',
                  fontSize: '14px'
                }}
              >
                <option value="">Select frequency...</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Twice per Year">Twice per Year</option>
                <option value="Once per Year">Once per Year</option>
                <option value="Do not keep in touch">Do not keep in touch</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  <FaCalendarAlt style={{ marginRight: '6px' }} />
                  Date of Birth
                </label>
                <button
                  onClick={handleClearBirthday}
                  style={{
                    padding: '4px 6px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: theme === 'light' ? '#EF4444' : '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: '500'
                  }}
                  title="Clear birthday"
                >
                  <FiX size={14} />
                </button>
              </div>

              {/* Day and Month dropdowns in same row */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                  value={formData.birthdayDay}
                  onChange={(e) => handleFormChange('birthdayDay', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Day</option>
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>

                <select
                  value={formData.birthdayMonth}
                  onChange={(e) => handleFormChange('birthdayMonth', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              {/* Age estimate dropdown */}
              <select
                value={formData.ageEstimate}
                onChange={(e) => handleFormChange('ageEstimate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '6px',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                  color: theme === 'light' ? '#111827' : '#F9FAFB',
                  fontSize: '14px'
                }}
              >
                <option value="">Age estimate (for birthday calculation)</option>
                <option value="20">20</option>
                <option value="25">25</option>
                <option value="30">30</option>
                <option value="35">35</option>
                <option value="40">40</option>
                <option value="45">45</option>
                <option value="50">50</option>
                <option value="55">55</option>
                <option value="60">60</option>
                <option value="65">65</option>
                <option value="70">70</option>
                <option value="75">75</option>
                <option value="80">80</option>
                <option value="80+">80+</option>
              </select>
            </div>

            {/* Christmas Wishes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                🎄 Christmas Wishes
              </label>
              <select
                value={formData.christmasWishes}
                onChange={(e) => handleFormChange('christmasWishes', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '6px',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                  color: theme === 'light' ? '#111827' : '#F9FAFB',
                  fontSize: '14px'
                }}
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
              </select>
            </div>

            {/* Easter Wishes */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                🐰 Easter Wishes
              </label>
              <select
                value={formData.easterWishes}
                onChange={(e) => handleFormChange('easterWishes', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '6px',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                  color: theme === 'light' ? '#111827' : '#F9FAFB',
                  fontSize: '14px'
                }}
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
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </FrequencyModalBody>
      </FrequencyModalContent>
    </Modal>
  );
};

export default KeepInTouchModal;