import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../../lib/supabaseClient';
import { FiX, FiPlus } from 'react-icons/fi';

const FormContainer = styled.div`
  padding: 1.5rem;
`;

const FormTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: ${props => props.color || '#e5e7eb'};
  color: ${props => props.textColor || '#4b5563'};
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  
  button {
    background: none;
    border: none;
    padding: 0;
    margin-left: 0.25rem;
    color: currentColor;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    opacity: 0.7;
    
    &:hover {
      opacity: 1;
    }
  }
`;

const SuggestedTags = styled.div`
  margin-top: 1rem;
  
  h3 {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
    margin-bottom: 0.5rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background-color: #3b82f6;
    color: white;
    border: none;
    
    &:hover {
      background-color: #2563eb;
    }
  }
  
  &.secondary {
    background-color: white;
    color: #4b5563;
    border: 1px solid #d1d5db;
    
    &:hover {
      background-color: #f9fafb;
    }
  }
`;

// Helper function to get tag colors
const getTagColor = (tagName) => {
  const colors = [
    { bg: '#fee2e2', text: '#b91c1c' }, // Red
    { bg: '#fef3c7', text: '#92400e' }, // Amber
    { bg: '#ecfccb', text: '#3f6212' }, // Lime
    { bg: '#d1fae5', text: '#065f46' }, // Emerald
    { bg: '#e0f2fe', text: '#0369a1' }, // Sky
    { bg: '#ede9fe', text: '#5b21b6' }, // Violet
    { bg: '#fae8ff', text: '#86198f' }, // Fuchsia
    { bg: '#fce7f3', text: '#9d174d' }  // Pink
  ];
  
  const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
};

const TagsEditForm = ({ contact, onSave, onClose }) => {
  const [tags, setTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      // Fetch current contact tags
      const { data: contactTags, error: contactTagsError } = await supabase
        .from('contact_tags')
        .select('*, tag_id(*)')
        .eq('contact_id', contact.id);
      
      if (contactTagsError) {
        console.error('Error fetching contact tags:', contactTagsError);
        return;
      }

      setTags(contactTags?.map(ct => ({
        id: ct.tag_id.id,
        name: ct.tag_id.name
      })) || []);

      // Fetch suggested tags
      const { data: allTags, error: allTagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (allTagsError) {
        console.error('Error fetching suggested tags:', allTagsError);
        return;
      }

      setSuggestedTags(allTags || []);
    };

    fetchTags();
  }, [contact.id]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    // Check if tag already exists
    const existingTag = suggestedTags.find(
      t => t.name.toLowerCase() === newTag.toLowerCase()
    );

    let tagId;
    if (existingTag) {
      tagId = existingTag.id;
    } else {
      // Create new tag
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: newTag.trim() })
        .select()
        .single();

      if (error) {
        console.error('Error creating tag:', error);
        return;
      }

      tagId = data.id;
    }

    // Add tag to contact
    const { error } = await supabase
      .from('contact_tags')
      .insert({ contact_id: contact.id, tag_id: tagId });

    if (error) {
      console.error('Error adding tag to contact:', error);
      return;
    }

    // Update local state
    const newTagObj = { id: tagId, name: newTag.trim() };
    setTags([...tags, newTagObj]);
    setNewTag('');
  };

  const handleRemoveTag = async (tagId) => {
    const { error } = await supabase
      .from('contact_tags')
      .delete()
      .eq('contact_id', contact.id)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error removing tag:', error);
      return;
    }

    setTags(tags.filter(t => t.id !== tagId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(contact);
    onClose();
  };

  return (
    <FormContainer>
      <FormTitle>Edit Tags</FormTitle>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="newTag">Add Tag</Label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input
              type="text"
              id="newTag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter new tag"
            />
            <Button
              type="button"
              className="secondary"
              onClick={handleAddTag}
              style={{ padding: '0.5rem' }}
            >
              <FiPlus />
            </Button>
          </div>
        </FormGroup>

        <TagsContainer>
          {tags.map(tag => {
            const color = getTagColor(tag.name);
            return (
              <Tag key={tag.id} color={color.bg} textColor={color.text}>
                {tag.name}
                <button onClick={() => handleRemoveTag(tag.id)}>
                  <FiX size={14} />
                </button>
              </Tag>
            );
          })}
        </TagsContainer>

        {suggestedTags.length > 0 && (
          <SuggestedTags>
            <h3>Suggested Tags</h3>
            <TagsContainer>
              {suggestedTags
                .filter(st => !tags.some(t => t.id === st.id))
                .map(tag => {
                  const color = getTagColor(tag.name);
                  return (
                    <Tag
                      key={tag.id}
                      color={color.bg}
                      textColor={color.text}
                      onClick={() => {
                        setNewTag(tag.name);
                        handleAddTag();
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {tag.name}
                    </Tag>
                  );
                })}
            </TagsContainer>
          </SuggestedTags>
        )}

        <ButtonGroup>
          <Button type="button" className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="primary">
            Save Changes
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default TagsEditForm; 