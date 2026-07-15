import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaTimes, FaLink, FaSearch, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

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
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
`;

const EmailBadge = styled.div`
  padding: 10px 14px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: ${p => p.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  border: 1px solid ${p => p.theme === 'light' ? '#BFDBFE' : '#2563EB'};
  font-size: 13px;
  color: ${p => p.theme === 'light' ? '#1E40AF' : '#BFDBFE'};
`;

const SearchWrap = styled.div`
  position: relative;
  margin-bottom: 12px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${p => p.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  display: flex;
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 12px 9px 34px;
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

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ResultItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  &:hover { background: ${p => p.theme === 'light' ? '#F3F4F6' : '#374151'}; border-color: #3B82F6; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: ${p => p.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const Name = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${p => p.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const SubText = styled.div`
  font-size: 12px;
  color: ${p => p.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyText = styled.div`
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: ${p => p.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const LinkEmailToContactModal = ({ isOpen, onClose, theme, email, prefillName, onLinked }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState(null);

  // Seed the search box with the name from the email header
  useEffect(() => {
    if (isOpen) {
      setSearch(prefillName || '');
      setResults([]);
      setLinkingId(null);
    }
  }, [isOpen, prefillName]);

  const runSearch = useCallback(async (q) => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const tokens = term.split(/\s+/);
      let query = supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, profile_image_url, contact_emails(email)')
        .limit(10);

      if (tokens.length >= 2) {
        // "First Last" — match first name and last name separately
        query = query
          .ilike('first_name', `%${tokens[0]}%`)
          .ilike('last_name', `%${tokens.slice(1).join(' ')}%`);
      } else {
        query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('[LinkEmail] search error', err);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, isOpen, runSearch]);

  const handleLink = async (contact) => {
    if (!email) return;
    setLinkingId(contact.contact_id);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Guard: is this email already linked to this contact?
      const { data: existing } = await supabase
        .from('contact_emails')
        .select('email_id')
        .eq('contact_id', contact.contact_id)
        .ilike('email', cleanEmail)
        .limit(1)
        .maybeSingle();

      if (existing) {
        toast.success('Email already linked to this contact');
        onLinked && onLinked();
        onClose();
        return;
      }

      const { error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: contact.contact_id,
          email: cleanEmail,
          type: 'personal',
          is_primary: false,
        });
      if (error) throw error;

      toast.success(`${cleanEmail} linked to ${contact.first_name} ${contact.last_name || ''}`.trim());
      onLinked && onLinked();
      onClose();
    } catch (err) {
      console.error('[LinkEmail] link error', err);
      toast.error(`Failed to link: ${err.message}`);
    } finally {
      setLinkingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal theme={theme} onClick={e => e.stopPropagation()}>
        <Header theme={theme}>
          <Title theme={theme}>
            <FaLink size={15} style={{ color: '#3B82F6' }} />
            Link Email to Contact
          </Title>
          <CloseBtn theme={theme} onClick={onClose}><FaTimes size={14} /></CloseBtn>
        </Header>

        <Body>
          <EmailBadge theme={theme}>
            Linking <strong>{email}</strong> to an existing contact
          </EmailBadge>

          <SearchWrap>
            <SearchIcon theme={theme}><FaSearch size={12} /></SearchIcon>
            <Input
              theme={theme}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contact by name..."
              autoFocus
            />
          </SearchWrap>

          <ResultList>
            {loading && <EmptyText theme={theme}>Searching...</EmptyText>}
            {!loading && search.trim().length >= 2 && results.length === 0 && (
              <EmptyText theme={theme}>No contacts found</EmptyText>
            )}
            {!loading && search.trim().length < 2 && (
              <EmptyText theme={theme}>Type at least 2 characters to search</EmptyText>
            )}
            {!loading && results.map(c => {
              const emails = (c.contact_emails || []).map(e => e.email).filter(Boolean);
              return (
                <ResultItem
                  key={c.contact_id}
                  theme={theme}
                  disabled={linkingId === c.contact_id}
                  onClick={() => handleLink(c)}
                >
                  <Avatar theme={theme}>
                    {c.profile_image_url
                      ? <img src={c.profile_image_url} alt="" />
                      : <FaUser size={13} />}
                  </Avatar>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Name theme={theme}>{c.first_name} {c.last_name}</Name>
                    <SubText theme={theme}>
                      {linkingId === c.contact_id
                        ? 'Linking...'
                        : (emails.length > 0 ? emails.slice(0, 2).join(', ') : 'No email on file')}
                    </SubText>
                  </div>
                  <FaLink size={12} style={{ color: '#3B82F6', flexShrink: 0 }} />
                </ResultItem>
              );
            })}
          </ResultList>
        </Body>
      </Modal>
    </Overlay>
  );
};

export default LinkEmailToContactModal;
