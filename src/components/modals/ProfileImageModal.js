import React from 'react';
import Modal from 'react-modal';
import { FiX, FiUpload, FiLinkedin, FiUser, FiSave, FiLoader, FiTrash2, FiImage } from 'react-icons/fi';
import {
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalContent,
  ImagePreviewSection,
  ImagePreviewContainer,
  PreviewImage,
  NoImageIcon,
  RemoveImageButton,
  ContactInfo,
  ContactName,
  ContactEmail,
  ActionSection,
  ActionGroup,
  ActionTitle,
  UploadButton,
  LinkedInButton,
  HelpText,
  ButtonGroup,
  CancelButton,
  SaveButton,
  LoadingOverlay,
  LoadingSpinner,
  SpinningIcon
} from './ProfileImageModal.styles';

// Set app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

const ProfileImageModal = ({
  isOpen,
  onClose,
  contact,
  uploading,
  fetchingFromLinkedIn,
  imagePreview,
  selectedFile,
  onFileSelect,
  onSave,
  onFetchFromLinkedIn,
  onRemoveImage,
  theme = 'light'
}) => {
  if (!contact) return null;

  const contactDisplayName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact';
  const hasLinkedIn = Boolean(contact.linkedin);
  const hasChanges = selectedFile || (imagePreview !== contact.profile_image_url);

  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '0',
      border: 'none',
      borderRadius: '12px',
      background: 'transparent',
      maxWidth: '480px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'visible'
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1050
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Profile Image Upload"
    >
      <ModalContainer theme={theme}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>
            <FiImage />
            Profile Image
          </ModalTitle>
          <CloseButton theme={theme} onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme}>
          <ImagePreviewSection>
            <ImagePreviewContainer theme={theme}>
              {imagePreview ? (
                <>
                  <PreviewImage src={imagePreview} alt={contactDisplayName} />
                  {imagePreview && imagePreview !== contact.profile_image_url && (
                    <RemoveImageButton
                      onClick={() => {
                        // Reset to original image
                        onRemoveImage();
                      }}
                      title="Remove this image"
                    >
                      <FiTrash2 size={14} />
                    </RemoveImageButton>
                  )}
                </>
              ) : (
                <NoImageIcon theme={theme}>
                  <FiUser />
                </NoImageIcon>
              )}
              {(uploading || fetchingFromLinkedIn) && (
                <LoadingOverlay>
                  <LoadingSpinner />
                </LoadingOverlay>
              )}
            </ImagePreviewContainer>

            <ContactInfo>
              <ContactName theme={theme}>{contactDisplayName}</ContactName>
              {contact.contact_emails?.length > 0 && (
                <ContactEmail theme={theme}>
                  {contact.contact_emails.find(e => e.is_primary)?.email ||
                   contact.contact_emails[0]?.email}
                </ContactEmail>
              )}
            </ContactInfo>
          </ImagePreviewSection>

          <ActionSection>
            <ActionGroup theme={theme}>
              <ActionTitle theme={theme}>
                <FiUpload size={14} />
                Upload from Computer
              </ActionTitle>
              <UploadButton theme={theme}>
                <FiImage size={16} />
                Choose Image
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={onFileSelect}
                  disabled={uploading || fetchingFromLinkedIn}
                />
              </UploadButton>
              <HelpText theme={theme}>
                Supported formats: JPEG, PNG, WebP (Max 5MB)
              </HelpText>
            </ActionGroup>

            <ActionGroup theme={theme}>
              <ActionTitle theme={theme}>
                <FiLinkedin size={14} />
                Import from LinkedIn
              </ActionTitle>
              <LinkedInButton
                onClick={onFetchFromLinkedIn}
                disabled={!hasLinkedIn || fetchingFromLinkedIn || uploading}
                theme={theme}
              >
                {fetchingFromLinkedIn ? (
                  <>
                    <SpinningIcon>
                      <FiLoader size={16} />
                    </SpinningIcon>
                    Fetching...
                  </>
                ) : (
                  <>
                    <FiLinkedin size={16} />
                    {hasLinkedIn ? 'Fetch from Apollo' : 'LinkedIn URL Required'}
                  </>
                )}
              </LinkedInButton>
              {!hasLinkedIn && (
                <HelpText theme={theme}>
                  Add a LinkedIn URL to the contact first to use this feature
                </HelpText>
              )}
            </ActionGroup>
          </ActionSection>

          <ButtonGroup theme={theme}>
            <CancelButton theme={theme} onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton
              theme={theme}
              onClick={onSave}
              disabled={!hasChanges || uploading || fetchingFromLinkedIn}
            >
              {uploading ? (
                <>
                  <SpinningIcon>
                    <FiLoader size={14} />
                  </SpinningIcon>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={14} />
                  Save Image
                </>
              )}
            </SaveButton>
          </ButtonGroup>
        </ModalContent>
      </ModalContainer>

    </Modal>
  );
};

export default ProfileImageModal;