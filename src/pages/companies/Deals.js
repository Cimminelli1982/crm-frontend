import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';

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

const Deals = () => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        setLoading(false);
      } catch (err) {
        console.error('Error fetching deals:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchDeals();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gridRef.current) {
        gridRef.current.sizeColumnsToFit();
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
      
      {error && <ErrorMessage>Error: {error}</ErrorMessage>}
      
      {loading ? (
        <LoadingContainer>Loading deals data...</LoadingContainer>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 60px)', 
            width: '100%',
            '--ag-background-color': '#121212',
            '--ag-odd-row-background-color': '#1a1a1a',
            '--ag-header-background-color': '#222222',
            '--ag-header-foreground-color': '#00ff00',
            '--ag-foreground-color': '#e0e0e0', 
            '--ag-row-hover-color': '#2a2a2a',
            '--ag-border-color': '#333333'
          }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
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