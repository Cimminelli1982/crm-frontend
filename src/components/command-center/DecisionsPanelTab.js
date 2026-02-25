import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaGavel, FaTrash, FaChevronDown, FaChevronUp, FaStar, FaSave } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const CATEGORIES = ['Investment', 'Team', 'Time', 'Money', 'Family'];

const CATEGORY_COLORS = {
  Investment: { bg: '#DBEAFE', color: '#1D4ED8', darkBg: '#1E3A5F' },
  Team: { bg: '#D1FAE5', color: '#059669', darkBg: '#064E3B' },
  Time: { bg: '#FEF3C7', color: '#D97706', darkBg: '#78350F' },
  Money: { bg: '#E9D5FF', color: '#7C3AED', darkBg: '#4C1D95' },
  Family: { bg: '#FCE7F3', color: '#DB2777', darkBg: '#831843' },
};

const FormSection = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#FFFFFF'};
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;

  &:focus {
    outline: none;
    border-color: #8B5CF6;
  }

  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#6B7280' : '#9CA3AF'};
  }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const Chip = styled.button`
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid ${props => props.$active ? 'transparent' : (props.theme === 'dark' ? '#374151' : '#E5E7EB')};
  background: ${props => props.$active
    ? (props.theme === 'dark' ? props.$darkBg : props.$bg)
    : (props.theme === 'dark' ? '#1F2937' : '#F9FAFB')};
  color: ${props => props.$active
    ? props.$color
    : (props.theme === 'dark' ? '#9CA3AF' : '#6B7280')};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${props => props.theme === 'dark' ? props.$darkBg : props.$bg};
    color: ${props => props.$color};
  }
`;

const StarsRow = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  align-items: center;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: ${props => props.$filled ? '#F59E0B' : (props.theme === 'dark' ? '#4B5563' : '#D1D5DB')};
  font-size: 16px;
  transition: color 0.1s;

  &:hover {
    color: #F59E0B;
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #8B5CF6;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #7C3AED;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DecisionCard = styled.div`
  padding: 10px 14px;
  margin: 6px 12px;
  border-radius: 8px;
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${props => props.theme === 'dark' ? '#4B5563' : '#D1D5DB'};
  }
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  background: ${props => props.theme === 'dark' ? props.$darkBg : props.$bg};
  color: ${props => props.$color};
