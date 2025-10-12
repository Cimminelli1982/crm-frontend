import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export const useQuickEditModal = (onContactUpdate) => {
  // Modal state
  const [quickEditContactModalOpen, setQuickEditContactModalOpen] = useState(false);
  const [contactForQuickEdit, setContactForQuickEdit] = useState(null);
  const [showMissingFieldsOnly, setShowMissingFieldsOnly] = useState(false);

  // Tab state
  const [quickEditActiveTab, setQuickEditActiveTab] = useState('Info');

  // Contact Info fields
  const [quickEditFirstName, setQuickEditFirstName] = useState('');
  const [quickEditLastName, setQuickEditLastName] = useState('');
  const [quickEditDescriptionText, setQuickEditDescriptionText] = useState('');
  const [quickEditJobRoleText, setQuickEditJobRoleText] = useState('');
  const [quickEditContactCategory, setQuickEditContactCategory] = useState('');
  const [quickEditContactScore, setQuickEditContactScore] = useState(0);
  const [quickEditLinkedin, setQuickEditLinkedin] = useState('');
  const [quickEditShowMissing, setQuickEditShowMissing] = useState(true);

  // Keep in Touch fields
  const [quickEditKeepInTouchFrequency, setQuickEditKeepInTouchFrequency] = useState('');
  const [quickEditBirthdayDay, setQuickEditBirthdayDay] = useState('');
  const [quickEditBirthdayMonth, setQuickEditBirthdayMonth] = useState('');
  const [quickEditAgeEstimate, setQuickEditAgeEstimate] = useState('');
  const [quickEditChristmasWishes, setQuickEditChristmasWishes] = useState('');
  const [quickEditEasterWishes, setQuickEditEasterWishes] = useState('');

  // Contact emails and mobiles
  const [quickEditContactEmails, setQuickEditContactEmails] = useState([]);
  const [quickEditContactMobiles, setQuickEditContactMobiles] = useState([]);
  const [newEmailText, setNewEmailText] = useState('');
  const [newEmailType, setNewEmailType] = useState('personal');
  const [newMobileText, setNewMobileText] = useState('');
  const [newMobileType, setNewMobileType] = useState('personal');

  // Contact cities and tags
  const [quickEditContactCities, setQuickEditContactCities] = useState([]);
  const [quickEditContactTags, setQuickEditContactTags] = useState([]);

  // Company associations
  const [quickEditContactCompanies, setQuickEditContactCompanies] = useState([]);

  // Sub-modal states
  const [quickEditCityModalOpen, setQuickEditCityModalOpen] = useState(false);
  const [quickEditTagModalOpen, setQuickEditTagModalOpen] = useState(false);
  const [quickEditAssociateCompanyModalOpen, setQuickEditAssociateCompanyModalOpen] = useState(false);

  // Helper function to parse birthday into components
  const parseBirthdayIntoComponents = (birthday) => {
    if (!birthday) return { day: '', month: '', ageEstimate: '' };

    try {
      const date = new Date(birthday);
      const currentYear = new Date().getFullYear();
      const birthYear = date.getFullYear();
      const age = currentYear - birthYear;

      const ageOptions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      let closestAge = '80+';

      if (age <= 82) {
        closestAge = ageOptions.reduce((prev, curr) =>
          Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
        ).toString();
      }

      return {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        ageEstimate: closestAge
      };
    } catch (error) {
      console.error('Error parsing birthday:', error);
      return { day: '', month: '', ageEstimate: '' };
    }
  };

  // Calculate birthday from components
  const calculateBirthdayFromComponents = (day, month, ageEstimate) => {
    if (!day || !month || !ageEstimate) return '';

    const currentYear = new Date().getFullYear();
    let birthYear;

    if (ageEstimate === '80+') {
      birthYear = currentYear - 85;
    } else {
      birthYear = currentYear - parseInt(ageEstimate);
    }

    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    return `${birthYear}-${paddedMonth}-${paddedDay}`;
  };

  // Email handlers
  const handleAddEmail = useCallback(async (email, type = 'personal') => {
    if (!contactForQuickEdit || !email.trim()) return;

    try {
      const { data: newEmail, error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: contactForQuickEdit.contact_id,
          email: email.trim(),
          type: type,
          is_primary: quickEditContactEmails.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      setQuickEditContactEmails(prev => [...prev, newEmail]);
      toast.success('Email added successfully');
    } catch (error) {
      console.error('Error adding email:', error);
      toast.error('Failed to add email');
    }
  }, [contactForQuickEdit, quickEditContactEmails.length]);

  const handleRemoveEmail = useCallback(async (emailId) => {
    try {
      const { error } = await supabase
        .from('contact_emails')
        .delete()
        .eq('email_id', emailId);

      if (error) throw error;

      setQuickEditContactEmails(prev => prev.filter(e => e.email_id !== emailId));
      toast.success('Email removed successfully');
    } catch (error) {
      console.error('Error removing email:', error);
      toast.error('Failed to remove email');
    }
  }, []);

  const handleUpdateEmailType = useCallback(async (emailId, newType) => {
    try {
      const { error } = await supabase
        .from('contact_emails')
        .update({ type: newType })
        .eq('email_id', emailId);

      if (error) throw error;

      setQuickEditContactEmails(prev =>
        prev.map(email =>
          email.email_id === emailId ? { ...email, type: newType } : email
        )
      );
      toast.success('Email type updated successfully');
    } catch (error) {
      console.error('Error updating email type:', error);
      toast.error('Failed to update email type');
    }
  }, []);

  const handleSetEmailPrimary = useCallback(async (emailId) => {
    try {
      const { error: removeError } = await supabase
        .from('contact_emails')
        .update({ is_primary: false })
        .eq('contact_id', contactForQuickEdit.contact_id);

      if (removeError) throw removeError;

      const { error: setPrimaryError } = await supabase
        .from('contact_emails')
        .update({ is_primary: true })
        .eq('email_id', emailId);

      if (setPrimaryError) throw setPrimaryError;

      setQuickEditContactEmails(prev =>
        prev.map(email => ({
          ...email,
          is_primary: email.email_id === emailId
        }))
      );
      toast.success('Primary email updated successfully');
    } catch (error) {
      console.error('Error setting primary email:', error);
      toast.error('Failed to set primary email');
    }
  }, [contactForQuickEdit]);

  // Mobile handlers
  const handleAddMobile = useCallback(async (mobile, type = 'personal') => {
    if (!contactForQuickEdit || !mobile.trim()) return;

    try {
      const { data: newMobile, error } = await supabase
        .from('contact_mobiles')
        .insert({
          contact_id: contactForQuickEdit.contact_id,
          mobile: mobile.trim(),
          type: type,
          is_primary: quickEditContactMobiles.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      setQuickEditContactMobiles(prev => [...prev, newMobile]);
      toast.success('Mobile added successfully');
    } catch (error) {
      console.error('Error adding mobile:', error);
      toast.error('Failed to add mobile');
    }
  }, [contactForQuickEdit, quickEditContactMobiles.length]);

  const handleRemoveMobile = useCallback(async (mobileId) => {
    try {
      const { error } = await supabase
        .from('contact_mobiles')
        .delete()
        .eq('mobile_id', mobileId);

      if (error) throw error;

      setQuickEditContactMobiles(prev => prev.filter(m => m.mobile_id !== mobileId));
      toast.success('Mobile removed successfully');
    } catch (error) {
      console.error('Error removing mobile:', error);
      toast.error('Failed to remove mobile');
    }
  }, []);

  const handleUpdateMobileType = useCallback(async (mobileId, newType) => {
    try {
      const { error } = await supabase
        .from('contact_mobiles')
        .update({ type: newType })
        .eq('mobile_id', mobileId);

      if (error) throw error;

      setQuickEditContactMobiles(prev =>
        prev.map(mobile =>
          mobile.mobile_id === mobileId ? { ...mobile, type: newType } : mobile
        )
      );
      toast.success('Mobile type updated successfully');
    } catch (error) {
      console.error('Error updating mobile type:', error);
      toast.error('Failed to update mobile type');
    }
  }, []);

  const handleSetMobilePrimary = useCallback(async (mobileId) => {
    try {
      const { error: removeError } = await supabase
        .from('contact_mobiles')
        .update({ is_primary: false })
        .eq('contact_id', contactForQuickEdit.contact_id);

      if (removeError) throw removeError;

      const { error: setPrimaryError } = await supabase
        .from('contact_mobiles')
        .update({ is_primary: true })
        .eq('mobile_id', mobileId);

      if (setPrimaryError) throw setPrimaryError;

      setQuickEditContactMobiles(prev =>
        prev.map(mobile => ({
          ...mobile,
          is_primary: mobile.mobile_id === mobileId
        }))
      );
      toast.success('Primary mobile updated successfully');
    } catch (error) {
      console.error('Error setting primary mobile:', error);
      toast.error('Failed to set primary mobile');
    }
  }, [contactForQuickEdit]);

  // City and Tag handlers
  const handleRemoveCity = useCallback(async (entryId) => {
    try {
      const { error } = await supabase
        .from('contact_cities')
        .delete()
        .eq('entry_id', entryId);

      if (error) throw error;

      setQuickEditContactCities(prev => prev.filter(c => c.entry_id !== entryId));
      toast.success('City removed successfully');
    } catch (error) {
      console.error('Error removing city:', error);
      toast.error('Failed to remove city');
    }
  }, []);

  const handleRemoveTag = useCallback(async (entryId) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('entry_id', entryId);

      if (error) throw error;

      setQuickEditContactTags(prev => prev.filter(t => t.entry_id !== entryId));
      toast.success('Tag removed successfully');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  }, []);

  // Company handlers
  const handleUpdateCompanyRelationship = useCallback(async (contactCompaniesId, newRelationship) => {
    try {
      const { error } = await supabase
        .from('contact_companies')
        .update({ relationship: newRelationship })
        .eq('contact_companies_id', contactCompaniesId);

      if (error) throw error;

      setQuickEditContactCompanies(prev =>
        prev.map(relation =>
          relation.contact_companies_id === contactCompaniesId
            ? { ...relation, relationship: newRelationship }
            : relation
        )
      );

      toast.success('Relationship type updated successfully');
    } catch (err) {
      console.error('Error updating company relationship:', err);
      toast.error('Failed to update relationship type');
    }
  }, []);

  const handleUpdateCompanyCategory = useCallback(async (companyId, newCategory) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ category: newCategory })
        .eq('company_id', companyId);

      if (error) throw error;

      setQuickEditContactCompanies(prev =>
        prev.map(relation => {
          if ((relation.companies?.company_id || relation.companies?.id) === companyId) {
            return {
              ...relation,
              companies: {
                ...relation.companies,
                category: newCategory
              }
            };
          }
          return relation;
        })
      );

      toast.success('Company category updated successfully');
    } catch (err) {
      console.error('Error updating company category:', err);
      toast.error('Failed to update company category');
    }
  }, []);

  // Keep in Touch handlers
  const handleSaveQuickEditFrequency = useCallback(async (frequency) => {
    if (!contactForQuickEdit) return;

    try {
      const { data: existingRecord, error: checkError } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactForQuickEdit.contact_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('keep_in_touch')
          .update({ frequency: frequency || null })
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('keep_in_touch')
          .insert({
            contact_id: contactForQuickEdit.contact_id,
            frequency: frequency || null
          });

        if (insertError) throw insertError;
      }

      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast.error('Failed to update frequency');
    }
  }, [contactForQuickEdit, onContactUpdate]);

  const handleSaveQuickEditChristmasWishes = useCallback(async (wishes) => {
    if (!contactForQuickEdit) return;

    try {
      const { data: existingRecord, error: checkError } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactForQuickEdit.contact_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('keep_in_touch')
          .update({ christmas: wishes || null })
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('keep_in_touch')
          .insert({
            contact_id: contactForQuickEdit.contact_id,
            christmas: wishes || null
          });

        if (insertError) throw insertError;
      }

      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error updating Christmas wishes:', error);
      toast.error('Failed to update Christmas wishes');
    }
  }, [contactForQuickEdit, onContactUpdate]);

  const handleSaveQuickEditEasterWishes = useCallback(async (wishes) => {
    if (!contactForQuickEdit) return;

    try {
      const { data: existingRecord, error: checkError } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactForQuickEdit.contact_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('keep_in_touch')
          .update({ easter: wishes || null })
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('keep_in_touch')
          .insert({
            contact_id: contactForQuickEdit.contact_id,
            easter: wishes || null
          });

        if (insertError) throw insertError;
      }

      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error updating Easter wishes:', error);
      toast.error('Failed to update Easter wishes');
    }
  }, [contactForQuickEdit, onContactUpdate]);

  const handleSaveQuickEditBirthday = useCallback(async () => {
    if (!contactForQuickEdit) return;

    try {
      const birthday = calculateBirthdayFromComponents(
        quickEditBirthdayDay,
        quickEditBirthdayMonth,
        quickEditAgeEstimate
      );

      if (birthday !== contactForQuickEdit.birthday) {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({ birthday: birthday || null })
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (contactError) throw contactError;
      }

      toast.success('Birthday updated successfully!');

      if (onContactUpdate) {
        onContactUpdate();
      }
    } catch (error) {
      console.error('Error updating birthday:', error);
      toast.error('Failed to update birthday: ' + (error.message || 'Unknown error'));
    }
  }, [contactForQuickEdit, quickEditBirthdayDay, quickEditBirthdayMonth, quickEditAgeEstimate, onContactUpdate]);

  // Automation handler
  const handleAutomation = useCallback(async (automationType) => {
    if (!contactForQuickEdit) return;

    try {
      if (automationType === 'cold_contacted_founder') {
        setQuickEditDescriptionText('Founder a cui ho dato picche senza allocare troppo tempo');
        setQuickEditContactCategory('Founder');
        setQuickEditContactScore(3);
        setQuickEditJobRoleText('CEO & Founder');

        const { error: contactError } = await supabase
          .from('contacts')
          .update({
            first_name: quickEditFirstName.trim() || null,
            last_name: quickEditLastName.trim() || null,
            description: 'Founder a cui ho dato picche senza allocare troppo tempo',
            job_role: 'CEO & Founder',
            category: 'Founder',
            score: 3,
            linkedin: quickEditLinkedin.trim() || null
          })
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (contactError) throw contactError;

        // Update keep_in_touch record
        const { data: existingKIT, error: checkError } = await supabase
          .from('keep_in_touch')
          .select('id')
          .eq('contact_id', contactForQuickEdit.contact_id)
          .maybeSingle();

        if (existingKIT) {
          const { error: kitError } = await supabase
            .from('keep_in_touch')
            .update({
              frequency: 'Do not keep in touch',
              christmas: 'no wishes',
              easter: 'no wishes'
            })
            .eq('contact_id', contactForQuickEdit.contact_id);

          if (kitError) throw kitError;
        } else {
          const { error: kitError } = await supabase
            .from('keep_in_touch')
            .insert({
              contact_id: contactForQuickEdit.contact_id,
              frequency: 'Do not keep in touch',
              christmas: 'no wishes',
              easter: 'no wishes'
            });

          if (kitError) throw kitError;
        }

        setQuickEditKeepInTouchFrequency('Do not keep in touch');
        setQuickEditChristmasWishes('no wishes');
        setQuickEditEasterWishes('no wishes');

        // Add to Apollo_Enrichment_Inbox
        const { data: existingApollo } = await supabase
          .from('apollo_enrichment_inbox')
          .select('id')
          .eq('contact_id', contactForQuickEdit.contact_id)
          .maybeSingle();

        if (!existingApollo) {
          const { error: apolloError } = await supabase
            .from('apollo_enrichment_inbox')
            .insert({
              contact_id: contactForQuickEdit.contact_id
            });

          if (apolloError) throw apolloError;
        }

        toast.success('Cold contacted founder automation applied successfully');

        if (onContactUpdate) {
          onContactUpdate();
        }

        setTimeout(() => {
          closeModal();
        }, 1000);

      } else if (automationType === 'quick_skip') {
        setQuickEditContactCategory('Skip');

        const { error: contactError } = await supabase
          .from('contacts')
          .update({
            category: 'Skip'
          })
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (contactError) throw contactError;

        toast.success('Contact marked as Skip');

        if (onContactUpdate) {
          onContactUpdate();
        }

        setTimeout(() => {
          closeModal();
        }, 500);
      }
    } catch (error) {
      console.error('Error applying automation:', error);
      toast.error('Failed to apply automation: ' + (error.message || 'Unknown error'));
    }
  }, [contactForQuickEdit, quickEditFirstName, quickEditLastName, quickEditLinkedin, onContactUpdate, closeModal]);

  // Silent save function that doesn't trigger onContactUpdate (doesn't close modal)
  const handleSilentSave = useCallback(async () => {
    if (!contactForQuickEdit) return;

    try {
      // Save contact details
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: quickEditFirstName?.trim() || null,
          last_name: quickEditLastName?.trim() || null,
          description: quickEditDescriptionText?.trim() || null,
          job_role: quickEditJobRoleText?.trim() || null,
          category: quickEditContactCategory || 'Not Set',
          score: quickEditContactScore > 0 ? quickEditContactScore : null,
          linkedin: quickEditLinkedin?.trim() || null
        })
        .eq('contact_id', contactForQuickEdit.contact_id);

      if (error) throw error;

      // Save keep_in_touch data if any fields have values
      if (quickEditKeepInTouchFrequency || quickEditChristmasWishes || quickEditEasterWishes) {
        const { data: existingRecord, error: checkError } = await supabase
          .from('keep_in_touch')
          .select('id')
          .eq('contact_id', contactForQuickEdit.contact_id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        const keepInTouchData = {
          frequency: quickEditKeepInTouchFrequency || null,
          christmas: quickEditChristmasWishes || null,
          easter: quickEditEasterWishes || null
        };

        if (existingRecord) {
          const { error: updateError } = await supabase
            .from('keep_in_touch')
            .update(keepInTouchData)
            .eq('contact_id', contactForQuickEdit.contact_id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('keep_in_touch')
            .insert({
              contact_id: contactForQuickEdit.contact_id,
              ...keepInTouchData
            });
          if (insertError) throw insertError;
        }
      }

      // Save birthday
      if (quickEditBirthdayDay && quickEditBirthdayMonth && quickEditAgeEstimate) {
        const currentYear = new Date().getFullYear();
        let birthYear;

        if (quickEditAgeEstimate === '80+') {
          birthYear = currentYear - 85;
        } else {
          birthYear = currentYear - parseInt(quickEditAgeEstimate);
        }

        const paddedMonth = quickEditBirthdayMonth.toString().padStart(2, '0');
        const paddedDay = quickEditBirthdayDay.toString().padStart(2, '0');
        const birthday = `${birthYear}-${paddedMonth}-${paddedDay}`;

        const { error: birthdayError } = await supabase
          .from('contacts')
          .update({ birthday })
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (birthdayError) throw birthdayError;
      }

      // Don't call onContactUpdate to avoid modal close
      return true;
    } catch (error) {
      console.error('Error in silent save:', error);
      return false;
    }
  }, [
    contactForQuickEdit,
    quickEditFirstName,
    quickEditLastName,
    quickEditDescriptionText,
    quickEditJobRoleText,
    quickEditContactCategory,
    quickEditContactScore,
    quickEditLinkedin,
    quickEditKeepInTouchFrequency,
    quickEditChristmasWishes,
    quickEditEasterWishes,
    quickEditBirthdayDay,
    quickEditBirthdayMonth,
    quickEditAgeEstimate
  ]);

  // Save contact handler
  const handleSaveQuickEditContact = useCallback(async () => {
    if (!contactForQuickEdit) return;

    try {
      // Save contact details (but NOT show_missing - that's handled separately)
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: quickEditFirstName.trim() || null,
          last_name: quickEditLastName.trim() || null,
          description: quickEditDescriptionText.trim() || null,
          job_role: quickEditJobRoleText.trim() || null,
          category: quickEditContactCategory || 'Not Set',
          score: quickEditContactScore > 0 ? quickEditContactScore : null,
          linkedin: quickEditLinkedin.trim() || null
          // Removed show_missing - it should only be updated via the "Mark as Complete" button
        })
        .eq('contact_id', contactForQuickEdit.contact_id);

      if (error) throw error;

      // Save keep_in_touch data if any fields have values
      if (quickEditKeepInTouchFrequency || quickEditChristmasWishes || quickEditEasterWishes) {
        const { data: existingRecord, error: checkError } = await supabase
          .from('keep_in_touch')
          .select('id')
          .eq('contact_id', contactForQuickEdit.contact_id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        const keepInTouchData = {
          frequency: quickEditKeepInTouchFrequency || null,
          christmas: quickEditChristmasWishes || null,
          easter: quickEditEasterWishes || null
        };

        if (existingRecord) {
          const { error: updateError } = await supabase
            .from('keep_in_touch')
            .update(keepInTouchData)
            .eq('contact_id', contactForQuickEdit.contact_id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('keep_in_touch')
            .insert({
              contact_id: contactForQuickEdit.contact_id,
              ...keepInTouchData
            });

          if (insertError) throw insertError;
        }
      }

      toast.success('Contact details updated successfully');
      closeModal();

      if (onContactUpdate) {
        onContactUpdate();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact: ' + (error.message || 'Unknown error'));
    }
  }, [
    contactForQuickEdit,
    quickEditFirstName,
    quickEditLastName,
    quickEditDescriptionText,
    quickEditJobRoleText,
    quickEditContactCategory,
    quickEditContactScore,
    quickEditLinkedin,
    quickEditShowMissing,
    quickEditKeepInTouchFrequency,
    quickEditChristmasWishes,
    quickEditEasterWishes,
    onContactUpdate
  ]);

  // Open modal handler
  const openModal = useCallback(async (contact, missingFieldsOnly = false) => {
    setShowMissingFieldsOnly(missingFieldsOnly);
    setContactForQuickEdit(contact);

    // Set initial tab
    setQuickEditActiveTab('Info');

    // Set basic fields
    setQuickEditDescriptionText(contact.description || '');
    setQuickEditJobRoleText(contact.job_role || '');
    setQuickEditContactCategory(contact.category || 'Not Set');
    setQuickEditContactScore(contact.score || 0);
    setQuickEditFirstName(contact.first_name || '');
    setQuickEditLastName(contact.last_name || '');
    setQuickEditLinkedin(contact.linkedin || '');
    setQuickEditShowMissing(contact.show_missing !== false); // Default to true if undefined

    // Load related data
    try {
      // Load companies
      const { data: companiesData } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          company_id,
          is_primary,
          relationship,
          companies (
            company_id,
            name,
            category,
            website
          )
        `)
        .eq('contact_id', contact.contact_id);

      setQuickEditContactCompanies(companiesData || []);

      // Load emails
      const { data: emailsData } = await supabase
        .from('contact_emails')
        .select('email_id, email, type, is_primary')
        .eq('contact_id', contact.contact_id)
        .order('is_primary', { ascending: false });

      // Ensure only one email is marked as primary (fix data inconsistencies)
      if (emailsData && emailsData.length > 0) {
        // Check if multiple emails are marked as primary
        const primaryEmails = emailsData.filter(e => e.is_primary);

        if (primaryEmails.length > 1) {
          // Fix the database: keep only the first as primary
          const primaryToKeep = primaryEmails[0];
          const emailsToFix = primaryEmails.slice(1);

          // Update database to remove extra primary flags
          for (const email of emailsToFix) {
            await supabase
              .from('contact_emails')
              .update({ is_primary: false })
              .eq('email_id', email.email_id);
          }

          // Update local state with corrected data
          const cleanedEmails = emailsData.map(email => ({
            ...email,
            is_primary: email.email_id === primaryToKeep.email_id
          }));
          setQuickEditContactEmails(cleanedEmails);

          console.log(`Fixed ${emailsToFix.length} duplicate primary emails for contact ${contact.contact_id}`);
        } else {
          setQuickEditContactEmails(emailsData);
        }
      } else {
        setQuickEditContactEmails([]);
      }

      // Load mobiles
      const { data: mobilesData } = await supabase
        .from('contact_mobiles')
        .select('mobile_id, mobile, type, is_primary')
        .eq('contact_id', contact.contact_id)
        .order('is_primary', { ascending: false });

      // Ensure only one mobile is marked as primary (fix data inconsistencies)
      if (mobilesData && mobilesData.length > 0) {
        // Check if multiple mobiles are marked as primary
        const primaryMobiles = mobilesData.filter(m => m.is_primary);

        if (primaryMobiles.length > 1) {
          // Fix the database: keep only the first as primary
          const primaryToKeep = primaryMobiles[0];
          const mobilesToFix = primaryMobiles.slice(1);

          // Update database to remove extra primary flags
          for (const mobile of mobilesToFix) {
            await supabase
              .from('contact_mobiles')
              .update({ is_primary: false })
              .eq('mobile_id', mobile.mobile_id);
          }

          // Update local state with corrected data
          const cleanedMobiles = mobilesData.map(mobile => ({
            ...mobile,
            is_primary: mobile.mobile_id === primaryToKeep.mobile_id
          }));
          setQuickEditContactMobiles(cleanedMobiles);

          console.log(`Fixed ${mobilesToFix.length} duplicate primary mobiles for contact ${contact.contact_id}`);
        } else {
          setQuickEditContactMobiles(mobilesData);
        }
      } else {
        setQuickEditContactMobiles([]);
      }

      // Load cities
      const { data: citiesData } = await supabase
        .from('contact_cities')
        .select(`
          entry_id,
          contact_id,
          city_id,
          cities (
            city_id,
            name,
            country
          )
        `)
        .eq('contact_id', contact.contact_id);

      setQuickEditContactCities(citiesData || []);

      // Load tags
      const { data: tagsData } = await supabase
        .from('contact_tags')
        .select(`
          entry_id,
          contact_id,
          tag_id,
          tags (
            tag_id,
            name
          )
        `)
        .eq('contact_id', contact.contact_id);

      setQuickEditContactTags(tagsData || []);

      // Load Keep in Touch data
      const { data: existingKeepInTouchData } = await supabase
        .from('keep_in_touch')
        .select('frequency, christmas, easter')
        .eq('contact_id', contact.contact_id)
        .maybeSingle();

      const birthdayComponents = parseBirthdayIntoComponents(contact.birthday);

      setQuickEditKeepInTouchFrequency(existingKeepInTouchData?.frequency || '');
      setQuickEditBirthdayDay(birthdayComponents.day);
      setQuickEditBirthdayMonth(birthdayComponents.month);
      setQuickEditAgeEstimate(birthdayComponents.ageEstimate);
      setQuickEditChristmasWishes(existingKeepInTouchData?.christmas || '');
      setQuickEditEasterWishes(existingKeepInTouchData?.easter || '');

    } catch (error) {
      console.error('Error loading contact data:', error);
      toast.error('Failed to load some contact data');
    }

    setQuickEditContactModalOpen(true);
  }, []);

  // Close modal handler
  const closeModal = useCallback(() => {
    setQuickEditContactModalOpen(false);
    setShowMissingFieldsOnly(false);
    setContactForQuickEdit(null);

    // Reset all fields
    setQuickEditDescriptionText('');
    setQuickEditJobRoleText('');
    setQuickEditContactCategory('');
    setQuickEditContactScore(0);
    setQuickEditFirstName('');
    setQuickEditLastName('');
    setQuickEditLinkedin('');
    setQuickEditKeepInTouchFrequency('');
    setQuickEditBirthdayDay('');
    setQuickEditBirthdayMonth('');
    setQuickEditAgeEstimate('');
    setQuickEditChristmasWishes('');
    setQuickEditEasterWishes('');
    setQuickEditContactEmails([]);
    setQuickEditContactMobiles([]);
    setQuickEditContactCities([]);
    setQuickEditContactTags([]);
    setQuickEditContactCompanies([]);
    setNewEmailText('');
    setNewEmailType('personal');
    setNewMobileText('');
    setNewMobileType('personal');
  }, []);

  // Reload handlers for sub-modals
  const handleQuickEditCompanyAdded = useCallback(async () => {
    if (contactForQuickEdit) {
      try {
        const { data: companiesData, error } = await supabase
          .from('contact_companies')
          .select(`
            contact_companies_id,
            company_id,
            is_primary,
            relationship,
            companies (
              company_id,
              name,
              category,
              website
            )
          `)
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (error) throw error;
        setQuickEditContactCompanies(companiesData || []);
      } catch (error) {
        console.error('Error reloading company associations:', error);
      }
    }
  }, [contactForQuickEdit]);

  const handleQuickEditCityAdded = useCallback(async () => {
    if (contactForQuickEdit) {
      try {
        const { data: citiesData, error } = await supabase
          .from('contact_cities')
          .select(`
            entry_id,
            contact_id,
            city_id,
            cities (
              city_id,
              name,
              country
            )
          `)
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (error) throw error;
        setQuickEditContactCities(citiesData || []);
      } catch (error) {
        console.error('Error reloading contact cities:', error);
      }
    }
  }, [contactForQuickEdit]);

  const handleQuickEditTagAdded = useCallback(async () => {
    if (contactForQuickEdit) {
      try {
        const { data: tagsData, error } = await supabase
          .from('contact_tags')
          .select(`
            entry_id,
            contact_id,
            tag_id,
            tags (
              tag_id,
              name
            )
          `)
          .eq('contact_id', contactForQuickEdit.contact_id);

        if (error) throw error;
        setQuickEditContactTags(tagsData || []);
      } catch (error) {
        console.error('Error reloading contact tags:', error);
      }
    }
  }, [contactForQuickEdit]);

  return {
    // Modal state
    quickEditContactModalOpen,
    contactForQuickEdit,
    showMissingFieldsOnly,

    // Tab state
    quickEditActiveTab,
    setQuickEditActiveTab,

    // Field states
    quickEditFirstName,
    setQuickEditFirstName,
    quickEditLastName,
    setQuickEditLastName,
    quickEditDescriptionText,
    setQuickEditDescriptionText,
    quickEditJobRoleText,
    setQuickEditJobRoleText,
    quickEditContactCategory,
    setQuickEditContactCategory,
    quickEditContactScore,
    setQuickEditContactScore,
    quickEditLinkedin,
    setQuickEditLinkedin,
    quickEditShowMissing,
    setQuickEditShowMissing,

    // Keep in Touch fields
    quickEditKeepInTouchFrequency,
    setQuickEditKeepInTouchFrequency,
    quickEditBirthdayDay,
    setQuickEditBirthdayDay,
    quickEditBirthdayMonth,
    setQuickEditBirthdayMonth,
    quickEditAgeEstimate,
    setQuickEditAgeEstimate,
    quickEditChristmasWishes,
    setQuickEditChristmasWishes,
    quickEditEasterWishes,
    setQuickEditEasterWishes,

    // Collections
    quickEditContactEmails,
    setQuickEditContactEmails,
    quickEditContactMobiles,
    setQuickEditContactMobiles,
    quickEditContactCities,
    setQuickEditContactCities,
    quickEditContactTags,
    setQuickEditContactTags,
    quickEditContactCompanies,
    setQuickEditContactCompanies,

    // New entry fields
    newEmailText,
    setNewEmailText,
    newEmailType,
    setNewEmailType,
    newMobileText,
    setNewMobileText,
    newMobileType,
    setNewMobileType,

    // Sub-modal states
    quickEditCityModalOpen,
    setQuickEditCityModalOpen,
    quickEditTagModalOpen,
    setQuickEditTagModalOpen,
    quickEditAssociateCompanyModalOpen,
    setQuickEditAssociateCompanyModalOpen,

    // Handlers
    openModal,
    closeModal,
    handleSaveQuickEditContact,
    handleSilentSave,
    handleAddEmail,
    handleRemoveEmail,
    handleUpdateEmailType,
    handleSetEmailPrimary,
    handleAddMobile,
    handleRemoveMobile,
    handleUpdateMobileType,
    handleSetMobilePrimary,
    handleRemoveCity,
    handleRemoveTag,
    handleUpdateCompanyRelationship,
    handleUpdateCompanyCategory,
    handleSaveQuickEditFrequency,
    handleSaveQuickEditBirthday,
    handleSaveQuickEditChristmasWishes,
    handleSaveQuickEditEasterWishes,
    handleAutomation,
    handleQuickEditCompanyAdded,
    handleQuickEditCityAdded,
    handleQuickEditTagAdded,
  };
};