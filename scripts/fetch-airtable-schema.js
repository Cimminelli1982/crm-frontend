// Script to fetch Airtable schema and save it to a JSON file
const fs = require('fs');
const path = require('path');
const Airtable = require('airtable');

// Airtable API Configuration
const AIRTABLE_API_KEY = 'pat31Rx6dxZsbexBc.3227ebbc64cdb5888b6e3a628edebba82c42e8534bee68921887fbfd27434728';
const AIRTABLE_BASE_ID = 'appTMYAU4N43eJdxG';

// Initialize Airtable client
Airtable.configure({
  apiKey: AIRTABLE_API_KEY
});

const base = Airtable.base(AIRTABLE_BASE_ID);

// Function to fetch schema metadata for a table
async function fetchTableSchema(tableName) {
  console.log(`Fetching schema for table: ${tableName}`);
  
  try {
    // Get one record to determine field names and types
    const records = await base(tableName).select({
      maxRecords: 1
    }).firstPage();
    
    // If no records, return empty schema
    if (records.length === 0) {
      console.log(`No records found in table: ${tableName}`);
      return { fields: [] };
    }
    
    // Get field information from the first record
    const record = records[0];
    const fields = Object.keys(record.fields).map(fieldName => {
      const value = record.fields[fieldName];
      let fieldType = typeof value;
      
      // Determine more specific types
      if (Array.isArray(value)) {
        fieldType = 'array';
      } else if (value instanceof Date) {
        fieldType = 'date';
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        // This is a simple heuristic for date strings, might need adjustment
        fieldType = 'date-string';
      }
      
      return {
        name: fieldName,
        type: fieldType,
        example: Array.isArray(value) ? 
          (value.length > 0 ? `Array with ${value.length} items` : 'Empty array') : 
          String(value).substring(0, 100) // Truncate long values
      };
    });
    
    return { fields };
    
  } catch (error) {
    console.error(`Error fetching schema for table ${tableName}:`, error);
    return { error: error.message };
  }
}

// Function to get all tables in the base
async function listTables() {
  console.log(`Listing all tables in base: ${AIRTABLE_BASE_ID}`);
  
  // Airtable doesn't provide direct API for listing tables
  // We need to check which tables are accessible
  
  // This is a workaround by trying to access common table names
  // You'll need to adjust this list based on your expected tables
  const commonTableNames = [
    'Companies', 'Contacts', 'Leads', 'Opportunities', 'Projects',
    'Tasks', 'Notes', 'Meetings', 'Calls', 'Events',
    'Products', 'Orders', 'Invoices', 'Payments', 'Customers',
    'Users', 'Teams', 'Departments', 'Roles', 'Permissions'
  ];
  
  const validTables = [];
  
  for (const tableName of commonTableNames) {
    try {
      // Try to select a record from the table
      await base(tableName).select({ maxRecords: 1 }).firstPage();
      validTables.push(tableName);
      console.log(`Found table: ${tableName}`);
    } catch (error) {
      // If error contains "could not find table", then table doesn't exist
      if (error.message.includes('could not find table')) {
        console.log(`Table doesn't exist: ${tableName}`);
      } else {
        console.error(`Error checking table ${tableName}:`, error);
      }
    }
  }
  
  return validTables;
}

// Main function to fetch schema for all tables
async function fetchSchema() {
  try {
    const tables = await listTables();
    
    if (tables.length === 0) {
      console.log('No tables found in the base.');
      return;
    }
    
    console.log(`Found ${tables.length} tables.`);
    
    // Fetch schema for each table
    const schema = {};
    for (const tableName of tables) {
      schema[tableName] = await fetchTableSchema(tableName);
    }
    
    // Save schema to file
    const outputPath = path.join(__dirname, '..', 'docs', 'airtable-schema.json');
    
    // Ensure docs directory exists
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    console.log(`Schema saved to: ${outputPath}`);
    
    // Also create a human-readable markdown version
    const mdPath = path.join(__dirname, '..', 'docs', 'airtable-schema.md');
    let markdown = '# Airtable Schema\n\n';
    
    for (const tableName in schema) {
      markdown += `## Table: ${tableName}\n\n`;
      markdown += '| Field Name | Type | Example |\n';
      markdown += '|------------|------|--------|\n';
      
      const fields = schema[tableName].fields;
      fields.forEach(field => {
        markdown += `| ${field.name} | ${field.type} | ${field.example} |\n`;
      });
      
      markdown += '\n';
    }
    
    fs.writeFileSync(mdPath, markdown);
    console.log(`Markdown schema saved to: ${mdPath}`);
    
  } catch (error) {
    console.error('Error fetching schema:', error);
  }
}

// Run the script
fetchSchema().then(() => {
  console.log('Schema fetching complete.');
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});