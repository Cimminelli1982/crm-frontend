import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaUserPlus, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const CATEGORY_OPTIONS = [
  'Professional Investor', 'Founder', 'Manager', 'Advisor', 'Friend and Family',
  'Team', 'Supplier', 'Media', 'Student', 'Institution', 'Other'
];

const KIT_OPTIONS = [
  'Not Set', 'Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch'
];

const WISHES_OPTIONS = [
  'no wishes set', 'whatsapp standard', 'email standard', 'email custom',
  'whatsapp custom', 'call', 'present', 'no wishes'
];

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const Modal = styled.div`
  background: ${p => p.theme === 'light' ? '#fff' : '#1F2937'};
  border-radius: 12px;
  width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${p => p.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  &:hover { background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'}; }
`;

const Body = styled.div`
  padding: 20px;
`;

const Field = styled.div`
  margin-bottom: 14px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${p => p.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${p => p.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  background: ${p => p.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${p => p.theme === 'light' ? '#111827' : '#F9FAFB'};
  box-sizing: border-box;
  outline: none;
  &:focus { border-color: #3B82F6; }
  &::placeholder { color: ${p => p.theme === 'light' ? '#9CA3AF' : '#6B7280'}; }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${p => p.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  background: ${p => p.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${p => p.theme === 'light' ? '#111827' : '#F9FAFB'};
  box-sizing: border-box;
  outline: none;
  &:focus { border-color: #3B82F6; }
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
`;

const ScoreRow = styled.div`
  display: flex;
  gap: 6px;
`;

const ScoreBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid ${p => p.$active ? '#3B82F6' : (p.theme === 'light' ? '#D1D5DB' : '#4B5563')};
  background: ${p => p.$active ? '#3B82F6' : 'transparent'};
  color: ${p => p.$active ? '#fff' : (p.theme === 'light' ? '#374151' : '#D1D5DB')};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { border-color: #3B82F6; }
`;

const Footer = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const CancelBtn = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid ${p => p.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: transparent;
  color: ${p => p.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 13px;
  cursor: pointer;
  &:hover { background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'}; }
`;

const SubmitBtn = styled.button`
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  background: #10B981;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: #059669; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SmartAddContactModal = ({ isOpen, onClose, theme, prefillEmail, prefillName }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [score, setScore] = useState(null);
  const [kit, setKit] = useState('Not Set');
  const [christmas, setChristmas] = useState('no wishes set');
  const [easter, setEaster] = useState('no wishes set');
  const [existingContact, setExistingContact] = useState(null);

  // Pre-fill from composer context + check for duplicates
  useEffect(() => {
    if (isOpen) {
      setExistingContact(null);
      if (prefillEmail) {
        setEmail(prefillEmail);
        // Check if email already exists in CRM
        supabase
          .from('contact_emails')
          .select('contact_id, email, contacts(contact_id, first_name, last_name, profile_image_url)')
          .ilike('email', prefillEmail.trim())
          .limit(1)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.contacts) {
              setExistingContact(data.contacts);
            }
          });
      }
      if (prefillName) {
        const parts = prefillName.trim().split(/\s+/);
        if (parts.length >= 2) {
          setFirstName(parts[0]);
          setLastName(parts.slice(1).join(' '));
        } else {
          setFirstName(parts[0] || '');
          setLastName('');
        }
      }
    }
  }, [isOpen, prefillEmail, prefillName]);

  // Also check when email changes manually
  useEffect(() => {
    if (!isOpen || !email.trim() || email === prefillEmail) return;
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('contact_emails')
        .select('contact_id, email, contacts(contact_id, first_name, last_name, profile_image_url)')
        .ilike('email', email.trim())
        .limit(1)
        .maybeSingle();
      setExistingContact(data?.contacts || null);
    }, 500);
    return () => clearTimeout(timeout);
  }, [email, isOpen, prefillEmail]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setCategory('');
    setScore(null);
    setKit('Not Set');
    setChristmas('no wishes set');
    setEaster('no wishes set');
    setExistingContact(null);
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!category) {
      toast.error('Category is required');
      return;
    }

    // Close modal immediately, fire & forget
    const contactName = `${firstName.trim()} ${lastName.trim()}`.trim();
    onClose();
    resetForm();

    toast.success(`${contactName} queued — agent is working. Check Data Quality when done.`, { duration: 3000 });

    // Fire and forget — no await
    fetch(`${BACKEND_URL}/contact/smart-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        category,
        score,
        keep_in_touch: kit,
        christmas,
        easter,
      }),
    })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          const dims = result.quality_report?.missing_dimensions || [];
          toast.success(`${contactName} — ${5 - dims.length}/5 dimensions complete`, { duration: 5000 });
        } else {
          toast.error(`${contactName} failed: ${result.error}`);
        }
      })
      .catch(err => {
        toast.error(`${contactName} failed: ${err.message}`);
      });
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal theme={theme} onClick={e => e.stopPropagation()}>
        <Header theme={theme}>
          <Title theme={theme}>
            <FaUserPlus size={16} style={{ color: '#10B981' }} />
            Smart Add Contact
          </Title>
          <CloseBtn theme={theme} onClick={onClose}><FaTimes size={14} /></CloseBtn>
        </Header>

        <Body>
          {existingContact && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '14px',
              borderRadius: '8px',
              background: theme === 'light' ? '#FEF3C7' : '#78350F',
              border: `1px solid ${theme === 'light' ? '#F59E0B' : '#D97706'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: theme === 'light' ? '#92400E' : '#FDE68A',
            }}>
              <FaExclamationTriangle size={14} style={{ flexShrink: 0 }} />
              <span>
                <strong>{existingContact.first_name} {existingContact.last_name}</strong> already exists with this email.
                Creating will make a duplicate.
              </span>
            </div>
          )}
          <Row>
            <Field style={{ flex: 1 }}>
              <Label theme={theme}>First Name *</Label>
              <Input
                theme={theme}
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                autoFocus
              />
            </Field>
            <Field style={{ flex: 1 }}>
              <Label theme={theme}>Last Name</Label>
              <Input
                theme={theme}
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </Field>
          </Row>

          <Field>
            <Label theme={theme}>Email *</Label>
            <Input
              theme={theme}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              type="email"
            />
          </Field>

          <Field>
            <Label theme={theme}>Category *</Label>
            <Select theme={theme} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>

          <Field>
            <Label theme={theme}>Score</Label>
            <ScoreRow>
              {[1, 2, 3, 4, 5].map(s => (
                <ScoreBtn
                  key={s}
                  theme={theme}
                  $active={score === s}
                  onClick={() => setScore(score === s ? null : s)}
                >
                  {s}
                </ScoreBtn>
              ))}
            </ScoreRow>
          </Field>

          <Field>
            <Label theme={theme}>Keep in Touch</Label>
            <Select theme={theme} value={kit} onChange={e => setKit(e.target.value)}>
              {KIT_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </Select>
          </Field>

          <Row>
            <Field style={{ flex: 1 }}>
              <Label theme={theme}>Christmas</Label>
              <Select theme={theme} value={christmas} onChange={e => setChristmas(e.target.value)}>
                {WISHES_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </Select>
            </Field>
            <Field style={{ flex: 1 }}>
              <Label theme={theme}>Easter</Label>
              <Select theme={theme} value={easter} onChange={e => setEaster(e.target.value)}>
                {WISHES_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </Select>
            </Field>
          </Row>
        </Body>

        <Footer theme={theme}>
          <CancelBtn theme={theme} onClick={() => { onClose(); resetForm(); }}>Cancel</CancelBtn>
          <SubmitBtn onClick={handleSubmit} disabled={!firstName.trim() || !email.trim() || !category}>
            <FaUserPlus size={12} />
            Create & Enrich
          </SubmitBtn>
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default SmartAddContactModal;
