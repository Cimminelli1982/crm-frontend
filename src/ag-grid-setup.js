// AG Grid setup
import 'ag-grid-community/styles/ag-grid.min.css';
import 'ag-grid-community/styles/ag-theme-alpine.min.css';

// Import all core modules
import { 
  ModuleRegistry, 
  ClientSideRowModelModule,
  ColumnApi,
  GridApi,
  Grid,
  CsvExportModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  MenuModule, 
  RowGroupingModule,
  SideBarModule,
  ColumnAutoSizeModule,
  ValidationModule,
  ResizeObserverService,
  ExcelExportModule
} from 'ag-grid-community';

// Register required modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CsvExportModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  MenuModule,
  RowGroupingModule,
  SideBarModule,
  ColumnAutoSizeModule,
  ValidationModule,
  ExcelExportModule
]);

// Make sure Grid is initialized - needed for v33+
try {
  new Grid(document.createElement('div'), { modules: [] });
} catch (e) {
  console.warn('AG Grid initialization warning:', e);
}

// Export components for convenience
export { AgGridReact } from 'ag-grid-react';

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