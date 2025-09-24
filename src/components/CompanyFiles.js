import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FiUpload, FiDownload, FiFile, FiTrash2, FiEye, FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FilesContainer = styled.div`
  padding: 20px;
`;

const FilesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FileCard = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
  }
`;

const FileIcon = styled.div`
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileDetails = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  &.danger:hover {
    background-color: #fee2e2;
    color: #dc2626;
  }
`;

const UploadModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;

  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
`;

const DropZone = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.2s;
  cursor: pointer;

  ${props => props.$dragOver && `
    border-color: #3b82f6;
    background-color: #f0f9ff;
  `}

  &:hover {
    border-color: #3b82f6;
    background-color: #f0f9ff;
  }
`;

const DropZoneText = styled.div`
  color: #6b7280;
  margin-bottom: 8px;
`;

const FileInput = styled.input`
  display: none;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 60px;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;

  &.primary {
    background-color: #3b82f6;
    color: white;

    &:hover {
      background-color: #2563eb;
    }
  }

  &.secondary {
    background-color: #f3f4f6;
    color: #374151;

    &:hover {
      background-color: #e5e7eb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
`;

const CompanyFiles = ({ company }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (company?.company_id) {
      fetchFiles();
    }
  }, [company]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_attachments')
        .select(`
          *,
          attachments (
            attachment_id,
            file_name,
            file_url,
            file_type,
            file_size,
            description,
            created_at,
            permanent_url
          )
        `)
        .eq('company_id', company.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFiles(data?.map(item => item.attachments) || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
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
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `companies/${company.company_id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        // Create attachment record
        const { data: attachmentData, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            file_name: file.name,
            file_url: publicUrlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            description: description || null,
            permanent_url: publicUrlData.publicUrl
          })
          .select()
          .single();

        if (attachmentError) throw attachmentError;

        // Create company-attachment relationship
        const { error: relationError } = await supabase
          .from('company_attachments')
          .insert({
            company_id: company.company_id,
            attachment_id: attachmentData.attachment_id
          });

        if (relationError) throw relationError;
      }

      toast.success(`Successfully uploaded ${selectedFiles.length} file(s)`);
      setShowUploadModal(false);
      setSelectedFiles([]);
      setDescription('');
      fetchFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (file) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    try {
      // First delete the relationship from company_attachments
      await supabase
        .from('company_attachments')
        .delete()
        .eq('company_id', company.company_id)
        .eq('attachment_id', file.attachment_id);

      // Delete from storage
      const filePath = file.file_url.split('/').pop();
      await supabase.storage
        .from('attachments')
        .remove([`companies/${company.company_id}/${filePath}`]);

      // Delete attachment record
      await supabase
        .from('attachments')
        .delete()
        .eq('attachment_id', file.attachment_id);

      toast.success('File deleted successfully');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file: ' + error.message);
    }
  };

  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.permanent_url || file.file_url;
    link.download = file.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return '🖼️';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return '📊';
    return '📎';
  };

  if (loading) {
    return (
      <FilesContainer>
        <div>Loading files...</div>
      </FilesContainer>
    );
  }

  return (
    <FilesContainer>
      <FilesHeader>
        <SectionTitle>Files ({files.length})</SectionTitle>
        <UploadButton onClick={() => setShowUploadModal(true)}>
          <FiPlus size={16} />
          Upload Files
        </UploadButton>
      </FilesHeader>

      {files.length === 0 ? (
        <EmptyState>
          <FiFile size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div>No files uploaded yet</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Click "Upload Files" to add documents, images, or other files
          </div>
        </EmptyState>
      ) : (
        <FileGrid>
          {files.map(file => (
            <FileCard key={file.attachment_id}>
              <FileIcon>
                <span style={{ fontSize: '20px' }}>
                  {getFileIcon(file.file_type)}
                </span>
              </FileIcon>
              <FileInfo>
                <FileName title={file.file_name}>{file.file_name}</FileName>
                <FileDetails>
                  {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                </FileDetails>
                {file.description && (
                  <FileDetails style={{ fontStyle: 'italic' }}>
                    {file.description}
                  </FileDetails>
                )}
              </FileInfo>
              <FileActions>
                <ActionButton
                  onClick={() => downloadFile(file)}
                  title="Download file"
                >
                  <FiDownload size={16} />
                </ActionButton>
                <ActionButton
                  onClick={() => window.open(file.permanent_url || file.file_url, '_blank')}
                  title="View file"
                >
                  <FiEye size={16} />
                </ActionButton>
                <ActionButton
                  className="danger"
                  onClick={() => deleteFile(file)}
                  title="Delete file"
                >
                  <FiTrash2 size={16} />
                </ActionButton>
              </FileActions>
            </FileCard>
          ))}
        </FileGrid>
      )}

      {showUploadModal && (
        <UploadModal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Upload Files</ModalTitle>
              <CloseButton onClick={() => setShowUploadModal(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <DropZone
              $dragOver={dragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <FiUpload size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <DropZoneText>
                Drop files here or click to browse
              </DropZoneText>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Supports all file types
              </div>
            </DropZone>

            <FileInput
              id="file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
            />

            {selectedFiles.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Selected files:</strong>
                {selectedFiles.map((file, index) => (
                  <div key={index} style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    {file.name} ({formatFileSize(file.size)})
                  </div>
                ))}
              </div>
            )}

            <FormField>
              <Label htmlFor="description">Description (optional)</Label>
              <TextArea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for these files..."
              />
            </FormField>

            <ModalActions>
              <Button
                className="secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="primary"
                onClick={uploadFiles}
                disabled={selectedFiles.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </Button>
            </ModalActions>
          </ModalContent>
        </UploadModal>
      )}
    </FilesContainer>
  );
};

export default CompanyFiles;