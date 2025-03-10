import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

const KeepInTouchModal = ({ isOpen, onRequestClose, contact }) => {
  const [activeTab, setActiveTab] = useState('Frequency');
  const [frequency, setFrequency] = useState(contact.keep_in_touch_frequency || '');
  const [birthdayDate, setBirthdayDate] = useState(contact.birthday_date || '');
  const [birthdayWishes, setBirthdayWishes] = useState(contact.birthday_wishes || 'No wishes');
  const [christmasWishes, setChristmasWishes] = useState(contact.christmas_wishes || 'No wishes');
  const [easterWishes, setEasterWishes] = useState(contact.easter_wishes || 'No wishes');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('N/A');

  useEffect(() => {
    setFrequency(contact.keep_in_touch_frequency || '');
    setBirthdayDate(contact.birthday_date || '');
    setBirthdayWishes(contact.birthday_wishes || 'No wishes');
    setChristmasWishes(contact.christmas_wishes || 'No wishes');
    setEasterWishes(contact.easter_wishes || 'No wishes');
    calculateNextFollowUp(contact.keep_in_touch_frequency);
  }, [contact]);

  const calculateNextFollowUp = (selectedFrequency) => {
    const today = new Date();
    let nextDate = 'N/A';
    switch (selectedFrequency) {
      case 'Weekly':
        nextDate = new Date(today.setDate(today.getDate() + 7));
        break;
      case 'Monthly':
        nextDate = new Date(today.setMonth(today.getMonth() + 1));
        break;
      case 'Quarterly':
        nextDate = new Date(today.setMonth(today.getMonth() + 3));
        break;
      case 'Twice per Year':
        nextDate = new Date(today.setMonth(today.getMonth() + 6));
        break;
      case 'Once per Year':
        nextDate = new Date(today.setFullYear(today.getFullYear() + 1));
        break;
      default:
        nextDate = 'N/A';
    }
    setNextFollowUp(nextDate !== 'N/A' ? nextDate.toLocaleDateString() : 'N/A');
  };

  const handleSave = async () => {
    if (!frequency && christmasWishes === 'No wishes' && easterWishes === 'No wishes' && (birthdayWishes === 'No wishes' || !birthdayWishes)) {
      setErrorMessage('Please enter at least one wish or frequency');
      return;
    }
    if (birthdayWishes !== 'No wishes' && !birthdayDate) {
      setErrorMessage('Please enter a birthday date if you select birthday wishes');
      return;
    }
    setLoading(true);
    try {
      const updateData = {
        keep_in_touch_frequency: frequency,
        birthday_wishes: birthdayWishes,
        christmas_wishes: christmasWishes,
        easter_wishes: easterWishes
      };
      if (birthdayWishes !== 'No wishes' && birthdayDate) {
        updateData.birthday = birthdayDate;
      }
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id);
      if (error) throw error;
      setSuccessMessage('Frequency or Wishes updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Supabase update error:', error);
      setErrorMessage('Error updating data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '90%',
          minHeight: '450px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', marginBottom: '15px' }}>
          <button
            onClick={() => setActiveTab('Frequency')}
            style={{
              backgroundColor: activeTab === 'Frequency' ? '#007BFF' : '#E9ECEF',
              color: activeTab === 'Frequency' ? '#fff' : '#000',
              padding: '8px',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              marginRight: '5px',
              ':hover': { backgroundColor: '#0056b3' }
            }}
          >
            Frequency
          </button>
          <button
            onClick={() => setActiveTab('Wishes')}
            style={{
              backgroundColor: activeTab === 'Wishes' ? '#007BFF' : '#E9ECEF',
              color: activeTab === 'Wishes' ? '#fff' : '#000',
              padding: '8px',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              ':hover': { backgroundColor: '#0056b3' }
            }}
          >
            Wishes
          </button>
        </div>
        {activeTab === 'Frequency' && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Actual Keep in Touch Frequency:</label>
              <div style={{ backgroundColor: '#E9ECEF', padding: '5px', borderRadius: '2px', marginTop: '5px' }}>
                {contact.keep_in_touch_frequency || 'Not set'}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Select New Keep in Touch Frequency:</label>
              <select
                aria-label="Keep in Touch frequency dropdown"
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value);
                  setErrorMessage('');
                  calculateNextFollowUp(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  border: '1px solid #ced4da',
                  transition: 'background-color 0.2s',
                  ':hover': { backgroundColor: '#E6F0FA' }
                }}
              >
                <option value="">Choose a frequency</option>
                <option value="Do not keep in touch">Do not keep in touch</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Twice per Year">Twice per Year</option>
                <option value="Once per Year">Once per Year</option>
              </select>
            </div>
            <p style={{ fontSize: '12px' }}>Next follow-up: {nextFollowUp}</p>
          </div>
        )}
        {activeTab === 'Wishes' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span style={{ marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                Birthday date: {contact.birthday || '-'}
                {contact.birthday && (
                  <button
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase
                        .from('contacts')
                        .update({ birthday: null })
                        .eq('id', contact.id);
                      if (error) {
                        setErrorMessage('Error resetting birthday date');
                      } else {
                        const { data, error: fetchError } = await supabase
                          .from('contacts')
                          .select('birthday')
                          .eq('id', contact.id)
                          .single();
                        if (fetchError) {
                          setErrorMessage('Error fetching updated birthday');
                        } else {
                          setBirthdayDate(data.birthday);
                          setSuccessMessage('Birthday date reset successfully');
                        }
                      }
                      setLoading(false);
                    }}
                    style={{
                      marginLeft: '10px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Reset Birthday
                  </button>
                )}
              </span>
              <input
                type="text"
                aria-label="Birthday date input"
                value={birthdayDate || ''}
                onChange={(e) => setBirthdayDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  border: '1px solid #ced4da',
                  boxSizing: 'border-box'
                }}
              />
              {birthdayDate && (
                <button
                  onClick={() => setBirthdayDate('')}
                  style={{
                    marginTop: '5px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#007BFF',
                    fontSize: '16px'
                  }}
                >
                  x
                </button>
              )}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Birthday Wishes:</label>
              <select
                aria-label="Wishes dropdown"
                value={birthdayWishes}
                onChange={(e) => setBirthdayWishes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  border: '1px solid #ced4da',
                  transition: 'background-color 0.2s',
                  ':hover': { backgroundColor: '#E6F0FA' }
                }}
              >
                <option value="No wishes">No wishes</option>
                <option value="LinkedIn message">LinkedIn message</option>
                <option value="Email message">Email message</option>
                <option value="WhatsApp message">WhatsApp message</option>
                <option value="Call">Call</option>
                <option value="Send a present/card">Send a present/card</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Christmas Wishes:</label>
              <select
                aria-label="Wishes dropdown"
                value={christmasWishes}
                onChange={(e) => setChristmasWishes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  border: '1px solid #ced4da',
                  transition: 'background-color 0.2s',
                  ':hover': { backgroundColor: '#E6F0FA' }
                }}
              >
                <option value="No wishes">No wishes</option>
                <option value="LinkedIn message">LinkedIn message</option>
                <option value="Email message">Email message</option>
                <option value="WhatsApp message">WhatsApp message</option>
                <option value="Call">Call</option>
                <option value="Send a present/card">Send a present/card</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Easter Wishes:</label>
              <select
                aria-label="Wishes dropdown"
                value={easterWishes}
                onChange={(e) => setEasterWishes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  border: '1px solid #ced4da',
                  transition: 'background-color 0.2s',
                  ':hover': { backgroundColor: '#E6F0FA' }
                }}
              >
                <option value="No wishes">No wishes</option>
                <option value="LinkedIn message">LinkedIn message</option>
                <option value="Email message">Email message</option>
                <option value="WhatsApp message">WhatsApp message</option>
                <option value="Call">Call</option>
                <option value="Send a present/card">Send a present/card</option>
              </select>
            </div>
          </div>
        )}
        {errorMessage && <p style={{ color: 'red', fontSize: '12px' }}>{errorMessage}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#007BFF',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              ':hover': { backgroundColor: '#0056b3' }
            }}
          >
            Save
          </button>
          <button
            onClick={onRequestClose}
            style={{
              backgroundColor: '#6C757D',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              ':hover': { backgroundColor: '#5A6268' }
            }}
          >
            Discard
          </button>
        </div>
        {successMessage && <p style={{ color: 'green', fontSize: '12px' }}>{successMessage}</p>}
        {loading && <div style={{ textAlign: 'center', marginTop: '10px' }}><div className="spinner" style={{ width: '20px', height: '20px', border: '3px solid #f3f3f3', borderTop: '3px solid #007BFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>}
      </div>
    </Modal>
  );
};

export default KeepInTouchModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 