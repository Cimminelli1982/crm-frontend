import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export const useProfileImageModal = (onImageUpdate) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contact, setContact] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fetchingFromLinkedIn, setFetchingFromLinkedIn] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const openModal = useCallback((contactData) => {
    setContact(contactData);
    setImagePreview(contactData?.profile_image_url || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setContact(null);
    setImagePreview(null);
    setSelectedFile(null);
    setUploading(false);
    setFetchingFromLinkedIn(false);
  }, []);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const uploadImage = useCallback(async () => {
    if (!selectedFile || !contact) return null;

    try {
      // Create a unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${contact.contact_id}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, [selectedFile, contact]);

  const saveProfileImage = useCallback(async () => {
    if (!contact || !imagePreview) return;

    setUploading(true);
    try {
      let imageUrl = imagePreview;

      // If a new file was selected, upload it first
      if (selectedFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
      }

      // Update contact with new profile image URL
      const { error } = await supabase
        .from('contacts')
        .update({ profile_image_url: imageUrl })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Profile image updated successfully!');

      // Call the update callback if provided
      if (onImageUpdate) {
        onImageUpdate(contact.contact_id, imageUrl);
      }

      closeModal();
    } catch (error) {
      console.error('Error saving profile image:', error);
      toast.error('Failed to save profile image');
    } finally {
      setUploading(false);
    }
  }, [contact, imagePreview, selectedFile, uploadImage, onImageUpdate, closeModal]);

  const fetchFromLinkedIn = useCallback(async () => {
    if (!contact) return;

    // Check if contact has LinkedIn URL
    if (!contact.linkedin) {
      toast.error('Contact does not have a LinkedIn URL. Please add one first.');
      return;
    }

    setFetchingFromLinkedIn(true);
    try {
      // Call the edge function to fetch profile image from Apollo
      const { data, error } = await supabase.functions.invoke('apollo-profile-image', {
        body: {
          contactId: contact.contact_id,
          linkedinUrl: contact.linkedin
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.success && data?.profileImageUrl) {
        // Set the preview but don't save yet - let user confirm
        setImagePreview(data.profileImageUrl);
        toast.success('Profile image fetched from LinkedIn! Click Save to apply.');
      } else {
        toast.error(data?.message || 'No profile image found on LinkedIn');
      }
    } catch (error) {
      console.error('Error fetching LinkedIn profile image:', error);
      toast.error('Failed to fetch profile image from LinkedIn. Please try again.');
    } finally {
      setFetchingFromLinkedIn(false);
    }
  }, [contact]);

  const removeProfileImage = useCallback(async () => {
    if (!contact) return;

    try {
      // Update contact to remove profile image
      const { error } = await supabase
        .from('contacts')
        .update({ profile_image_url: null })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Profile image removed');

      // Call the update callback if provided
      if (onImageUpdate) {
        onImageUpdate(contact.contact_id, null);
      }

      closeModal();
    } catch (error) {
      console.error('Error removing profile image:', error);
      toast.error('Failed to remove profile image');
    }
  }, [contact, onImageUpdate, closeModal]);

  return {
    // State
    isOpen,
    contact,
    uploading,
    fetchingFromLinkedIn,
    imagePreview,
    selectedFile,
    // Actions
    openModal,
    closeModal,
    handleFileSelect,
    saveProfileImage,
    fetchFromLinkedIn,
    removeProfileImage
  };
};