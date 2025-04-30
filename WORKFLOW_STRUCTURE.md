# ContactCrmWorkflow.js Code Structure Guide

## Overview

This document provides a guide to the structure and key sections of the `ContactCrmWorkflow.js` file, which implements the main workflow for managing contact information in the CRM system.

## File Organization

### Component Imports (Lines 1-37)
```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { 
  FiX, FiCheck, FiTrash2, FiArrowRight, FiArrowLeft, /* and many more icons */ 
} from 'react-icons/fi';
```

### Styled Components (Lines 42-1151)
All styled components used in the application are defined at the top of the file:
```jsx
const Container = styled.div`...`;
const Header = styled.div`...`;
// ... many more styled components
```

### Main Component Function (Lines 1153-7715)
The main `ContactCrmWorkflow` component starts around line 1153:
```jsx
const ContactCrmWorkflow = () => {
  // ...component implementation
};
```

## Key State Variables

### Core State (Lines 1160-1179)
```jsx
// State
const [contact, setContact] = useState(null);
const [currentStep, setCurrentStep] = useState(parseInt(stepParam) || 1);
const [loading, setLoading] = useState(true);

// State for inline editing
const [isEditingName, setIsEditingName] = useState(false);
const [editFirstName, setEditFirstName] = useState('');
const [editLastName, setEditLastName] = useState('');
const [editingCompanyIndex, setEditingCompanyIndex] = useState(null);
const [editingCompanyData, setEditingCompanyData] = useState(null);
const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
const [newCompanyData, setNewCompanyData] = useState({
  name: '',
  category: '',
  website: '',
  description: '',
  linkedin: ''
});
const [error, setError] = useState(null);
```

### Workflow Step-specific State (Lines 1181-1220)
```jsx
// Step 1: Interactions confirmation
const [interactions, setInteractions] = useState({/*...*/});

// Step 2: Duplicate check
const [duplicates, setDuplicates] = useState([]);
const [selectedDuplicate, setSelectedDuplicate] = useState(null);
const [mergeSelections, setMergeSelections] = useState({/*...*/});

// Step 3 & 4: Contact enrichment
const [formData, setFormData] = useState({/*...*/});
```

## Major Functions and Utilities

### Data Loading and Initialization (Lines ~1300-2150)
```jsx
// Initialize the component
useEffect(() => {
  // Load contact data when component mounts
  loadContactData();
}, [contactId]);

// Main data loading function
const loadContactData = async () => {
  try {
    setLoading(true);
    // ...fetch data from Supabase
  } catch (err) {
    // ...error handling
  }
};
```

### Navigation and Step Control (Lines ~2200-2400)
```jsx
// Function to navigate between steps
const goToStep = (step) => {
  setCurrentStep(step);
  navigate(`/contacts/workflow/${contactId}?step=${step}`);
};
```

### Data Saving Functions (Lines ~2400-3000)
```jsx
// Save contact enrichment changes
const saveContactEnrichment = async () => {
  try {
    // Update contact data in Supabase
    // 1. Update base contact information
    // 2. Handle email addresses
    // 3. Handle mobile numbers
    // 4. Handle tags
    // 5. Handle cities
    // 5.5 Handle company associations
    // 6. Reload contact data
  } catch (err) {
    // Error handling
  }
};
```

### Search and Filtering Functions (Lines ~3000-3800)
```jsx
// Search functions for companies, tags, etc.
const searchCompanies = async (query) => {/*...*/};
const searchTags = async (query) => {/*...*/};
// ...more search functions
```

## Workflow Steps Rendering

The workflow consists of 4 main steps:

### Step 1: Interactions (Lines ~4000-4600)
Shows interactions from various channels (email, WhatsApp, etc.) for review:
```jsx
{currentStep === 1 && (
  <>
    <Card>
      <SectionTitle>
        <FiMessageSquare /> Interactions
      </SectionTitle>
      {/* Interaction content */}
    </Card>
  </>
)}
```

### Step 2: Duplicate Check (Lines ~4600-5100)
Checks and manages potential duplicate contacts:
```jsx
{currentStep === 2 && (
  <>
    <Card>
      <SectionTitle>
        <FiGitMerge /> Duplicate Check
      </SectionTitle>
      {/* Duplicate handling content */}
    </Card>
  </>
)}
```

