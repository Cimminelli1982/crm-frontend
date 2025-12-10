import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { FaPhone, FaPlus, FaTrash } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Styled Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
`;

const AddItemRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563EB;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MobileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MobileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
`;

const MobileIcon = styled.div`
  color: #10B981;
  display: flex;
  align-items: center;
`;

const MobileContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MobileText = styled.span`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
`;

const PrimaryBadge = styled.span`
  background: #10B981;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
`;

const PrimaryRadio = styled.input`
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #10B981;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    background: #FEE2E2;
    color: #DC2626;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 14px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const DoneButton = styled.button`
  padding: 10px 20px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563EB;
  }
`;

const ManageContactMobilesModal = ({
  isOpen,
  onClose,
  contact,
  theme = 'light',
  onMobilesUpdated
}) => {
  const [mobiles, setMobiles] = useState([]);
  const [newMobile, setNewMobile] = useState('');
  const [newMobileType, setNewMobileType] = useState('personal');
  const [loading, setLoading] = useState(false);

  // Load mobiles when modal opens
  useEffect(() => {
    if (isOpen && contact?.contact_id) {
      loadMobiles();
    }
  }, [isOpen, contact?.contact_id]);

  const loadMobiles = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_mobiles')
        .select('*')
        .eq('contact_id', contact.contact_id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setMobiles(data || []);
    } catch (error) {
      console.error('Error loading mobiles:', error);
      toast.error('Failed to load mobile numbers');
    }
  };

  const handleAddMobile = async () => {
    if (!newMobile.trim()) return;

    // Check for duplicate
    if (mobiles.some(m => m.mobile === newMobile.trim())) {
      toast.error('This mobile number already exists');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_mobiles')
        .insert({
          contact_id: contact.contact_id,
          mobile: newMobile.trim(),
          type: newMobileType,
          is_primary: mobiles.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      setMobiles([...mobiles, data]);
      setNewMobile('');
      toast.success('Mobile number added');
      onMobilesUpdated?.();
    } catch (error) {
      console.error('Error adding mobile:', error);
      toast.error('Failed to add mobile number');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMobile = async (mobileId) => {
    const mobileToRemove = mobiles.find(m => m.mobile_id === mobileId);

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_mobiles')
        .delete()
        .eq('mobile_id', mobileId);

      if (error) throw error;

      const updatedMobiles = mobiles.filter(m => m.mobile_id !== mobileId);

      // If we removed the primary mobile, set the first remaining one as primary
      if (mobileToRemove?.is_primary && updatedMobiles.length > 0) {
        await handleSetPrimary(updatedMobiles[0].mobile_id);
      } else {
        setMobiles(updatedMobiles);
      }

      toast.success('Mobile number removed');
      onMobilesUpdated?.();
    } catch (error) {
      console.error('Error removing mobile:', error);
      toast.error('Failed to remove mobile number');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (mobileId) => {
    setLoading(true);
    try {
      // First, set all mobiles to non-primary
      await supabase
        .from('contact_mobiles')
        .update({ is_primary: false })
        .eq('contact_id', contact.contact_id);

      // Then set the selected one as primary
      const { error } = await supabase
        .from('contact_mobiles')
        .update({ is_primary: true })
        .eq('mobile_id', mobileId);

      if (error) throw error;

      setMobiles(mobiles.map(m => ({
        ...m,
        is_primary: m.mobile_id === mobileId
      })));

      toast.success('Primary mobile updated');
      onMobilesUpdated?.();
    } catch (error) {
      console.error('Error setting primary mobile:', error);
      toast.error('Failed to update primary mobile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateType = async (mobileId, newType) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_mobiles')
        .update({ type: newType })
        .eq('mobile_id', mobileId);

      if (error) throw error;

      setMobiles(mobiles.map(m =>
        m.mobile_id === mobileId ? { ...m, type: newType } : m
      ));
      onMobilesUpdated?.();
    } catch (error) {
      console.error('Error updating mobile type:', error);
      toast.error('Failed to update mobile type');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddMobile();
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
          padding: 0,
          border: 'none',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'hidden',
          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100
        }
      }}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>Manage Mobile Numbers</ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>
          <FiX size={20} />
        </CloseButton>
      </ModalHeader>

      <ModalBody theme={theme}>
        {/* Add New Mobile */}
        <AddItemRow>
          <Input
            type="tel"
            value={newMobile}
            onChange={(e) => setNewMobile(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add mobile number..."
            theme={theme}
            disabled={loading}
          />
          <Select
            value={newMobileType}
            onChange={(e) => setNewMobileType(e.target.value)}
            theme={theme}
            disabled={loading}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="other">Other</option>
          </Select>
          <AddButton onClick={handleAddMobile} disabled={loading || !newMobile.trim()}>
            <FaPlus size={12} />
            Add
          </AddButton>
        </AddItemRow>

        {/* Mobile List */}
        <MobileList>
          {mobiles.length > 0 ? (
            mobiles.map((mobileData) => (
              <MobileItem key={mobileData.mobile_id} theme={theme}>
                <MobileIcon>
                  <FaPhone size={14} />
                </MobileIcon>
                <MobileContent>
                  <MobileText theme={theme}>{mobileData.mobile}</MobileText>
                  {mobileData.is_primary && <PrimaryBadge>PRIMARY</PrimaryBadge>}
                </MobileContent>
                <Select
                  value={mobileData.type || 'personal'}
                  onChange={(e) => handleUpdateType(mobileData.mobile_id, e.target.value)}
                  theme={theme}
                  style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
                  disabled={loading}
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="other">Other</option>
                </Select>
                <PrimaryRadio
                  type="radio"
                  name="primaryMobile"
                  checked={mobileData.is_primary}
                  onChange={() => handleSetPrimary(mobileData.mobile_id)}
                  title="Set as primary"
                  disabled={loading}
                />
                <DeleteButton
                  theme={theme}
                  onClick={() => handleRemoveMobile(mobileData.mobile_id)}
                  disabled={loading}
                  title="Remove mobile"
                >
                  <FaTrash size={14} />
                </DeleteButton>
              </MobileItem>
            ))
          ) : (
            <EmptyState theme={theme}>
              <FaPhone size={24} />
              <span>No mobile numbers added yet</span>
            </EmptyState>
          )}
        </MobileList>
      </ModalBody>

      <ModalFooter theme={theme}>
        <DoneButton onClick={onClose}>Done</DoneButton>
      </ModalFooter>
    </Modal>
  );
};

export default ManageContactMobilesModal;
