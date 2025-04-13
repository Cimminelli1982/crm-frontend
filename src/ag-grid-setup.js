// AG Grid setup
import 'ag-grid-community/styles/ag-grid.min.css';
import 'ag-grid-community/styles/ag-theme-alpine.min.css';

// Import AgGrid React component
import { AgGridReact } from 'ag-grid-react';

// Export components for convenience
export { AgGridReact };

// Helper functions to handle grid formatting safely
export const safeValueFormatter = (formatter) => {
  return (params) => {
    try {
      if (formatter && typeof formatter === 'function') {
        return formatter(params);
      }
      return params.value ? params.value.toString() : '';
    } catch (e) {
      console.warn('Value formatter error:', e);
      return params.value ? params.value.toString() : '';
    }
  };
};