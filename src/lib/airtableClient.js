import Airtable from 'airtable';

// Airtable API Configuration
const AIRTABLE_API_KEY = 'pat31Rx6dxZsbexBc.3227ebbc64cdb5888b6e3a628edebba82c42e8534bee68921887fbfd27434728';
const AIRTABLE_BASE_ID = 'appTMYAU4N43eJdxG';

// Initialize Airtable client
Airtable.configure({
  apiKey: AIRTABLE_API_KEY
});

export const airtableBase = Airtable.base(AIRTABLE_BASE_ID);

// Helper function to get all records from a table
export const getAllRecords = async (tableName) => {
  try {
    const records = await airtableBase(tableName).select().all();
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    throw error;
  }
};

// Helper function to get a single record by ID
export const getRecordById = async (tableName, recordId) => {
  try {
    const record = await airtableBase(tableName).find(recordId);
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error fetching record from ${tableName}:`, error);
    throw error;
  }
};

// Helper function to create a new record
export const createRecord = async (tableName, fields) => {
  try {
    const record = await airtableBase(tableName).create(fields);
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw error;
  }
};

// Helper function to update a record
export const updateRecord = async (tableName, recordId, fields) => {
  try {
    const record = await airtableBase(tableName).update(recordId, fields);
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    throw error;
  }
};

// Helper function to delete a record
export const deleteRecord = async (tableName, recordId) => {
  try {
    const record = await airtableBase(tableName).destroy(recordId);
    return {
      id: record.id,
      deleted: true
    };
  } catch (error) {
    console.error(`Error deleting record from ${tableName}:`, error);
    throw error;
  }
};

// Helper function to query records
export const queryRecords = async (tableName, filterFormula) => {
  try {
    const records = await airtableBase(tableName).select({
      filterByFormula: filterFormula
    }).all();
    
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error(`Error querying records in ${tableName}:`, error);
    throw error;
  }
};

// Company-specific functions based on actual Airtable schema
export const getCompanyByWebsite = async (website) => {
  if (!website) return null;
  
  // Format website for search (remove protocol and www)
  const formattedWebsite = website.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  
  try {
    // Search using the "Website" field from the Airtable schema
    const filterFormula = `FIND("${formattedWebsite}", {Website}) > 0`;
    const companies = await queryRecords('Companies', filterFormula);
    
    console.log(`Found ${companies.length} companies in Airtable matching website: ${formattedWebsite}`);
    
    if (companies.length > 0) {
      // Map Airtable fields to your app's expected format
      const company = companies[0];
      
      return {
        id: company.id, // Airtable record ID
        airtable_id: company['Company Airtable ID'] || company.id,
        name: company['Company Name'] || '',
        website: company['Website'] || '',
        description: company['Description'] || '',
        linkedin: company['Linkedin'] || '',
        source: 'airtable'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding company by website:', error);
    return null;
  }
};