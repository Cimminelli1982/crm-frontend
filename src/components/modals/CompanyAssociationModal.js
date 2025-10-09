import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const CompanyAssociationModal = ({ theme, contact, onClose, onCompanyAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch company suggestions
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching company suggestions:', err);
      toast.error('Failed to search companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchCompanySuggestions(searchTerm);
        setShowSuggestions(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleAddCompany = async (company) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: company.company_id || company.id,
          is_primary: true
        });

      if (error) throw error;
      toast.success(`Added ${company.name} to ${contact.first_name} ${contact.last_name}`);
      onCompanyAdded();
    } catch (err) {
      console.error('Error adding company:', err);
      toast.error('Failed to associate company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      color: theme === 'light' ? '#111827' : '#F9FAFB',
      height: '500px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '500' }}>
          Add Company for {contact.first_name} {contact.last_name}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
            padding: '5px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          Search Companies
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type company name..."
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `2px solid ${theme === 'light' ? '#10B981' : '#065F46'}`,
            borderRadius: '8px',
            fontSize: '16px',
            background: theme === 'light' ? '#FFFFFF' : '#374151',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        background: theme === 'light' ? '#F9FAFB' : '#374151',
        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
        borderRadius: '8px',
        height: '250px',
        overflowY: 'auto',
        flex: 1
        }}>
        {!showSuggestions ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>
            {searchTerm.length === 0 ? 'Start typing to search companies...' : 'Type at least 2 characters...'}
          </div>
        ) : loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Searching...
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((company) => (
            <button
              key={company.company_id || company.id}
              onClick={() => handleAddCompany(company)}
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
                color: theme === 'light' ? '#111827' : '#F9FAFB',
                fontSize: '14px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = theme === 'light' ? '#F3F4F6' : '#4B5563';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {company.name}
              </div>
              {company.category && (
                <div style={{
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>
                  {company.category}
                </div>
              )}
            </button>
          ))
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>
            No companies found. Try a different search term.
          </div>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
        textAlign: 'center'
      }}>
        <p style={{
          margin: '0 0 16px 0',
          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
          fontSize: '14px'
        }}>
          Can't find the company? You can create a new one from the contact detail page.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            background: theme === 'light' ? '#F3F4F6' : '#374151',
            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            color: theme === 'light' ? '#374151' : '#D1D5DB',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CompanyAssociationModal;