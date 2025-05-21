import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiSearch, FiFilter, FiPlus, FiLink, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Setup Modal for React
Modal.setAppElement('#root');

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;

  h2 {
    color: #00ff00;
    margin: 0;
    font-size: 1.2rem;
    font-family: 'Courier New', monospace;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  height: calc(100% - 70px); /* Account for header */
  width: 100%;
`;

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 15%;
  border-right: 1px solid #333;
  min-height: 100%;
  background-color: #0a0a0a;
`;

const ContentArea = styled.div`
  width: 85%;
  padding: 0 20px;
  overflow-y: auto;
`;

const Tab = styled.div`
  padding: 15px 15px;
  cursor: pointer;
  color: ${props => props.$isActive ? '#00ff00' : '#ccc'};
  border-left: 3px solid ${props => props.$isActive ? '#00ff00' : 'transparent'};
  font-weight: ${props => props.$isActive ? 'bold' : 'normal'};
  background-color: ${props => props.$isActive ? '#121212' : 'transparent'};
  
  &:hover {
    color: #00ff00;
    background-color: rgba(0, 255, 0, 0.05);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ff0000;
  }
`;

const ModalContent = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
  min-height: 300px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

// Coming soon message for tabs not yet implemented
const ComingSoonMessage = styled.div`
  font-size: 1.2rem;
  color: #00ff00;
  text-align: center;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  
  p {
    margin: 10px 0;
  }
  
  .emoji {
    font-size: 2rem;
    margin: 20px 0;
  }
`;

// Styled components for the Add from List tab
const SearchContainer = styled.div`
  margin-bottom: 20px;
  width: 100%;
  padding: 0 15px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 10px;
  width: 100%;
  
  svg {
    color: #666;
    margin-right: 8px;
  }
  
  input {
    background: none;
    border: none;
    color: #ccc;
    font-size: 14px;
    width: 100%;
    outline: none;
    
    &::placeholder {
      color: #666;
    }
  }
`;

const SuggestedSearch = styled.div`
  color: #00ff00;
  font-size: 12px;
  margin-top: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  span {
    margin-left: 5px;
    padding: 3px 8px;
    background-color: rgba(0, 255, 0, 0.1);
    border-radius: 4px;
    
    &:hover {
      background-color: rgba(0, 255, 0, 0.2);
    }
  }
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 0 15px 15px 15px;
  border-bottom: 1px solid #333;
  overflow-x: auto;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: #00ff00 #222;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.$active ? 'rgba(0, 255, 0, 0.15)' : '#1a1a1a'};
  color: ${props => props.$active ? '#00ff00' : '#ccc'};
  border: 1px solid ${props => props.$active ? '#00ff00' : '#333'};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.$active ? 'rgba(0, 255, 0, 0.15)' : 'rgba(0, 255, 0, 0.05)'};
    border-color: ${props => props.$active ? '#00ff00' : '#444'};
  }
`;

const DealsList = styled.div`
  height: calc(100% - 150px);
  overflow-y: auto;
  width: 100%;
  padding: 0 15px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const DealItem = styled.div`
  background-color: #1a1a1a;
  border: ${props => props.$isAssociated ? '2px solid #00ff00' : '1px solid #333'};
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    border-color: #00ff00;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.2);
  }
  
  ${props => props.$isAssociated && `
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
    
    &::after {
      content: '${props => props.$relationship ? `Associated (${props.$relationship})` : 'Associated'}';
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(0, 255, 0, 0.2);
      color: #00ff00;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
  `}
`;

const DealHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DealTitle = styled.div`
  font-weight: bold;
  color: #00ff00;
  font-size: 14px;
`;

const DealCategory = styled.div`
  font-size: 11px;
  color: #ccc;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
`;

const DealInfo = styled.div`
  font-size: 12px;
  color: #aaa;
  margin-bottom: 8px;
`;

const DealDate = styled.div`
  font-size: 11px;
  color: #888;
  text-align: right;
`;

const DealFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;

const AssociateButton = styled.button`
  background-color: ${props => props.$isAssociated ? 'rgba(0, 255, 0, 0.15)' : 'transparent'};
  color: ${props => props.$isAssociated ? '#00ff00' : '#ccc'};
  border: 1px solid ${props => props.$isAssociated ? '#00ff00' : '#444'};
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$isAssociated ? 'rgba(0, 255, 0, 0.15)' : 'rgba(0, 255, 0, 0.05)'};
    border-color: #00ff00;
    color: #00ff00;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoDealsMessage = styled.div`
  color: #666;
  text-align: center;
  padding: 40px 0;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  position: absolute;
  bottom: 25px;
  right: 25px;
  width: calc(100% - 50px);
  z-index: 10;
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: #cccccc;
  border: 1px solid #555;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #333;
  }
