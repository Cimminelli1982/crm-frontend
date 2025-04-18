// This file sets up AG Grid modules

import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// Register required modules
export function registerAgGridModules() {
  // Simply register the modules - AG Grid handles duplicates internally
  ModuleRegistry.registerModules([
    ClientSideRowModelModule
  ]);
}

// Export individually for direct imports if needed
export { ClientSideRowModelModule };