### Step 3: Contact Enrichment (Lines ~5100-6900)
Main section for enriching contact data, with multiple tabs for different information:
```jsx
{currentStep === 3 && (
  <>
    <Card>
      <SectionTitle>
        <FiInfo /> Contact Enrichment
      </SectionTitle>
      <InteractionsLayout>
        {/* Left navigation menu */}
        <ChannelsMenu>
          {/* Section tabs: basics, tags, notes, companies, deals, airtable */}
        </ChannelsMenu>
        
        {/* Content for each section */}
        <InteractionsContainer>
          {/* Different sections rendered based on activeEnrichmentSection */}
          
          {/* BASICS SECTION (~Lines 5300-5650) */}
          {activeEnrichmentSection === "basics" && (/*...*/)}
          
          {/* TAGS SECTION (~Lines 5650-5900) */}
          {activeEnrichmentSection === "tags" && (/*...*/)}
          
          {/* NOTES SECTION (~Lines 6780-6950) */}
          {activeEnrichmentSection === "notes" && (
            <>
              <FormGroup>
                <FormFieldLabel>Rating</FormFieldLabel>
                {/* Rating stars UI */}
              </FormGroup>
              
              <FormGroup>
                <FormFieldLabel>Description</FormFieldLabel>
                {/* Description editing UI */}
              </FormGroup>
              
              <FormGroup>
                <FormFieldLabel>Birthday</FormFieldLabel>
                {/* Birthday input */}
              </FormGroup>
            </>
          )}
          
          {/* COMPANIES SECTION (~Lines 5870-6760) */}
          {activeEnrichmentSection === "companies" && (
            <>
              <FormGroup>
                <FormFieldLabel>LinkedIn Profile</FormFieldLabel>
                {/* LinkedIn input and buttons */}
              </FormGroup>
              
              <FormGroup>
                <FormFieldLabel>Job Role</FormFieldLabel>
                {/* Job role input and save button */}
              </FormGroup>
              
              <FormGroup>
                <FormFieldLabel>Associated Companies</FormFieldLabel>
                {/* Company list and editing UI */}
                
                {/* Add company form */}
                <div>
                  <div>Add Company</div>
                  <div>
                    <Input placeholder="Search for company..." />
                    <button>New</button>
                  </div>
                </div>
              </FormGroup>
            </>
          )}
          
          {/* DEALS SECTION (~Lines 6760-6780) */}
          {activeEnrichmentSection === "deals" && (/*...*/)}
        </InteractionsContainer>
      </InteractionsLayout>
    </Card>
  </>
)}
```

### Step 4: Recap (Lines ~6900-7100)
Final step to review all information before saving:
```jsx
{currentStep === 4 && (
  <>
    <Card>
      <SectionTitle>
        <FiBriefcase /> Professional Information
      </SectionTitle>
      {/* Final review content */}
    </Card>
  </>
)}
```

## Modals

### Delete Confirmation Modal (Lines ~7100-7480)
```jsx
<Modal isOpen={deleteModalOpen} onRequestClose={() => setDeleteModalOpen(false)}>
  <ModalHeader>
    <h2>Delete Contact and Associated Data</h2>
    <CloseButton onClick={() => setDeleteModalOpen(false)}>
      <FiX />
    </CloseButton>
  </ModalHeader>
  {/* Modal content */}
</Modal>
```

### New Company Modal (Lines ~7490-7710)
```jsx
<Modal isOpen={showNewCompanyModal} onRequestClose={() => setShowNewCompanyModal(false)}>
  <ModalHeader>
    <h2>Add New Company</h2>
    <CloseButton onClick={() => setShowNewCompanyModal(false)}>
      <FiX />
    </CloseButton>
  </ModalHeader>
  
  <div>
    {/* Form fields */}
    <FormGroup>
      <FormFieldLabel>Company Name*</FormFieldLabel>
      <Input /*...*/ />
    </FormGroup>
    
    <FormGroup>
      <FormFieldLabel>Category*</FormFieldLabel>
      <Select /*...*/ />
    </FormGroup>
    
    <FormGroup>
      <FormFieldLabel>Website</FormFieldLabel>
      <Input /*...*/ />
    </FormGroup>
    
    <FormGroup>
      <FormFieldLabel>LinkedIn</FormFieldLabel>
      <Input /*...*/ />
    </FormGroup>
    
    <FormGroup>
      <FormFieldLabel>Description</FormFieldLabel>
      <TextArea /*...*/ />
    </FormGroup>
  </div>
  
  <ButtonGroup>
    <ActionButton>Cancel</ActionButton>
    <ActionButton>Create Company</ActionButton>
  </ButtonGroup>
</Modal>
```

## Recent Changes

### April 2025
1. Added Job Role field to Companies section under Contact Enrichment
2. Fixed Description editing in Notes tab
3. Improved Company UI layout in Contact Enrichment tab
4. Added New Company modal with form fields

## Database Tables Used

### Main Tables
- `contacts` - Core contact information
- `contact_emails` - Email addresses associated with contacts
- `contact_mobiles` - Mobile numbers associated with contacts
- `contact_tags` - Tags associated with contacts
- `contact_cities` - Cities associated with contacts
- `contact_companies` - Company associations with roles
- `companies` - Company information
- `tags` - Available tags
- `cities` - Available cities

### Data Operations
- Read operations use direct selects with filters
- Write operations use transactions where appropriate
- Many-to-many relationships managed through junction tables

## Navigation and Workflow Flow

The workflow progresses through 4 main steps:

1. **Interactions** - Review interaction history from various channels
2. **Duplicate Check** - Identify and manage potential duplicates
3. **Contact Enrichment** - Add and edit detailed contact information
4. **Recap** - Final review before saving to CRM

Each step has navigation buttons for moving forward and backward in the workflow.

## Styling Patterns

The file uses styled-components for most UI elements. Common patterns include:
- Dark backgrounds (#222, #333)
- Green accents (#00ff00) for primary actions and highlights
- Clear section distinctions with borders and spacing
- Consistent padding and margins
- Responsive layouts using flex