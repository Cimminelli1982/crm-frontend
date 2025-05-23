// This file contains AG Grid styles embedded directly as a JavaScript object
// to avoid CSS import resolution issues

export const embedAgGridStyles = () => {
  // Create a style element
  const styleEl = document.createElement('style');
  
  // Set the content - these are simplified versions of the main AG Grid styles
  styleEl.innerHTML = `
    /* AG Grid Base Styles */
    .ag-root-wrapper {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      box-sizing: border-box;
    }
    
    .ag-root-wrapper *, .ag-root-wrapper *::before, .ag-root-wrapper *::after {
      box-sizing: border-box;
    }
    
    .ag-root {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      overflow: hidden;
      position: relative;
    }
    
    .ag-header {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }
    
    .ag-header-viewport {
      overflow: hidden;
      flex: 1 1 auto;
    }
    
    .ag-header-container {
      display: flex;
      position: relative;
    }
    
    .ag-header-row {
      display: flex;
      position: absolute;
    }
    
    .ag-header-cell {
      display: flex;
      align-items: center;
      position: absolute;
      overflow: hidden;
      height: 100%;
      padding: 0 8px;
    }
    
    .ag-header-cell-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .ag-body {
      display: flex;
      flex-direction: row;
      overflow: hidden;
      position: relative;
      flex: 1 1 auto;
    }
    
    .ag-body-viewport {
      display: flex;
      overflow: auto;
      position: relative;
      flex: 1 1 auto;
    }
    
    .ag-center-cols-viewport {
      overflow-x: auto;
      flex: 1 1 auto;
      position: relative;
    }
    
    .ag-center-cols-container {
      display: block;
      position: relative;
    }
    
    .ag-row {
      display: flex;
      position: absolute;
      width: 100%;
    }
    
    .ag-cell {
      display: flex;
      align-items: center;
      position: absolute;
      overflow: hidden;
      height: 100%;
      padding: 0 8px;
    }
    
    .ag-cell-value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* AG Grid Alpine Theme */
    .ag-theme-alpine {
      --ag-background-color: #121212;
      --ag-odd-row-background-color: #1a1a1a;
      --ag-header-background-color: #222222;
      --ag-header-foreground-color: #00ff00;
      --ag-foreground-color: #e0e0e0;
      --ag-row-hover-color: #2a2a2a;
      --ag-border-color: #333333;
      
      background-color: var(--ag-background-color);
      color: var(--ag-foreground-color);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    
    .ag-theme-alpine .ag-header {
      background-color: var(--ag-header-background-color);
      color: var(--ag-header-foreground-color);
      font-weight: 600;
      border-bottom: 1px solid var(--ag-border-color);
    }
    
    .ag-theme-alpine .ag-header-cell {
      border-right: 1px solid var(--ag-border-color);
    }
    
    .ag-theme-alpine .ag-row {
      border-bottom: 1px solid var(--ag-border-color);
    }
    
    .ag-theme-alpine .ag-row-odd {
      background-color: var(--ag-odd-row-background-color);
    }
    
    .ag-theme-alpine .ag-row:hover {
      background-color: var(--ag-row-hover-color);
    }
    
    .ag-theme-alpine .ag-cell {
      border-right: 1px solid var(--ag-border-color);
    }
    
    .ag-theme-alpine .ag-ltr .ag-cell {
      border-right: 1px solid var(--ag-border-color);
    }
    
    /* Pagination Styles */
    .ag-theme-alpine .ag-paging-panel {
      color: var(--ag-foreground-color);
      background-color: var(--ag-background-color);
      padding: 8px;
      border-top: 1px solid var(--ag-border-color);
    }
    
    .ag-theme-alpine .ag-paging-button {
      cursor: pointer;
      padding: 0 6px;
      margin: 0 3px;
      color: var(--ag-foreground-color);
    }
    
    /* Floating Filter Styles */
    .ag-theme-alpine .ag-floating-filter-body {
      margin-right: 10px;
    }
    
    .ag-theme-alpine .ag-floating-filter-input {
      background-color: #333;
      color: var(--ag-foreground-color);
      border: 1px solid var(--ag-border-color);
      padding: 3px 6px;
    }
    
    /* Aggressively hide all floating filter elements */
    .ag-floating-filter,
    .ag-header-cell.ag-floating-filter,
    .ag-floating-filter-body,
    .ag-floating-filter-button,
    .ag-floating-filter-button-button,
    .ag-header-row.ag-header-row-floating-filter,
    div[class*="ag-floating-filter"],
    div[role="gridcell"][class*="ag-floating-filter"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      max-height: 0 !important;
      opacity: 0 !important;
    }
    
    /* Target the specific cell you mentioned */
    .ag-header-cell.ag-floating-filter.ag-focus-managed[role="gridcell"][aria-colindex="5"] {
      display: none !important;
      visibility: hidden !important;
    }
  `;
  
  // Add the style to the document head
  document.head.appendChild(styleEl);
  
  return styleEl;
};