`;

const DealViewFindAddModal = ({ 
  isOpen, 
  onClose, 
  contactData 
}) => {
  const [activeTab, setActiveTab] = useState('addFromList');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [deals, setDeals] = useState([]);
  const [associatedDealIds, setAssociatedDealIds] = useState([]);
  const [relationshipMap, setRelationshipMap] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch real deal data and existing associations from the database
  useEffect(() => {
    const fetchData = async () => {
      if (!contactData?.contact_id) return;
      
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        
        // Fetch all deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select(`
            deal_id,
            opportunity,
            source_category,
            introducer,
            category,
            stage,
            description,
            total_investment,
            created_by,
            created_at,
            last_modified_by,
            last_modified_at
          `)
          .order('created_at', { ascending: false });
          
        if (dealsError) {
          console.error('Error fetching deals:', dealsError);
          return;
        }
        
        // Fetch existing deal-contact associations with relationship info
        const { data: associationsData, error: associationsError } = await supabase
          .from('deals_contacts')
          .select('deal_id, relationship')
          .eq('contact_id', contactData.contact_id);
          
        if (associationsError) {
          console.error('Error fetching deal associations:', associationsError);
          return;
        }
        
        // Extract deal IDs that are already associated with this contact
        const associatedIds = associationsData?.map(assoc => assoc.deal_id) || [];
        
        // Create a map of deal IDs to their relationship type
        const relationshipMap = {};
        associationsData?.forEach(assoc => {
          relationshipMap[assoc.deal_id] = assoc.relationship;
        });
        
        setDeals(dealsData || []);
        setAssociatedDealIds(associatedIds);
        setRelationshipMap(relationshipMap);
      } catch (err) {
        console.error('Error in data fetch operation:', err);
      }
    };
    
    fetchData();
  }, [contactData?.contact_id]);
  
  // Filter the deals based on search term and category filter
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = searchTerm === '' || 
      deal.opportunity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.description && deal.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeFilter === 'All' || deal.category === activeFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort deals by most recent date
  const sortedDeals = [...filteredDeals].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  // Get companies for suggested search
  const suggestedCompanies = contactData?.companies?.map(company => company.name) || [];
  
  // Handle search term change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter button click
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };
  
  // Handle suggested search click
  const handleSuggestedSearch = (company) => {
    setSearchTerm(company);
  };
  
  // Format currency for total investment
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Handle association/disassociation of deals with contact
  const handleAssociateToggle = async (dealId) => {
    if (!contactData?.contact_id || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const isCurrentlyAssociated = associatedDealIds.includes(dealId);
      
      if (isCurrentlyAssociated) {
        // Remove the association
        const { error } = await supabase
          .from('deals_contacts')
          .delete()
          .eq('contact_id', contactData.contact_id)
          .eq('deal_id', dealId);
          
        if (error) throw error;
        
        // Update state
        setAssociatedDealIds(prev => prev.filter(id => id !== dealId));
        setRelationshipMap(prev => {
          const updated = {...prev};
          delete updated[dealId];
          return updated;
        });
        
        // Show success notification
        toast.success('Deal disassociated from contact');
      } else {
        // Create a new association with relationship set to 'proposer'
        const { error } = await supabase
          .from('deals_contacts')
          .insert({
            contact_id: contactData.contact_id,
            deal_id: dealId,
            relationship: 'proposer', // Set relationship to proposer
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        // Update state
        setAssociatedDealIds(prev => [...prev, dealId]);
        setRelationshipMap(prev => ({
          ...prev,
          [dealId]: 'proposer'
        }));
        
        // Show success notification
        toast.success('Deal associated with contact as proposer');
      }
    } catch (err) {
      console.error('Error toggling deal association:', err);
      toast.error(`Failed to update association: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Define the tab content components
  const renderAddFromListTab = () => (
    <ModalContent style={{ alignItems: 'flex-start', padding: '0 10px' }}>
      <SearchContainer>
        <SearchBar>
          <FiSearch size={16} />
          <input 
            type="text"
            placeholder="Search deals by name or description..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchBar>
        
        {suggestedCompanies.length > 0 && (
          <SuggestedSearch>
            Search for company:
            {suggestedCompanies.map((company, index) => (
              <span 
                key={index} 
                onClick={() => handleSuggestedSearch(company)}
              >
                {company}
              </span>
            ))}
          </SuggestedSearch>
        )}
      </SearchContainer>
      
      <FilterContainer>
        <FilterButton 
          $active={activeFilter === 'All'} 
          onClick={() => handleFilterClick('All')}
        >
          All Deals
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Startup'} 
          onClick={() => handleFilterClick('Startup')}
        >
          Startup
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Fund'} 
          onClick={() => handleFilterClick('Fund')}
        >
          Fund
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Real Estate'} 
          onClick={() => handleFilterClick('Real Estate')}
        >
          Real Estate
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Private Debt'} 
          onClick={() => handleFilterClick('Private Debt')}
        >
          Private Debt
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Private Equity'} 
          onClick={() => handleFilterClick('Private Equity')}
        >
          Private Equity
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Others'} 
          onClick={() => handleFilterClick('Others')}
        >
          Others
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Inbox'} 
          onClick={() => handleFilterClick('Inbox')}
        >
          Inbox
        </FilterButton>
      </FilterContainer>
      
      <DealsList>
        {sortedDeals.length === 0 ? (
          <NoDealsMessage>No deals found matching your criteria</NoDealsMessage>
        ) : (
          sortedDeals.map(deal => {
            const isAssociated = associatedDealIds.includes(deal.deal_id);
            const relationship = relationshipMap[deal.deal_id];
            
            return (
              <DealItem 
                key={deal.deal_id} 
                $isAssociated={isAssociated}
                $relationship={relationship}>
                <DealHeader>
                  <DealTitle>{deal.opportunity}</DealTitle>
                  <DealCategory>{deal.category}</DealCategory>
                </DealHeader>
                <DealInfo>
                  <div>Stage: {deal.stage}</div>
                  <div>Investment: {formatCurrency(deal.total_investment)}</div>
                  {deal.description && <div>{deal.description}</div>}
                  {deal.source_category !== 'Not Set' && <div>Source: {deal.source_category}</div>}
                </DealInfo>
                <DealFooter>
                  <DealDate>Added: {formatDate(deal.created_at)}</DealDate>
                  <AssociateButton
                    $isAssociated={isAssociated}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssociateToggle(deal.deal_id);
                    }}
                    disabled={isProcessing}
                  >
                    {isAssociated ? (
                      <>
                        <FiCheck size={12} /> Associated
                      </>
                    ) : (
                      <>
                        <FiLink size={12} /> Associate
                      </>
                    )}
                  </AssociateButton>
                </DealFooter>
              </DealItem>
            );
          })
        )}
      </DealsList>
    </ModalContent>
  );

  const renderCreateNewDealTab = () => (
    <ModalContent>
      <ComingSoonMessage>
        <div className="emoji">🚧</div>
        <p>Create New Deal Feature</p>
        <p>Coming Soon</p>
      </ComingSoonMessage>
    </ModalContent>
  );

  const renderAssociatedDealsTab = () => (
    <ModalContent>
      <ComingSoonMessage>
        <div className="emoji">🚧</div>
        <p>Associated Deals Feature</p>
        <p>Coming Soon</p>
      </ComingSoonMessage>
    </ModalContent>
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '25px',
          width: '65%',
          height: '661px', /* 575px increased by another 15% */
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#121212',
          border: '1px solid #333',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          color: '#e0e0e0',
          zIndex: 1001,
          position: 'relative',
          paddingBottom: '80px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <ModalHeader>
        <h2>
          Deal - {contactData ? `${contactData.first_name} ${contactData.last_name}` : 'Contact'}
          {contactData && contactData.companies && contactData.companies.length > 0 && 
            ` (${contactData.companies.map(company => company.name).join(', ')})`
          }
          {associatedDealIds.length > 0 && 
            <span style={{ 
              fontSize: '0.7rem', 
              backgroundColor: 'rgba(0, 255, 0, 0.2)', 
              color: '#00ff00',
              marginLeft: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              verticalAlign: 'middle'
            }}>
              {associatedDealIds.length} {associatedDealIds.length === 1 ? 'deal' : 'deals'}
            </span>
          }
        </h2>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ContentContainer>
        <TabContainer>
          <Tab 
            $isActive={activeTab === 'addFromList'} 
            onClick={() => setActiveTab('addFromList')}
          >
            Add from List
          </Tab>
          <Tab 
            $isActive={activeTab === 'createNewDeal'} 
            onClick={() => setActiveTab('createNewDeal')}
          >
            Create New Deal
          </Tab>
          <Tab 
            $isActive={activeTab === 'associatedDeals'} 
            onClick={() => setActiveTab('associatedDeals')}
          >
            Associated Deals
            {associatedDealIds.length > 0 && (
              <span style={{
                marginLeft: '5px',
                backgroundColor: 'rgba(0, 255, 0, 0.2)',
                color: '#00ff00',
                fontSize: '0.7rem',
                padding: '1px 5px',
                borderRadius: '10px',
                fontWeight: 'normal'
              }}>
                {associatedDealIds.length}
              </span>
            )}
          </Tab>
        </TabContainer>
        
        <ContentArea>
          {activeTab === 'addFromList' && renderAddFromListTab()}
          {activeTab === 'createNewDeal' && renderCreateNewDealTab()}
          {activeTab === 'associatedDeals' && renderAssociatedDealsTab()}
        </ContentArea>
      </ContentContainer>
      
      <ButtonGroup>
        <CancelButton onClick={onClose}>
          <FiX /> Close
        </CancelButton>
      </ButtonGroup>
    </Modal>
  );
};

export default DealViewFindAddModal;