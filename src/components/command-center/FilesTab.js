import React, { useState, useEffect, useRef } from 'react';
import { FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaPlus, FaDownload, FaBuilding, FaUser, FaEnvelope, FaUpload, FaTimes, FaTrash } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * FilesTab - Shows files associated with a contact
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' or 'light'
 * @param {string} props.contactId - ID of the current contact
 * @param {Object} props.contact - Contact details (with companies)
 */
const FilesTab = ({ theme, contactId, contact }) => {
  const [files, setFiles] = useState({ direct: [], companies: [], interactions: [] });
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (contactId) {
      fetchFiles();
    }
  }, [contactId]);

  const fetchFiles = async () => {
    if (!contactId) return;
    setLoading(true);

    try {
      // 1. Direct attachments (contact_id on attachment, NOT from email/whatsapp)
      const { data: directFiles, error: directError } = await supabase
        .from('attachments')
        .select('attachment_id, file_name, file_url, file_type, file_size, description, created_at, permanent_url')
        .eq('contact_id', contactId)
        .is('email_thread_id', null)
        .is('chat_id', null)
        .order('created_at', { ascending: false });

      if (directError) console.error('Direct files error:', directError);

      // 2. Files via companies (contact_companies → company_attachments)
      const { data: contactCompanies } = await supabase
        .from('contact_companies')
        .select('company_id, companies(name)')
        .eq('contact_id', contactId);

      let companyFiles = [];
      if (contactCompanies && contactCompanies.length > 0) {
        const companyIds = contactCompanies.map(cc => cc.company_id);

        const { data: companyAttachments, error: companyError } = await supabase
          .from('company_attachments')
          .select(`
            company_id,
            is_logo,
            attachments(attachment_id, file_name, file_url, file_type, file_size, description, created_at, permanent_url)
          `)
          .in('company_id', companyIds)
          .neq('is_logo', true)
          .order('created_at', { ascending: false });

        if (companyError) console.error('Company files error:', companyError);

        companyFiles = (companyAttachments || [])
          .filter(ca => ca.attachments && !ca.attachments.file_name?.includes('_logo'))
          .map(ca => {
            const company = contactCompanies.find(cc => cc.company_id === ca.company_id);
            return {
              ...ca.attachments,
              source: 'company',
              sourceName: company?.companies?.name || 'Company'
            };
          });
      }

      // 3. Files via interactions (email/whatsapp) - only with permanent_url (accessible)
      const { data: interactionFiles, error: interactionError } = await supabase
        .from('attachments')
        .select(`
          attachment_id, file_name, file_url, file_type, file_size, description, created_at, permanent_url,
          email_thread_id, chat_id
        `)
        .eq('contact_id', contactId)
        .not('permanent_url', 'is', null)
        .or('email_thread_id.not.is.null,chat_id.not.is.null')
        .order('created_at', { ascending: false })
        .limit(100);

      if (interactionError) console.error('Interaction files error:', interactionError);

      // Enrich interaction files with source type
      const enrichedInteractionFiles = (interactionFiles || []).map(f => ({
        ...f,
        source: f.chat_id ? 'whatsapp' : 'email',
        sourceName: f.chat_id ? 'WhatsApp' : 'Email'
      }));

      setFiles({
        direct: directFiles || [],
        companies: companyFiles,
        interactions: enrichedInteractionFiles
      });

    } catch (err) {
      console.error('Error fetching files:', err);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type, name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (type?.includes('pdf') || ext === 'pdf') return FaFilePdf;
    if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FaFileImage;
    if (type?.includes('word') || ['doc', 'docx'].includes(ext)) return FaFileWord;
    if (type?.includes('excel') || type?.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return FaFileExcel;
    return FaFile;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // Upload to Supabase Storage
        const sanitizedName = file.name
          .replace(/[^\w\s.-]/g, '_')
          .replace(/\s+/g, '_');
        const fileName = `contacts/${contactId}/${Date.now()}_${sanitizedName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);

        // Create attachment record
        const { error: insertError } = await supabase
          .from('attachments')
          .insert({
            contact_id: contactId,
            file_name: file.name,
            file_url: uploadData.path,
            file_type: file.type,
            file_size: file.size,
            description: description || null,
            permanent_url: urlData.publicUrl,
            created_by: 'User'
          });

        if (insertError) throw insertError;
      }

      toast.success(`Uploaded ${selectedFiles.length} file(s)`);
      setShowUpload(false);
      setSelectedFiles([]);
      setDescription('');
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (file, source) => {
    if (!window.confirm(`Eliminare "${file.file_name}"?`)) return;

    try {
      // If from company, first remove the junction
      if (source === 'company') {
        await supabase
          .from('company_attachments')
          .delete()
          .eq('attachment_id', file.attachment_id);
      }

      // Delete the attachment record
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('attachment_id', file.attachment_id);

      if (error) throw error;

      toast.success('File eliminato');
      fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Errore: ' + error.message);
    }
  };

  // Get filename without extension
  const getNameWithoutExt = (filename) => {
    if (!filename) return '';
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  };

  // Get extension including the dot
  const getExtension = (filename) => {
    if (!filename) return '';
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  };

  const startEditing = (file) => {
    setEditingFileId(file.attachment_id);
    setEditingName(getNameWithoutExt(file.file_name));
  };

  const cancelEditing = () => {
    setEditingFileId(null);
    setEditingName('');
  };

  const saveFileName = async (file) => {
    const newName = editingName.trim();
    if (!newName) {
      cancelEditing();
      return;
    }

    const ext = getExtension(file.file_name);
    const fullName = newName + ext;

    if (fullName === file.file_name) {
      cancelEditing();
      return;
    }

    try {
      const { error } = await supabase
        .from('attachments')
        .update({ file_name: fullName })
        .eq('attachment_id', file.attachment_id);

      if (error) throw error;

      toast.success('Nome aggiornato');
      cancelEditing();
      fetchFiles();
    } catch (error) {
      console.error('Rename error:', error);
      toast.error('Errore: ' + error.message);
    }
  };

  const totalFiles = files.direct.length + files.companies.length + files.interactions.length;

  // Styles
  const containerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: theme === 'dark' ? '#111827' : '#F9FAFB'
  };

  const headerStyle = {
    padding: '12px',
    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const titleStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: theme === 'dark' ? '#F9FAFB' : '#111827'
  };

  const addBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: '#3B82F6',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer'
  };

  const scrollAreaStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '12px'
  };

  const sectionStyle = {
    marginBottom: '16px'
  };

  const sectionTitleStyle = {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const fileCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: '8px',
    marginBottom: '6px',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
  };

  const fileIconStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    background: theme === 'dark' ? '#374151' : '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const fileInfoStyle = {
    flex: 1,
    minWidth: 0
  };

  const fileNameStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const fileMetaStyle = {
    fontSize: '11px',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: '2px'
  };

  const actionBtnStyle = {
    padding: '6px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
  };

  const emptyStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
  };

  const uploadAreaStyle = {
    padding: '12px',
    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF'
  };

  const dropZoneStyle = {
    border: `2px dashed ${dragOver ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: dragOver ? (theme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent',
    transition: 'all 0.2s'
  };

  const renderFileCard = (file, source = 'direct') => {
    const Icon = getFileIcon(file.file_type, file.file_name);
    const isEditing = editingFileId === file.attachment_id;
    const ext = getExtension(file.file_name);

    return (
      <div key={file.attachment_id} style={fileCardStyle}>
        <div style={fileIconStyle}>
          <Icon size={18} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </div>
        <div style={fileInfoStyle}>
          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveFileName(file);
                  if (e.key === 'Escape') cancelEditing();
                }}
                onBlur={() => saveFileName(file)}
                autoFocus
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: '13px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '4px',
                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>{ext}</span>
            </div>
          ) : (
            <div
              style={{ ...fileNameStyle, cursor: 'pointer' }}
              title="Clicca per modificare"
              onClick={() => startEditing(file)}
            >
              {file.file_name}
            </div>
          )}
          <div style={fileMetaStyle}>
            {formatSize(file.file_size)}
            {file.created_at && ` • ${formatDate(file.created_at)}`}
            {file.sourceName && ` • ${file.sourceName}`}
          </div>
        </div>
        <button
          style={actionBtnStyle}
          onClick={() => {
            const url = file.permanent_url || file.file_url;
            if (url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = file.file_name;
              a.click();
            }
          }}
          title="Scarica"
        >
          <FaDownload size={12} />
        </button>
        <button
          style={{ ...actionBtnStyle, color: theme === 'dark' ? '#EF4444' : '#DC2626' }}
          onClick={() => deleteFile(file, source)}
          title="Elimina"
        >
          <FaTrash size={12} />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ ...emptyStyle, padding: '60px 20px' }}>Loading files...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>Files ({totalFiles})</div>
        <button style={addBtnStyle} onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? <FaTimes size={12} /> : <FaPlus size={12} />}
          {showUpload ? 'Cancel' : 'Add File'}
        </button>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div style={uploadAreaStyle}>
          <div
            style={dropZoneStyle}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FaUpload size={24} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '13px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              Drop files here or click to browse
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {selectedFiles.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '8px' }}>
                Selected: {selectedFiles.map(f => f.name).join(', ')}
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '6px',
                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '13px',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={uploadFiles}
                disabled={uploading}
                style={{
                  ...addBtnStyle,
                  width: '100%',
                  justifyContent: 'center',
                  padding: '10px',
                  opacity: uploading ? 0.6 : 1
                }}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Files List */}
      <div style={scrollAreaStyle}>
        {totalFiles === 0 ? (
          <div style={emptyStyle}>
            <FaFile size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div style={{ fontSize: '13px' }}>No files attached</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "Add File" to upload</div>
          </div>
        ) : (
          <>
            {/* Direct Files */}
            {files.direct.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  <FaUser size={10} /> Direct ({files.direct.length})
                </div>
                {files.direct.map(f => renderFileCard(f, 'direct'))}
              </div>
            )}

            {/* Company Files */}
            {files.companies.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  <FaBuilding size={10} /> From Companies ({files.companies.length})
                </div>
                {files.companies.map(f => renderFileCard(f, 'company'))}
              </div>
            )}

            {/* Interaction Files (Email/WhatsApp) */}
            {files.interactions.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  <FaEnvelope size={10} /> From Messages ({files.interactions.length})
                </div>
                {files.interactions.map(f => renderFileCard(f, 'interaction'))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FilesTab;
