/**
 * This script fixes the database field name mismatch in the application
 * The database schema shows the column is named 'category' but the code uses 'contact_category'
 * 
 * Instructions:
 * 1. Add this script to your project
 * 2. Run with: node field-fix-helper.js
 * 
 * This will output instructions to replace all occurrences
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files known to have contact_category references
const files = [
  'src/components/contacts/RecentContactsList.js',
  'src/components/modals/CategoryModal.js',
  'src/components/modals/AttendeesModal.js',
  'src/components/modals/ContactsModal.js',
  'src/components/modals/LastInteractionModal.js',
  'src/components/contacts/KeepInTouchTable.js',
  'src/pages/Dashboard.js',
  'src/pages/ContactEdit.js',
  'src/pages/contacts/KeepInTouch.js',
  'src/pages/contacts/SimpleContacts.js',
  'src/pages/contacts/KeepInTouchInbox.js',
];

// Check if files exist and how many references they contain
files.forEach(filePath => {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const occurrences = (fileContent.match(/contact_category/g) || []).length;
    
    if (occurrences > 0) {
      console.log(`Found ${occurrences} occurrences in ${filePath}`);
      
      // Direct sed command for manual execution
      console.log(`sed -i '' 's/contact_category/category/g' ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
});

console.log('\nTo fix all files at once, you can run:');
console.log('grep -l "contact_category" src/ | xargs sed -i \'\' \'s/contact_category/category/g\'');

// Optional: Automatically fix files by uncommenting the following:
/*
try {
  const output = execSync('grep -l "contact_category" src/ | xargs sed -i \'\' \'s/contact_category/category/g\'');
  console.log('All files fixed successfully!');
} catch (error) {
  console.error('Error fixing files:', error.message);
}
*/