`;

const DecisionsPanelTab = ({ theme, contactId, contactName }) => {
  // Form state
  const [detail, setDetail] = useState('');
  const [category, setCategory] = useState('Investment');
  const [confidence, setConfidence] = useState(3);
  const [decisionDate, setDecisionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);

  // List state
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDecisionId, setExpandedDecisionId] = useState(null);

  const fetchDecisions = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const { data: links, error: linksErr } = await supabase
        .from('decision_contacts')
        .select('decision_id')
        .eq('contact_id', contactId);

      if (linksErr) throw linksErr;

      if (!links || links.length === 0) {
        setDecisions([]);
        setLoading(false);
        return;
      }

      const decisionIds = links.map(l => l.decision_id);
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .in('decision_id', decisionIds)
        .order('decision_date', { ascending: false });

      if (error) throw error;
      setDecisions(data || []);
    } catch (err) {
      console.error('Error fetching decisions:', err);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const handleSave = async () => {
    if (!detail.trim()) {
      toast.error('Detail is required');
      return;
    }
    if (!contactId) {
      toast.error('No contact selected');
      return;
    }

    setSaving(true);
    try {
      const { data: newDecision, error: insertErr } = await supabase
        .from('decisions')
        .insert({
          detail: detail.trim(),
          category,
          confidence,
          decision_date: decisionDate,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      const { error: linkErr } = await supabase
        .from('decision_contacts')
        .insert({
          decision_id: newDecision.decision_id,
          contact_id: contactId,
        });

      if (linkErr) throw linkErr;

      toast.success('Decision saved');
      // Reset form
      setDetail('');
      setCategory('Investment');
      setConfidence(3);
      setDecisionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setShowNotes(false);
      // Refresh list
      fetchDecisions();
    } catch (err) {
      console.error('Error saving decision:', err);
      toast.error('Failed to save decision');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (decisionId, e) => {
    e.stopPropagation();
    try {
      // Remove from junction first, then delete decision itself
      await supabase
        .from('decision_contacts')
        .delete()
        .eq('decision_id', decisionId)
        .eq('contact_id', contactId);

      // Check if any other links exist
      const { data: remaining } = await supabase
        .from('decision_contacts')
        .select('id')
        .eq('decision_id', decisionId);

      const { data: remainingCompanies } = await supabase
        .from('decision_companies')
        .select('id')
        .eq('decision_id', decisionId);

      const { data: remainingDeals } = await supabase
        .from('decision_deals')
        .select('id')
        .eq('decision_id', decisionId);

      const totalLinks = (remaining?.length || 0) + (remainingCompanies?.length || 0) + (remainingDeals?.length || 0);

      if (totalLinks === 0) {
        // No more links, delete the decision
        await supabase.from('decisions').delete().eq('decision_id', decisionId);
        toast.success('Decision deleted');
      } else {
        toast.success('Unlinked from contact');
      }

      fetchDecisions();
    } catch (err) {
      console.error('Error deleting decision:', err);
      toast.error('Failed to delete');
    }
  };

  const renderStars = (count, size = 11) => (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <FaStar
          key={i}
          size={size}
          style={{ color: i <= count ? '#F59E0B' : (theme === 'dark' ? '#4B5563' : '#D1D5DB') }}
        />
      ))}
    </span>
  );

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Form */}
      <FormSection theme={theme}>
        <TextArea
          theme={theme}
          placeholder="What did you decide?"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={2}
        />

        {/* Category chips */}
        <ChipRow>
          {CATEGORIES.map(cat => {
            const colors = CATEGORY_COLORS[cat];
            return (
              <Chip
                key={cat}
                theme={theme}
                $active={category === cat}
                $bg={colors.bg}
                $color={colors.color}
                $darkBg={colors.darkBg}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Chip>
            );
          })}
        </ChipRow>

        {/* Confidence stars */}
        <StarsRow>
          <span style={{
            fontSize: '11px',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
            marginRight: '6px',
          }}>
            Confidence
          </span>
          {[1, 2, 3, 4, 5].map(i => (
            <StarButton
              key={i}
              theme={theme}
              $filled={i <= confidence}
              onClick={() => setConfidence(i)}
            >
              <FaStar />
            </StarButton>
          ))}
        </StarsRow>

        {/* Date + Notes toggle row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <input
            type="date"
            value={decisionDate}
            onChange={(e) => setDecisionDate(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
              fontSize: '12px',
            }}
          />
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              background: 'none',
              border: 'none',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {showNotes ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
            Notes
          </button>
        </div>

        {/* Notes textarea (collapsable) */}
        {showNotes && (
          <TextArea
            theme={theme}
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ marginTop: '8px', minHeight: '40px' }}
          />
        )}

        <SaveButton onClick={handleSave} disabled={saving || !detail.trim()}>
          <FaSave size={12} />
          {saving ? 'Saving...' : 'Save Decision'}
        </SaveButton>
      </FormSection>

      {/* Decisions list */}
      <div style={{ flex: 1, overflow: 'auto', paddingTop: '6px', paddingBottom: '12px' }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            fontSize: '13px',
          }}>
            Loading...
          </div>
        ) : decisions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 20px',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          }}>
            <FaGavel size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
            <div style={{ fontSize: '13px' }}>No decisions yet</div>
          </div>
        ) : (
          decisions.map(d => {
            const isExpanded = expandedDecisionId === d.decision_id;
            const colors = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.Investment;
            return (
              <DecisionCard
                key={d.decision_id}
                theme={theme}
                onClick={() => setExpandedDecisionId(isExpanded ? null : d.decision_id)}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    lineHeight: '1.4',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    ...(!isExpanded ? { whiteSpace: 'nowrap' } : {}),
                  }}>
                    {d.detail}
                  </div>
                  <FaTrash
                    size={10}
                    style={{
                      cursor: 'pointer',
                      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                      flexShrink: 0,
                      marginTop: '3px',
                    }}
                    onClick={(e) => handleDelete(d.decision_id, e)}
                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  />
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <CategoryBadge
                    theme={theme}
                    $bg={colors.bg}
                    $color={colors.color}
                    $darkBg={colors.darkBg}
                  >
                    {d.category}
                  </CategoryBadge>
                  {renderStars(d.confidence)}
                  <span style={{
                    fontSize: '11px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    marginLeft: 'auto',
                  }}>
                    {new Date(d.decision_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Expanded: notes */}
                {isExpanded && d.notes && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: theme === 'dark' ? '#111827' : '#F3F4F6',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {d.notes}
                  </div>
                )}
              </DecisionCard>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DecisionsPanelTab;
