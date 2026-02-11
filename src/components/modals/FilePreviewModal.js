import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiDownload, FiAlertCircle } from 'react-icons/fi';
import {
  Overlay,
  ModalContainer,
  ModalHeader,
  HeaderLeft,
  FileName,
  SizeBadge,
  CloseButton,
  ModalBody,
  PreviewImage,
  PreviewIframe,
  LoadingContainer,
  Spinner,
  ErrorContainer,
  ModalFooter,
  FooterButton,
} from './FilePreviewModal.styles';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

/**
 * Check if a file type is previewable.
 * Returns 'image' | 'pdf' | null
 */
export const isPreviewable = (fileType, fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (fileType?.startsWith('image/') || imageExts.includes(ext)) return 'image';
  if (fileType?.includes('pdf') || ext === 'pdf') return 'pdf';
  return null;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * FilePreviewModal - Preview images and PDFs in a modal
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {Object} file - { fileName, fileType, fileSize, url?, blobId? }
 * @param {string} theme - 'dark' | 'light'
 */
const FilePreviewModal = ({ isOpen, onClose, file, theme }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);

  // Cleanup blob URL
  const cleanup = useCallback(() => {
    if (objectUrl) {
      window.URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setError(null);
    setLoading(false);
  }, [objectUrl]);

  // Fetch blob from backend for email attachments
  useEffect(() => {
    if (!isOpen || !file) {
      cleanup();
      return;
    }

    // If we have a direct URL, no fetch needed
    if (file.url) {
      setLoading(false);
      return;
    }

    // If we have a blobId, fetch from backend
    if (file.blobId) {
      setLoading(true);
      setError(null);

      const fetchUrl = `${BACKEND_URL}/attachment/${encodeURIComponent(file.blobId)}?name=${encodeURIComponent(file.fileName || 'attachment')}&type=${encodeURIComponent(file.fileType || 'application/octet-stream')}`;

      fetch(fetchUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load file');
          return res.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          setObjectUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error('Preview fetch error:', err);
          setError('Failed to load preview');
          setLoading(false);
        });
    }

    return () => {
      // Cleanup on unmount or when file changes
    };
  }, [isOpen, file?.blobId, file?.url]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) cleanup();
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const previewType = isPreviewable(file.fileType, file.fileName);
  const displayUrl = file.url || objectUrl;

  const handleDownload = () => {
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.fileName || 'download';
      a.click();
    } else if (file.blobId) {
      // Trigger full download via backend
      const url = `${BACKEND_URL}/attachment/${encodeURIComponent(file.blobId)}?name=${encodeURIComponent(file.fileName || 'attachment')}&type=${encodeURIComponent(file.fileType || 'application/octet-stream')}`;
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = file.fileName || 'attachment';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        });
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContainer theme={theme} onClick={(e) => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <HeaderLeft>
            <FileName theme={theme}>{file.fileName || 'File Preview'}</FileName>
            {file.fileSize && <SizeBadge theme={theme}>{formatSize(file.fileSize)}</SizeBadge>}
          </HeaderLeft>
          <CloseButton theme={theme} onClick={onClose}>
            <FiX size={18} />
          </CloseButton>
        </ModalHeader>

        <ModalBody theme={theme}>
          {loading ? (
            <LoadingContainer theme={theme}>
              <Spinner theme={theme} />
              Loading preview...
            </LoadingContainer>
          ) : error ? (
            <ErrorContainer theme={theme}>
              <FiAlertCircle size={24} />
              {error}
            </ErrorContainer>
          ) : displayUrl ? (
            previewType === 'image' ? (
              <PreviewImage src={displayUrl} alt={file.fileName} />
            ) : previewType === 'pdf' ? (
              <PreviewIframe src={displayUrl} title={file.fileName} />
            ) : null
          ) : null}
        </ModalBody>

        <ModalFooter theme={theme}>
          <FooterButton theme={theme} onClick={onClose}>
            Close
          </FooterButton>
          <FooterButton theme={theme} $primary onClick={handleDownload}>
            <FiDownload size={14} />
            Download
          </FooterButton>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default FilePreviewModal;
