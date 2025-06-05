import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiGrid, FiCpu, FiDollarSign, FiHome, FiPackage, FiBriefcase } from 'react-icons/fi';

const PageContainer = styled.div`
  padding: 24px;
  height: calc(100vh - 120px);
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #00ff00;
    margin-bottom: 8px;
  }
  
  p {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const ErrorMessage = styled.div`
  color: #ff3333;
  background-color: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const LoadingContainer = styled.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
`;

// Category filter styles
const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  background-color: #121212;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #333;
`;

// Use "$" prefix to prevent props from being passed to the DOM
const FilterButton = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  background-color: ${props => props.$active ? '#00ff00' : 'transparent'};
  color: ${props => props.$active ? '#000' : '#e0e0e0'};
  border-radius: 4px;
  border: 1px solid ${props => props.$active ? '#00ff00' : '#333'};
  transition: all 0.2s;
  font-size: 14px;
  
  &:hover {
    background-color: ${props => props.$active ? '#00ff00' : '#333'};
    border-color: #00ff00;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const Deals = () => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Deal category options with icons
  const categoryFilters = [
    { id: 'All', label: 'Full List', icon: <FiGrid /> },
    { id: 'Startup', label: 'Startup', icon: <FiCpu /> },
    { id: 'Fund', label: 'Fund', icon: <FiDollarSign /> },
    { id: 'Real Estate', label: 'Real Estate', icon: <FiHome /> },
    { id: 'Other', label: 'Other', icon: <FiPackage /> },
    { id: 'Private Debt', label: 'Private Debt', icon: <FiBriefcase /> },
    { id: 'Private Equity', label: 'Private Equity', icon: <FiBriefcase /> }
  ];
  
  // Column definitions with editable cells
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Deal', 
      field: 'opportunity',
      minWidth: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
      editable: true, // Make this column editable
    },
    { 
      headerName: 'Description', 
      field: 'description',
      minWidth: 300,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      editable: true, // Make this column editable
    },
    { 
      headerName: 'Category', 
      field: 'category',
      valueFormatter: (params) => params.value || '-',
      minWidth: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Stage', 
      field: 'stage',
      valueFormatter: (params) => params.value || '-',
      minWidth: 130,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Source', 
      field: 'source_category',
      valueFormatter: (params) => params.value || '-',
      minWidth: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Investment Amount', 
      field: 'total_investment',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(params.value);
      },
      minWidth: 150,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Created', 
      field: 'created_at', 
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 120,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), []);

  // Grid ready event handler
  const onGridReady = useCallback((params) => {
    gridRef.current = params.api;
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Handle cell value change for editing
  const onCellValueChanged = useCallback(async (params) => {
    const { data, colDef, newValue } = params;
    
    if (!data.deal_id) {
      console.error('Cannot update: Missing deal_id');
      return;
    }
    
    try {
      // Create update object with only the changed field
      const updateData = { [colDef.field]: newValue };
      
      // Update the record in Supabase
      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('deal_id', data.deal_id);
      
      if (error) {
        console.error('Error updating deal:', error);
        // Optionally show an error message to the user
      } else {
        console.log(`Successfully updated ${colDef.field} for deal ${data.deal_id}`);
        // Optionally show a success message
      }
    } catch (err) {
      console.error('Error in update operation:', err);
    }
  }, []);

  // Fetch deals data
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from deals table
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setRowData(data);
        setFilteredData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching deals:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchDeals();
  }, []);

  // Filter data when category changes
  useEffect(() => {
    if (rowData.length === 0) return;
    
    if (selectedCategory === 'All') {
      setFilteredData(rowData);
    } else {
      const filtered = rowData.filter(deal => deal.category === selectedCategory);
      setFilteredData(filtered);
    }
    
    // Update grid if it's ready
    if (gridRef.current) {
      gridRef.current.api.setRowData(
        selectedCategory === 'All' 
          ? rowData 
          : rowData.filter(deal => deal.category === selectedCategory)
      );
    }
  }, [selectedCategory, rowData]);

  // Handle category button click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gridRef.current) {
        gridRef.current.api.sizeColumnsToFit();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <PageContainer>
      <PageHeader>
        <h1>Deals</h1>
        <p>Track active and potential business deals. Click on deal or description to edit.</p>
      </PageHeader>
      
      {/* Category Filter Buttons */}
      <FilterContainer>
        {categoryFilters.map(category => (
          <FilterButton
            key={category.id}
            $active={selectedCategory === category.id}
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.icon}
            {category.label}
          </FilterButton>
        ))}
      </FilterContainer>
      
      {error && <ErrorMessage>Error: {error}</ErrorMessage>}
      
      {loading ? (
        <LoadingContainer>Loading deals data...</LoadingContainer>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 120px)', // Adjusted for filter buttons
            width: '100%'
          }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            rowSelection="single"
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            suppressCellFocus={false}
            enableCellTextSelection={true}
            onCellValueChanged={onCellValueChanged}
            stopEditingWhenCellsLoseFocus={true}
            editType="fullRow"
          />
        </div>
      )}
    </PageContainer>
  );
};

export default Deals;