// AG Grid setup
import 'ag-grid-community/styles/ag-grid.min.css';
import 'ag-grid-community/styles/ag-theme-alpine.min.css';

// Core modules
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';

// Register required modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule
]);

// Export components for convenience
export { AgGridReact } from 'ag-grid-react';