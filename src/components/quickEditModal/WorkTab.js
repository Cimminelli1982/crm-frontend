import React from 'react';
import { FaBuilding } from 'react-icons/fa';
import {
  FormGroup,
  Label,
  Input,
  ManageButton,
  CompaniesContainer,
  CompanyItem,
  CompanyName,
  CompanyFieldGroup,
  CompanyFieldLabel,
  CompanySelect,
  EmptyState,
  PrimaryBadge
} from './StyledComponents';

const WorkTab = ({
  contact,
  jobRole,
  setJobRole,
  linkedin,
  setLinkedin,
  companies,
  setCompanyModalOpen,
  handleUpdateCompanyRelationship,
  handleUpdateCompanyCategory,
  theme,
  shouldShowField,
  onOpenEnrichModal
}) => {
  return (
    <>
      {/* Job Title */}
      {shouldShowField('job_role') && (
        <FormGroup>
          <Label theme={theme}>Job Title</Label>
          <Input
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="Enter job title..."
            theme={theme}
          />
        </FormGroup>
      )}

      {/* LinkedIn */}
      {shouldShowField('linkedin') && (
        <FormGroup>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Label theme={theme} style={{ margin: 0 }}>LinkedIn Profile</Label>
            {(!contact?.linkedin || contact?.linkedin === '') && onOpenEnrichModal && (
              <ManageButton
                onClick={(e) => {
                  e.preventDefault();
                  onOpenEnrichModal();
                }}
              >
                🔍 Find with Apollo
              </ManageButton>
            )}
          </div>
          <Input
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            theme={theme}
          />
        </FormGroup>
      )}

      {/* Company Associations */}
      {shouldShowField('company') && (
        <FormGroup>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Label theme={theme} style={{ margin: 0 }}>Company Associations</Label>
            <ManageButton
              onClick={() => setCompanyModalOpen(true)}
            >
              + Manage Companies
            </ManageButton>
          </div>

          <CompaniesContainer theme={theme}>
            {companies?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {companies.map((companyRelation) => (
                  <CompanyItem key={companyRelation.contact_companies_id} theme={theme}>
                    <FaBuilding style={{ fontSize: '14px', color: '#3B82F6' }} />
                    <div style={{ flex: 1 }}>
                      <CompanyName theme={theme}>
                        {companyRelation.companies?.name || 'Unknown Company'}
                        {companyRelation.is_primary && (
                          <PrimaryBadge>PRIMARY</PrimaryBadge>
                        )}
                      </CompanyName>

                      {/* Relationship Type */}
                      <CompanyFieldGroup>
                        <CompanyFieldLabel theme={theme}>Relationship</CompanyFieldLabel>
                        <CompanySelect
                          value={companyRelation.relationship || 'not_set'}
                          onChange={(e) => handleUpdateCompanyRelationship(companyRelation.contact_companies_id, e.target.value)}
                          theme={theme}
                        >
                          <option value="not_set">Not Set</option>
                          <option value="employee">Employee</option>
                          <option value="founder">Founder</option>
                          <option value="advisor">Advisor</option>
                          <option value="manager">Manager</option>
                          <option value="investor">Investor</option>
                          <option value="other">Other</option>
                          <option value="suggestion">Suggestion</option>
                        </CompanySelect>
                      </CompanyFieldGroup>

                      {/* Company Category */}
                      <CompanyFieldGroup>
                        <CompanyFieldLabel theme={theme}>Company Category</CompanyFieldLabel>
                        <CompanySelect
                          value={companyRelation.companies?.category || 'Not Set'}
                          onChange={(e) => handleUpdateCompanyCategory(
                            companyRelation.companies?.company_id || companyRelation.companies?.id,
                            e.target.value
                          )}
                          theme={theme}
                        >
                          <option value="Not Set">Not Set</option>
                          <option value="Advisory">Advisory</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Corporation">Corporation</option>
                          <option value="Inbox">Inbox</option>
                          <option value="Institution">Institution</option>
                          <option value="Media">Media</option>
                          <option value="Professional Investor">Professional Investor</option>
                          <option value="SME">SME</option>
                          <option value="Skip">Skip</option>
                          <option value="Startup">Startup</option>
                        </CompanySelect>
                      </CompanyFieldGroup>
                    </div>
                  </CompanyItem>
                ))}
              </div>
            ) : (
              <EmptyState theme={theme}>
                <FaBuilding style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }} />
                <span>No companies associated</span>
              </EmptyState>
            )}
          </CompaniesContainer>
        </FormGroup>
      )}
    </>
  );
};

export default WorkTab;