import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { getCountryFlag } from '../utils/countryFlags';
import toast, { Toaster } from 'react-hot-toast';

// Constants
const SUPABASE_URL = 'https://efazuvegwxouysfcgwja.supabase.co';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;

  @media (min-width: 768px) {
    padding: 40px;
  }
`;

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  text-align: center;
  color: white;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Subtitle = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const ProgressBar = styled.div`
  display: flex;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  gap: 8px;
`;

const ProgressStep = styled.div`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${props => props.$active ? '#667eea' : props.$completed ? '#10b981' : '#e2e8f0'};
  transition: background 0.3s ease;
`;

const FormBody = styled.div`
  padding: 24px;
`;

const StepTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
`;

const StepDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    color: #6b7280;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  background: white;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$primary ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  ` : `
    background: #f1f5f9;
    color: #475569;

    &:hover:not(:disabled) {
      background: #e2e8f0;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const OTPContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 24px 0;
`;

const OTPInput = styled.input`
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #1f2937;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const DisclaimerBox = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const DisclaimerTitle = styled.div`
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DisclaimerText = styled.div`
  font-size: 14px;
  color: #78350f;
  line-height: 1.6;
`;

const CriteriaList = styled.ul`
  margin: 12px 0;
  padding-left: 20px;

  li {
    margin-bottom: 6px;
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #1e40af;
`;

const SuccessBox = styled.div`
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #065f46;
`;

const FileUploadArea = styled.div`
  border: 2px dashed ${props => props.$hasFile ? '#10b981' : '#d1d5db'};
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$hasFile ? '#f0fdf4' : '#fafafa'};

  &:hover {
    border-color: ${props => props.$hasFile ? '#10b981' : '#667eea'};
    background: ${props => props.$hasFile ? '#f0fdf4' : '#f8fafc'};
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileName = styled.div`
  font-size: 14px;
  color: #065f46;
  font-weight: 500;
  margin-top: 8px;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 0;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  span {
    padding: 0 12px;
    color: #94a3b8;
    font-size: 13px;
  }
`;

const Checkbox = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;

  input {
    margin-top: 2px;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const SummarySection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const SummaryTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;

  .label {
    color: #64748b;
  }

  .value {
    color: #1e293b;
    font-weight: 500;
  }
`;

const SuccessContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 40px;
  color: white;
`;

const NewsletterPromo = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  color: white;
  text-align: center;
`;

const CitySuggestions = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CitySuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #1f2937;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }
`;

const SelectedCity = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 20px;
  font-size: 14px;
  color: #1d4ed8;
  margin-top: 8px;

  button {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    display: flex;
    align-items: center;

    &:hover {
      color: #dc2626;
    }
  }
`;

const SuggestionDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #1f2937;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ApolloPreview = styled.div`
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
`;

const ApolloPreviewTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #065f46;
  text-transform: uppercase;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// Main Component
const DealSubmissionPage = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 7; // 0-6

  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [existingContactId, setExistingContactId] = useState(null);

  // Contact data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Company data
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [existingCompanyId, setExistingCompanyId] = useState(null);
  const [apolloData, setApolloData] = useState(null);
  const [apolloLoading, setApolloLoading] = useState(false);
  const [companyChecked, setCompanyChecked] = useState(false);
  // Company cities
  const [companyCities, setCompanyCities] = useState([]);
  const [companyCitySearch, setCompanyCitySearch] = useState('');
  const [companyCitySuggestions, setCompanyCitySuggestions] = useState([]);
  const [showCompanyCitySuggestions, setShowCompanyCitySuggestions] = useState(false);
  // Company tags
  const [companyTags, setCompanyTags] = useState([]);
  const [companyTagSearch, setCompanyTagSearch] = useState('');
  const [companyTagSuggestions, setCompanyTagSuggestions] = useState([]);
  const [showCompanyTagSuggestions, setShowCompanyTagSuggestions] = useState(false);

  // Deal data
  const [dealName, setDealName] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [dealCurrency, setDealCurrency] = useState('EUR');
  const [dealDescription, setDealDescription] = useState('');
  const [deckFile, setDeckFile] = useState(null);
  const [deckUrl, setDeckUrl] = useState('');

  // Newsletter
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  // Loading states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // OTP input refs
  const otpRefs = [
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null)
  ];

  // Fetch city suggestions
  useEffect(() => {
    const fetchCities = async () => {
      if (citySearch.length < 2) {
        setCitySuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('cities')
        .select('city_id, name, country')
        .ilike('name', `%${citySearch}%`)
        .limit(10);

      if (!error && data) {
        setCitySuggestions(data);
        setShowCitySuggestions(true);
      }
    };

    const debounce = setTimeout(fetchCities, 300);
    return () => clearTimeout(debounce);
  }, [citySearch]);

  // Fetch company city suggestions
  useEffect(() => {
    const fetchCompanyCities = async () => {
      if (companyCitySearch.length < 2) {
        setCompanyCitySuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('cities')
        .select('city_id, name, country')
        .ilike('name', `%${companyCitySearch}%`)
        .limit(10);

      if (!error && data) {
        // Filter out already selected cities
        const filtered = data.filter(
          city => !companyCities.some(c => c.city_id === city.city_id)
        );
        setCompanyCitySuggestions(filtered);
        setShowCompanyCitySuggestions(true);
      }
    };

    const debounce = setTimeout(fetchCompanyCities, 300);
    return () => clearTimeout(debounce);
  }, [companyCitySearch, companyCities]);

  // Fetch company tag suggestions
  useEffect(() => {
    const fetchCompanyTags = async () => {
      if (companyTagSearch.length < 2) {
        setCompanyTagSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${companyTagSearch}%`)
        .limit(10);

      if (!error && data) {
        // Filter out already selected tags
        const filtered = data.filter(
          tag => !companyTags.some(t => t.tag_id === tag.tag_id)
        );
        setCompanyTagSuggestions(filtered);
        setShowCompanyTagSuggestions(true);
      }
    };

    const debounce = setTimeout(fetchCompanyTags, 300);
    return () => clearTimeout(debounce);
  }, [companyTagSearch, companyTags]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCitySuggestions(false);
      setShowCompanyCitySuggestions(false);
      setShowCompanyTagSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs[nextIndex].current?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);

      if (value && index < 5) {
        otpRefs[index + 1].current?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/deal-submission-otp/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification code sent to your email');
        setCurrentStep(2);
      } else {
        toast.error(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/deal-submission-otp/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setOtpVerified(true);

        // If contact exists in CRM, pre-fill data
        if (data.contact_id) {
          setExistingContactId(data.contact_id);
          if (data.contact) {
            setFirstName(data.contact.first_name || '');
            setLastName(data.contact.last_name || '');
            setLinkedin(data.contact.linkedin || '');
            setJobRole(data.contact.job_role || '');

            // Set mobile if available
            if (data.mobiles && data.mobiles.length > 0) {
              const primaryMobile = data.mobiles.find(m => m.is_primary) || data.mobiles[0];
              setMobile(primaryMobile.mobile || '');
            }

            // Set city if available
            if (data.cities && data.cities.length > 0) {
              setSelectedCity(data.cities[0]);
            }
          }
        }

        toast.success('Email verified successfully!');
        setCurrentStep(3);
      } else {
        toast.error(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Check company and enrich with Apollo
  const handleCheckCompany = async () => {
    if (!companyWebsite) {
      toast.error('Please enter company website');
      return;
    }

    setApolloLoading(true);
    try {
      // Extract domain from website
      let domain = companyWebsite;
      if (domain) {
        domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      }

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/deal-submission/check-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          name: null,
          linkedin: null
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.company_id) {
          setExistingCompanyId(data.company_id);
          // Pre-fill with existing data
          if (data.company) {
            setCompanyName(data.company.name || '');
            if (data.company.website) {
              setCompanyWebsite(data.company.website);
            }
            setCompanyLinkedin(data.company.linkedin || '');
            setCompanyDescription(data.company.description || '');
          }
          // Pre-fill cities and tags
          if (data.cities && data.cities.length > 0) {
            setCompanyCities(data.cities);
          }
          if (data.tags && data.tags.length > 0) {
            setCompanyTags(data.tags);
          }
          toast.success('Company found in our database!');
        } else {
          // Not found - clear fields for manual entry
          setCompanyName('');
          setCompanyLinkedin('');
          setCompanyDescription('');
          setCompanyCities([]);
          setCompanyTags([]);
          toast('Company not found. Please fill in the details.', { icon: 'ℹ️' });
        }

        if (data.apollo_data) {
          setApolloData(data.apollo_data);
          // Apply Apollo enrichment if no existing company
          if (!data.company_id) {
            if (data.apollo_data.description) {
              setCompanyDescription(data.apollo_data.description);
            }
            if (data.apollo_data.linkedin) {
              setCompanyLinkedin(data.apollo_data.linkedin);
            }
          }
        }

        setCompanyChecked(true);
      }
    } catch (error) {
      console.error('Error checking company:', error);
      toast.error('Error checking company. Please try again.');
    } finally {
      setApolloLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      if (!file.type.includes('pdf')) {
        toast.error('Only PDF files are accepted');
        return;
      }
      setDeckFile(file);
      setDeckUrl(''); // Clear URL if file is uploaded
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('email', email);
      formData.append('existingContactId', existingContactId || '');
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('mobile', mobile);
      formData.append('linkedin', linkedin);
      formData.append('jobRole', jobRole);
      formData.append('cityId', selectedCity?.city_id || '');
      formData.append('companyName', companyName);
      formData.append('companyWebsite', companyWebsite);
      formData.append('companyLinkedin', companyLinkedin);
      formData.append('companyDescription', companyDescription);
      formData.append('existingCompanyId', existingCompanyId || '');
      formData.append('companyCityIds', JSON.stringify(companyCities.map(c => c.city_id)));
      formData.append('companyTagIds', JSON.stringify(companyTags.map(t => t.tag_id)));
      formData.append('dealName', dealName || companyName);
      formData.append('investmentAmount', investmentAmount);
      formData.append('dealCurrency', dealCurrency);
      formData.append('dealDescription', dealDescription);
      formData.append('deckUrl', deckUrl);
      formData.append('subscribeNewsletter', subscribeNewsletter);

      if (deckFile) {
        formData.append('deckFile', deckFile);
      }

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/deal-submission/submit`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        toast.success('Your submission has been received!');
      } else {
        toast.error(data.error || 'Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    // Success state
    if (submitted) {
      return (
        <SuccessContainer>
          <SuccessIcon>✓</SuccessIcon>
          <StepTitle style={{ textAlign: 'center' }}>Thank You!</StepTitle>
          <StepDescription style={{ textAlign: 'center', marginBottom: 0 }}>
            Your deal submission has been received successfully.
            <br />
            You'll receive a confirmation email shortly.
            <br />
            <strong>I'll review your proposal and get back to you within 24-48 hours.</strong>
          </StepDescription>

          <NewsletterPromo>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              While you wait...
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
              Subscribe to my newsletter for insights on angel investing, startups, and the European tech ecosystem.
            </div>
            <Button
              as="a"
              href="https://angelinvesting.it"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#667eea',
                padding: '12px 24px',
                textDecoration: 'none'
              }}
            >
              Visit AngelInvesting.it →
            </Button>
          </NewsletterPromo>
        </SuccessContainer>
      );
    }

    switch (currentStep) {
      case 0: // Disclaimer
        return (
          <>
            <StepTitle>Before We Start</StepTitle>
            <DisclaimerBox>
              <DisclaimerTitle>
                ⚠️ Investment Criteria
              </DisclaimerTitle>
              <DisclaimerText>
                I invest exclusively in:
                <CriteriaList>
                  <li><strong>Pre-seed and Seed stage</strong> startups</li>
                  <li>Teams <strong>based in Europe</strong></li>
                  <li><strong>Tech-enabled</strong> businesses</li>
                </CriteriaList>
                If your startup doesn't meet these criteria, this form is probably not the right fit.
                However, I'm always happy to connect on LinkedIn for future opportunities.
              </DisclaimerText>
            </DisclaimerBox>
            <Button $primary onClick={() => setCurrentStep(1)}>
              I Understand, Let's Continue
            </Button>
          </>
        );

      case 1: // Email
        return (
          <>
            <StepTitle>Let's Start with Your Email</StepTitle>
            <StepDescription>
              We'll send you a verification code to confirm your email address.
            </StepDescription>
            <FormGroup>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@startup.com"
                autoFocus
              />
            </FormGroup>
            <ButtonRow>
              <Button onClick={() => setCurrentStep(0)}>Back</Button>
              <Button $primary onClick={handleSendOtp} disabled={sendingOtp || !email}>
                {sendingOtp && <LoadingSpinner />}
                {sendingOtp ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </ButtonRow>
          </>
        );

      case 2: // OTP
        return (
          <>
            <StepTitle>Check Your Email</StepTitle>
            <StepDescription>
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </StepDescription>
            <OTPContainer>
              {otp.map((digit, index) => (
                <OTPInput
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  autoFocus={index === 0}
                />
              ))}
            </OTPContainer>
            <ButtonRow>
              <Button onClick={() => { setCurrentStep(1); setOtp(['', '', '', '', '', '']); }}>
                Change Email
              </Button>
              <Button $primary onClick={handleVerifyOtp} disabled={verifyingOtp || otp.join('').length !== 6}>
                {verifyingOtp && <LoadingSpinner />}
                {verifyingOtp ? 'Verifying...' : 'Verify Code'}
              </Button>
            </ButtonRow>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={handleSendOtp}
                disabled={sendingOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </>
        );

      case 3: // Contact Info
        return (
          <>
            <StepTitle>Your Information</StepTitle>
            <StepDescription>
              {existingContactId
                ? "We found your profile! Please review and update if needed."
                : "Tell us about yourself."}
            </StepDescription>

            {existingContactId && (
              <SuccessBox>
                ✓ We found your contact information in our system
              </SuccessBox>
            )}

            <FormGroup>
              <Label>First Name *</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </FormGroup>

            <FormGroup>
              <Label>Last Name *</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </FormGroup>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>WhatsApp Number</Label>
              <Input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+39 123 456 7890"
              />
            </FormGroup>

            <FormGroup>
              <Label>LinkedIn Profile</Label>
              <Input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </FormGroup>

            <FormGroup>
              <Label>Job Title</Label>
              <Input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="CEO & Co-Founder"
              />
            </FormGroup>

            <FormGroup>
              <Label>City</Label>
              <Input
                type="text"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setSelectedCity(null);
                }}
                onFocus={() => citySearch.length >= 2 && setShowCitySuggestions(true)}
                placeholder="Start typing your city..."
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <CitySuggestions>
                  {citySuggestions.map(city => (
                    <CitySuggestionItem
                      key={city.city_id}
                      onClick={() => {
                        setSelectedCity(city);
                        setCitySearch('');
                        setShowCitySuggestions(false);
                      }}
                    >
                      {getCountryFlag(city.country)} {city.name}, {city.country}
                    </CitySuggestionItem>
                  ))}
                </CitySuggestions>
              )}
              {selectedCity && (
                <SelectedCity>
                  {getCountryFlag(selectedCity.country)} {selectedCity.name}, {selectedCity.country}
                  <button onClick={() => setSelectedCity(null)}>×</button>
                </SelectedCity>
              )}
            </FormGroup>

            <ButtonRow>
              <Button onClick={() => setCurrentStep(0)}>Start Over</Button>
              <Button
                $primary
                onClick={() => setCurrentStep(4)}
                disabled={!firstName || !lastName}
              >
                Continue
              </Button>
            </ButtonRow>
          </>
        );

      case 4: // Company Info
        return (
          <>
            <StepTitle>Your Company</StepTitle>
            <StepDescription>
              {!companyChecked
                ? "Enter your company's website and we'll look it up."
                : "Review and complete your company information."
              }
            </StepDescription>

            <FormGroup>
              <Label>Website *</Label>
              <Input
                type="url"
                value={companyWebsite}
                onChange={(e) => {
                  setCompanyWebsite(e.target.value);
                  // Reset check state if website changes
                  if (companyChecked) {
                    setCompanyChecked(false);
                    setExistingCompanyId(null);
                    setApolloData(null);
                    setCompanyCities([]);
                    setCompanyTags([]);
                  }
                }}
                placeholder="https://yourcompany.com"
                disabled={apolloLoading}
              />
            </FormGroup>

            {!companyChecked && (
              <Button
                $primary
                onClick={handleCheckCompany}
                disabled={!companyWebsite || apolloLoading}
                style={{ marginBottom: '20px' }}
              >
                {apolloLoading ? (
                  <>
                    <LoadingSpinner style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
                    Looking up company...
                  </>
                ) : (
                  'Check Company'
                )}
              </Button>
            )}

            {companyChecked && (
              <>
                {existingCompanyId && (
                  <SuccessBox style={{ marginBottom: '20px' }}>
                    ✓ Company found in our database
                  </SuccessBox>
                )}

                {apolloData && !existingCompanyId && (
                  <ApolloPreview style={{ marginBottom: '20px' }}>
                    <ApolloPreviewTitle>
                      ✓ Company data found via Apollo
                    </ApolloPreviewTitle>
                    <div style={{ fontSize: '13px', color: '#065f46' }}>
                      {apolloData.description && <div>Description auto-filled.</div>}
                      {apolloData.industries?.length > 0 && (
                        <div style={{ marginTop: '4px' }}>Industries: {apolloData.industries.join(', ')}</div>
                      )}
                    </div>
                  </ApolloPreview>
                )}

                <FormGroup>
                  <Label>Company Name *</Label>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc."
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Company LinkedIn</Label>
                  <Input
                    type="url"
                    value={companyLinkedin}
                    onChange={(e) => setCompanyLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/company/acme"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Company Description</Label>
                  <TextArea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    placeholder="Brief description of what your company does..."
                  />
                </FormGroup>

                {/* Company Cities */}
                <FormGroup>
                  <Label>Company Cities</Label>
                  {companyCities.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      {companyCities.map(city => (
                        <span
                          key={city.city_id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            borderRadius: '16px',
                            fontSize: '13px'
                          }}
                        >
                          {getCountryFlag(city.country)} {city.name}
                          <button
                            type="button"
                            onClick={() => setCompanyCities(companyCities.filter(c => c.city_id !== city.city_id))}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0',
                              color: '#0369a1',
                              fontSize: '14px',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ position: 'relative' }}>
                    <Input
                      type="text"
                      value={companyCitySearch}
                      onChange={(e) => setCompanyCitySearch(e.target.value)}
                      onFocus={() => companyCitySearch.length >= 2 && setShowCompanyCitySuggestions(true)}
                      placeholder="Search cities..."
                    />
                    {showCompanyCitySuggestions && companyCitySuggestions.length > 0 && (
                      <SuggestionDropdown>
                        {companyCitySuggestions.map(city => (
                          <SuggestionItem
                            key={city.city_id}
                            onClick={() => {
                              setCompanyCities([...companyCities, city]);
                              setCompanyCitySearch('');
                              setShowCompanyCitySuggestions(false);
                            }}
                          >
                            {getCountryFlag(city.country)} {city.name}, {city.country}
                          </SuggestionItem>
                        ))}
                      </SuggestionDropdown>
                    )}
                  </div>
                </FormGroup>

                {/* Company Tags */}
                <FormGroup>
                  <Label>Company Tags</Label>
                  {companyTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      {companyTags.map(tag => (
                        <span
                          key={tag.tag_id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '16px',
                            fontSize: '13px'
                          }}
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => setCompanyTags(companyTags.filter(t => t.tag_id !== tag.tag_id))}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0',
                              color: '#92400e',
                              fontSize: '14px',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ position: 'relative' }}>
                    <Input
                      type="text"
                      value={companyTagSearch}
                      onChange={(e) => setCompanyTagSearch(e.target.value)}
                      onFocus={() => companyTagSearch.length >= 2 && setShowCompanyTagSuggestions(true)}
                      placeholder="Search tags..."
                    />
                    {showCompanyTagSuggestions && companyTagSuggestions.length > 0 && (
                      <SuggestionDropdown>
                        {companyTagSuggestions.map(tag => (
                          <SuggestionItem
                            key={tag.tag_id}
                            onClick={() => {
                              setCompanyTags([...companyTags, tag]);
                              setCompanyTagSearch('');
                              setShowCompanyTagSuggestions(false);
                            }}
                          >
                            {tag.name}
                          </SuggestionItem>
                        ))}
                      </SuggestionDropdown>
                    )}
                  </div>
                </FormGroup>
              </>
            )}

            <ButtonRow>
              <Button onClick={() => setCurrentStep(3)}>Back</Button>
              <Button
                $primary
                onClick={() => {
                  setDealName(companyName);
                  setCurrentStep(5);
                }}
                disabled={!companyChecked || !companyName || !companyWebsite}
              >
                Continue
              </Button>
            </ButtonRow>
          </>
        );

      case 5: // Deal Info
        return (
          <>
            <StepTitle>Your Deal</StepTitle>
            <StepDescription>
              Tell us about your funding round and share your pitch deck.
            </StepDescription>

            <FormGroup>
              <Label>Deal Name *</Label>
              <Input
                type="text"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="Usually your company name"
              />
            </FormGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <FormGroup>
                <Label>Amount Seeking</Label>
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="500000"
                />
              </FormGroup>

              <FormGroup>
                <Label>Currency</Label>
                <Select
                  value={dealCurrency}
                  onChange={(e) => setDealCurrency(e.target.value)}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </Select>
              </FormGroup>
            </div>

            <FormGroup>
              <Label>Brief Pitch (2-3 sentences)</Label>
              <TextArea
                value={dealDescription}
                onChange={(e) => setDealDescription(e.target.value)}
                placeholder="We're building X for Y. We've achieved Z and are raising to..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Pitch Deck</Label>
              <FileUploadArea
                $hasFile={!!deckFile}
                onClick={() => document.getElementById('deck-upload').click()}
              >
                <FileInput
                  id="deck-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                {deckFile ? (
                  <>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                    <FileName>{deckFile.name}</FileName>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Click to replace
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📤</div>
                    <div style={{ color: '#4b5563', fontWeight: 500 }}>
                      Click to upload your pitch deck
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      PDF only, max 10MB
                    </div>
                  </>
                )}
              </FileUploadArea>
            </FormGroup>

            <OrDivider><span>OR</span></OrDivider>

            <FormGroup>
              <Label>Deck URL (Canva, Google Slides, etc.)</Label>
              <Input
                type="url"
                value={deckUrl}
                onChange={(e) => {
                  setDeckUrl(e.target.value);
                  if (e.target.value) setDeckFile(null);
                }}
                placeholder="https://www.canva.com/design/..."
                disabled={!!deckFile}
              />
            </FormGroup>

            <ButtonRow>
              <Button onClick={() => setCurrentStep(4)}>Back</Button>
              <Button
                $primary
                onClick={() => setCurrentStep(6)}
                disabled={!dealName}
              >
                Review Submission
              </Button>
            </ButtonRow>
          </>
        );

      case 6: // Confirmation
        return (
          <>
            <StepTitle>Review & Submit</StepTitle>
            <StepDescription>
              Please review your information before submitting.
            </StepDescription>

            <SummarySection>
              <SummaryTitle>Contact Information</SummaryTitle>
              <SummaryRow>
                <span className="label">Name</span>
                <span className="value">{firstName} {lastName}</span>
              </SummaryRow>
              <SummaryRow>
                <span className="label">Email</span>
                <span className="value">{email}</span>
              </SummaryRow>
              {mobile && (
                <SummaryRow>
                  <span className="label">WhatsApp</span>
                  <span className="value">{mobile}</span>
                </SummaryRow>
              )}
              {jobRole && (
                <SummaryRow>
                  <span className="label">Role</span>
                  <span className="value">{jobRole}</span>
                </SummaryRow>
              )}
            </SummarySection>

            <SummarySection>
              <SummaryTitle>Company</SummaryTitle>
              <SummaryRow>
                <span className="label">Name</span>
                <span className="value">{companyName}</span>
              </SummaryRow>
              <SummaryRow>
                <span className="label">Website</span>
                <span className="value">{companyWebsite}</span>
              </SummaryRow>
            </SummarySection>

            <SummarySection>
              <SummaryTitle>Deal</SummaryTitle>
              <SummaryRow>
                <span className="label">Deal Name</span>
                <span className="value">{dealName}</span>
              </SummaryRow>
              {investmentAmount && (
                <SummaryRow>
                  <span className="label">Amount</span>
                  <span className="value">{Number(investmentAmount).toLocaleString()} {dealCurrency}</span>
                </SummaryRow>
              )}
              <SummaryRow>
                <span className="label">Deck</span>
                <span className="value">
                  {deckFile ? deckFile.name : (deckUrl ? 'URL provided' : 'Not provided')}
                </span>
              </SummaryRow>
            </SummarySection>

            <FormGroup>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                />
                <span>
                  Subscribe to <strong>AngelInvesting.it</strong> newsletter for insights on
                  angel investing, startups, and the European tech ecosystem.
                </span>
              </Checkbox>
            </FormGroup>

            <ButtonRow>
              <Button onClick={() => setCurrentStep(5)}>Back</Button>
              <Button $primary onClick={handleSubmit} disabled={submitting}>
                {submitting && <LoadingSpinner />}
                {submitting ? 'Submitting...' : 'Submit Deal'}
              </Button>
            </ButtonRow>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <Toaster position="top-center" />

      <FormCard>
        <Header>
          <Logo>Deal Submission</Logo>
          <Subtitle>Share your startup with me</Subtitle>
        </Header>

        {!submitted && (
          <ProgressBar>
            {[...Array(totalSteps)].map((_, index) => (
              <ProgressStep
                key={index}
                $active={currentStep === index}
                $completed={currentStep > index}
              />
            ))}
          </ProgressBar>
        )}

        <FormBody>
          {renderStepContent()}
        </FormBody>
      </FormCard>

      <div style={{
        marginTop: '24px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '13px',
        textAlign: 'center'
      }}>
        Your information is handled securely and privately.
      </div>
    </PageContainer>
  );
};

export default DealSubmissionPage;
