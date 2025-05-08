import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { 
  FiX, 
  FiCheck, 
  FiTrash2, 
  FiPlus, 
  FiDollarSign, 
  FiTag,
  FiPaperclip,
  FiEdit,
  FiDownload,
  FiExternalLink,
  FiFile
} from 'react-icons/fi';

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    backgroundColor: '#222',
    border: '1px solid #444',
    borderRadius: '8px',
    overflow: 'auto'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000
  }
};

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
`;

const ModalTitle = styled.h2`
  color: #fff;
  margin: 0;
  padding: 0;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  
  &:hover {
    background: #333;
    color: #fff;
  }
`;

const ModalContent = styled.div`
  color: #ccc;
  margin-bottom: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 150px);
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #333;
`;

const Button = styled.button`
  background-color: ${props => props.variant === 'primary' ? '#00ff00' : 'transparent'};
  color: ${props => props.variant === 'primary' ? '#000' : '#ccc'};
  border: ${props => props.variant === 'primary' ? 'none' : '1px solid #555'};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  
  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#00dd00' : '#333'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  color: #00ff00;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #999;
  font-size: 0.8rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 0.9rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 15px;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  background-color: ${props => props.bg || 'rgba(0, 255, 0, 0.1)'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  margin-right: 5px;
  margin-bottom: 5px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
`;

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background-color: #333;
  border: 1px solid #00ff00;
  border-radius: 4px;
  color: #00ff00;
  font-size: 0.8rem;

  .remove {
    cursor: pointer;
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  }
`;

const AttachmentsList = styled.div`
  margin-top: 10px;
`;

const AttachmentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid #444;
  border-radius: 4px;
  margin-bottom: 8px;
  background-color: #2a2a2a;

  &:hover {
    background-color: #333;
  }
`;

const AttachmentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AttachmentIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: rgba(0, 170, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00aaff;
`;

const AttachmentDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AttachmentName = styled.div`
  font-size: 0.9rem;
  color: #fff;
`;

const AttachmentMeta = styled.div`
  font-size: 0.8rem;
  color: #999;
`;

const AttachmentActions = styled.div`
  display: flex;
  gap: 5px;
`;

const AttachmentButton = styled.button`
  background-color: transparent;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: #333;
  }
`;

const UploadButton = styled.button`
  background-color: #333;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.1);
  }
`;

const SearchTagsInput = styled.div`
  position: relative;
  margin-bottom: 10px;
`;

const TagSuggestions = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  z-index: 5;
`;

const TagSuggestion = styled.div`
  padding: 8px 10px;
  cursor: pointer;
  
  &:hover {
    background-color: #444;
  }
`;

function ViewDealModal({ isOpen, onClose, deal, contactId, onUpdate }) {
  const [formData, setFormData] = useState({ ...deal });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [tags, setTags] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Load deal details, attachments, and tags
  useEffect(() => {
    if (isOpen && deal) {
      setFormData({ ...deal });
      loadDealAttachments();
      loadDealTags();
    }
  }, [isOpen, deal]);

  // Load attachments for this deal
  const loadDealAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_attachments')
        .select(`
          deal_attachment_id,
          attachment:attachment_id (
            attachment_id,
            file_name,
            file_url,
            file_type,
            file_size,
            description,
            created_at
          )
        `)
        .eq('deal_id', deal.deal_id);

      if (error) throw error;

      // Format the attachments data
      const formattedAttachments = data
        .filter(item => item.attachment) // Filter out any null references
        .map(item => ({
          deal_attachment_id: item.deal_attachment_id,
          ...item.attachment
        }));

      setAttachments(formattedAttachments);
    } catch (err) {
      console.error('Error loading deal attachments:', err);
      toast.error('Failed to load attachments');
    }
  };

  // Load tags for this deal
  const loadDealTags = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_tags')
        .select(`
          entry_id,
          tag:tag_id (
            tag_id,
            name
          )
        `)
        .eq('deal_id', deal.deal_id);

      if (error) throw error;

      // Format the tags data
      const formattedTags = data
        .filter(item => item.tag) // Filter out any null references
        .map(item => ({
          entry_id: item.entry_id,
          ...item.tag
        }));

      setTags(formattedTags);
    } catch (err) {
      console.error('Error loading deal tags:', err);
      toast.error('Failed to load tags');
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save deal changes
  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.opportunity || !formData.stage) {
        toast.error('Name and Stage are required');
        setLoading(false);
        return;
      }

      // Update the deal in the database
      const { error } = await supabase
        .from('deals')
        .update({
          opportunity: formData.opportunity,
          source_category: formData.source_category,
          category: formData.category,
          stage: formData.stage,
          description: formData.description,
          total_investment: formData.total_investment ? Number(formData.total_investment) : null,
          last_modified_at: new Date().toISOString(),
          last_modified_by: 'User'
        })
        .eq('deal_id', deal.deal_id);

      if (error) throw error;

      // Update the contact relationship if needed
      if (formData.relationship !== deal.relationship) {
        const { error: relationshipError } = await supabase
          .from('deals_contacts')
          .update({
            relationship: formData.relationship
          })
          .eq('deals_contacts_id', deal.deals_contacts_id);

        if (relationshipError) throw relationshipError;
      }

      toast.success('Deal updated successfully');
      
      // Notify parent component about the update
      if (onUpdate) {
        onUpdate();
      }
      
      setIsEditing(false);
      setLoading(false);
    } catch (err) {
      console.error('Error updating deal:', err);
      toast.error('Failed to update deal');
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // 1. Upload file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `deals/${deal.deal_id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL for the file
      const { data: publicURLData } = await supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const publicURL = publicURLData.publicUrl;

      // 3. Insert attachment record
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('attachments')
        .insert({
          file_name: file.name,
          file_url: publicURL,
          file_type: file.type,
          file_size: file.size,
          created_by: 'User'
        })
        .select('attachment_id')
        .single();

      if (attachmentError) throw attachmentError;

      // 4. Link attachment to the deal
      const { error: linkError } = await supabase
        .from('deal_attachments')
        .insert({
          deal_id: deal.deal_id,
          attachment_id: attachmentData.attachment_id,
          created_by: 'User'
        });

      if (linkError) throw linkError;

      // Reload attachments
      loadDealAttachments();
      toast.success('File uploaded successfully');
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle deleting an attachment
  const handleDeleteAttachment = async (dealAttachmentId, attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      // 1. Remove the link between deal and attachment
      const { error: unlinkError } = await supabase
        .from('deal_attachments')
        .delete()
        .eq('deal_attachment_id', dealAttachmentId);

      if (unlinkError) throw unlinkError;

      // 2. Delete the attachment record (optional, depends on your requirements)
      // This might not be needed if attachments are shared between entities
      const { error: deleteError } = await supabase
        .from('attachments')
        .delete()
        .eq('attachment_id', attachmentId);

      if (deleteError) throw deleteError;

      // Reload attachments
      loadDealAttachments();
      toast.success('Attachment deleted successfully');
    } catch (err) {
      console.error('Error deleting attachment:', err);
      toast.error('Failed to delete attachment');
    }
  };

  // Search for tags
  const searchTags = async (query) => {
    if (!query || query.length < 2) {
      setTagSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

      if (error) throw error;

      // Filter out tags that are already added
      const existingTagIds = tags.map(tag => tag.tag_id);
      const filteredSuggestions = data.filter(tag => !existingTagIds.includes(tag.tag_id));

      setTagSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error searching tags:', err);
      setTagSuggestions([]);
    }
  };

  // Add a tag
  const addTag = async (tagToAdd) => {
    try {
      let tagId;

      // Check if tag already exists
      const { data: existingTag, error: searchError } = await supabase
        .from('tags')
        .select('tag_id')
        .eq('name', tagToAdd.name || tagToAdd)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingTag) {
        tagId = existingTag.tag_id;
      } else {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({ name: tagToAdd.name || tagToAdd })
          .select('tag_id')
          .single();

        if (createError) throw createError;
        tagId = newTag.tag_id;
      }

      // Link tag to deal
      const { error: linkError } = await supabase
        .from('deal_tags')
        .insert({
          deal_id: deal.deal_id,
          tag_id: tagId
        });

      if (linkError) throw linkError;

      // Reload tags
      loadDealTags();
      setNewTag('');
      setTagSuggestions([]);
      toast.success('Tag added successfully');
    } catch (err) {
      console.error('Error adding tag:', err);
      toast.error('Failed to add tag');
    }
  };

  // Remove a tag
  const removeTag = async (entryId) => {
    try {
      const { error } = await supabase
        .from('deal_tags')
        .delete()
        .eq('entry_id', entryId);

      if (error) throw error;

      // Update local state
      setTags(tags.filter(tag => tag.entry_id !== entryId));
      toast.success('Tag removed');
    } catch (err) {
      console.error('Error removing tag:', err);
      toast.error('Failed to remove tag');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        if (!loading) onClose();
      }}
      style={modalStyles}
      contentLabel="View Deal"
    >
      <ModalHeader>
        <ModalTitle>
          <FiDollarSign style={{ color: '#00ffff' }} />
          {isEditing ? 'Edit Deal' : 'Deal Details'}
        </ModalTitle>
        <CloseButton onClick={() => {
          if (!loading) onClose();
        }}>
          <FiX />
        </CloseButton>
      </ModalHeader>

      <ModalContent>
        <Section>
          <FormGroup>
            <Label>Deal Name</Label>
            {isEditing ? (
              <Input
                type="text"
                value={formData.opportunity || ''}
                onChange={(e) => handleInputChange('opportunity', e.target.value)}
                placeholder="Enter deal name"
                disabled={loading}
              />
            ) : (
              <div style={{ padding: '8px 10px', backgroundColor: '#333', borderRadius: '4px' }}>
                {deal.opportunity}
              </div>
            )}
          </FormGroup>

          <FormRow>
            <FormGroup style={{ flex: 1 }}>
              <Label>Stage</Label>
              {isEditing ? (
                <Select
                  value={formData.stage || ''}
                  onChange={(e) => handleInputChange('stage', e.target.value)}
                  disabled={loading}
                >
                  <option value="Lead">Lead</option>
                  <option value="Qualified Lead">Qualified Lead</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </Select>
              ) : (
                <div>
                  <Badge 
                    bg={
                      deal.stage === 'Closed Won' ? 'rgba(0, 255, 0, 0.2)' : 
                      deal.stage === 'Closed Lost' ? 'rgba(255, 0, 0, 0.2)' : 
                      'rgba(255, 165, 0, 0.2)'
                    }
                    color={
                      deal.stage === 'Closed Won' ? '#00ff00' : 
                      deal.stage === 'Closed Lost' ? '#ff5555' : 
                      '#ffaa00'
                    }
                    borderColor={
                      deal.stage === 'Closed Won' ? '#00ff00' : 
                      deal.stage === 'Closed Lost' ? '#ff5555' : 
                      '#ffaa00'
                    }
                  >
                    {deal.stage}
                  </Badge>
                </div>
              )}
            </FormGroup>

            <FormGroup style={{ flex: 1 }}>
              <Label>Value</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.total_investment || ''}
                  onChange={(e) => handleInputChange('total_investment', e.target.value)}
                  placeholder="Deal value"
                  disabled={loading}
                />
              ) : (
                <div style={{ padding: '8px 10px', backgroundColor: '#333', borderRadius: '4px' }}>
                  {deal.total_investment ? formatCurrency(deal.total_investment) : 'Not specified'}
                </div>
              )}
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup style={{ flex: 1 }}>
              <Label>Category</Label>
              {isEditing ? (
                <Select
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  disabled={loading}
                >
                  <option value="Inbox">Inbox</option>
                  <option value="Investment">Investment</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Sales">Sales</option>
                  <option value="Other">Other</option>
                </Select>
              ) : (
                <div style={{ padding: '8px 10px', backgroundColor: '#333', borderRadius: '4px' }}>
                  {deal.category || 'Not specified'}
                </div>
              )}
            </FormGroup>

            <FormGroup style={{ flex: 1 }}>
              <Label>Source</Label>
              {isEditing ? (
                <Select
                  value={formData.source_category || ''}
                  onChange={(e) => handleInputChange('source_category', e.target.value)}
                  disabled={loading}
                >
                  <option value="Not Set">Not Set</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                  <option value="Referral">Referral</option>
                  <option value="Event">Event</option>
                  <option value="Website">Website</option>
                  <option value="Other">Other</option>
                </Select>
              ) : (
                <div style={{ padding: '8px 10px', backgroundColor: '#333', borderRadius: '4px' }}>
                  {deal.source_category || 'Not specified'}
                </div>
              )}
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Your Relationship</Label>
            {isEditing ? (
              <Select
                value={formData.relationship || ''}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                disabled={loading}
              >
                <option value="Direct Contact">Direct Contact</option>
                <option value="Investor">Investor</option>
                <option value="Advisor">Advisor</option>
                <option value="Introducer">Introducer</option>
                <option value="Partner">Partner</option>
                <option value="Other">Other</option>
              </Select>
            ) : (
              <div style={{ padding: '8px 10px', backgroundColor: '#333', borderRadius: '4px' }}>
                {deal.relationship || 'Not specified'}
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            {isEditing ? (
              <TextArea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter deal description"
                disabled={loading}
              />
            ) : (
              <div style={{ 
                padding: '8px 10px', 
                backgroundColor: '#333', 
                borderRadius: '4px',
                minHeight: '80px',
                whiteSpace: 'pre-wrap'
              }}>
                {deal.description || 'No description provided'}
              </div>
            )}
          </FormGroup>
        </Section>

        <Section>
          <SectionTitle>
            <FiTag />
            Tags
          </SectionTitle>
          
          <TagsContainer>
            {tags.map(tag => (
              <Tag key={tag.entry_id}>
                {tag.name}
                <FiX 
                  className="remove" 
                  size={14} 
                  onClick={() => removeTag(tag.entry_id)}
                  title="Remove tag"
                />
              </Tag>
            ))}
          </TagsContainer>
          
          <SearchTagsInput>
            <Input
              type="text"
              value={newTag}
              onChange={(e) => {
                setNewTag(e.target.value);
                searchTags(e.target.value);
              }}
              placeholder="Add tag (min 2 characters)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim().length >= 2) {
                  addTag(newTag.trim());
                } else if (e.key === 'Escape') {
                  setNewTag('');
                  setTagSuggestions([]);
                }
              }}
              style={{ marginTop: '10px' }}
            />
            
            {tagSuggestions.length > 0 && (
              <TagSuggestions>
                {tagSuggestions.map(suggestion => (
                  <TagSuggestion 
                    key={suggestion.tag_id}
                    onClick={() => {
                      addTag(suggestion);
                    }}
                  >
                    {suggestion.name}
                  </TagSuggestion>
                ))}
              </TagSuggestions>
            )}
          </SearchTagsInput>
        </Section>

        <Section>
          <SectionTitle>
            <FiPaperclip />
            Attachments
          </SectionTitle>
          
          <AttachmentsList>
            {attachments.length > 0 ? (
              attachments.map(attachment => (
                <AttachmentItem key={attachment.attachment_id}>
                  <AttachmentInfo>
                    <AttachmentIcon>
                      <FiFile />
                    </AttachmentIcon>
                    <AttachmentDetails>
                      <AttachmentName>{attachment.file_name}</AttachmentName>
                      <AttachmentMeta>
                        {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                      </AttachmentMeta>
                    </AttachmentDetails>
                  </AttachmentInfo>
                  <AttachmentActions>
                    <AttachmentButton 
                      onClick={() => window.open(attachment.file_url, '_blank')}
                      title="Open file"
                    >
                      <FiExternalLink />
                    </AttachmentButton>
                    <AttachmentButton 
                      onClick={() => handleDeleteAttachment(attachment.deal_attachment_id, attachment.attachment_id)}
                      title="Delete attachment"
                      style={{ color: '#ff5555' }}
                    >
                      <FiTrash2 />
                    </AttachmentButton>
                  </AttachmentActions>
                </AttachmentItem>
              ))
            ) : (
              <div style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                No attachments available
              </div>
            )}
          </AttachmentsList>
          
          <div style={{ marginTop: '15px' }}>
            <input
              type="file"
              id="fileUpload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <UploadButton 
              onClick={() => document.getElementById('fileUpload').click()}
              disabled={isUploading}
            >
              <FiPaperclip />
              {isUploading ? 'Uploading...' : 'Add Attachment'}
            </UploadButton>
          </div>
        </Section>
      </ModalContent>

      <ModalFooter>
        {isEditing ? (
          <>
            <Button 
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              <FiX /> Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={loading}
            >
              <FiCheck /> Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>
              <FiX /> Close
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setIsEditing(true)}
            >
              <FiEdit /> Edit Deal
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default ViewDealModal;