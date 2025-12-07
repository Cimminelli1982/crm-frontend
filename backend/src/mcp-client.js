import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client for CRM tools
const supabaseUrl = process.env.SUPABASE_URL || 'https://efazuvegwxouysfcgwja.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseCRM = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// MCP Client Manager - connects to MCP servers and provides tools to Claude
class MCPClientManager {
  constructor() {
    this.clients = new Map();
    this.tools = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    console.log('[MCP] Initializing MCP clients...');

    // Connect to Supabase MCP server
    try {
      await this.connectSupabase();
    } catch (error) {
      console.error('[MCP] Failed to connect Supabase:', error.message);
    }

    // Connect to Memory MCP server
    try {
      await this.connectMemory();
    } catch (error) {
      console.error('[MCP] Failed to connect Memory:', error.message);
    }

    // Add CRM tools (direct Supabase access)
    this.addCRMTools();

    this.initialized = true;
    console.log(`[MCP] Ready with ${this.tools.length} tools`);
  }

  // Add CRM duplicate management tools
  addCRMTools() {
    console.log('[MCP] Adding CRM tools...');

    const crmTools = [
      {
        name: 'crm_find_duplicate_contacts',
        description: 'Find potential duplicate contacts. Methods: pending_queue (from duplicates table), name_search (fuzzy name match), email_domain (same domain)',
        inputSchema: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['pending_queue', 'name_search', 'email_domain'] },
            search_term: { type: 'string', description: 'Search term for name_search or email_domain' },
            limit: { type: 'number', description: 'Max results (default 20)' }
          },
          required: ['method']
        },
        _server: 'crm',
        _handler: this.handleFindDuplicates.bind(this)
      },
      {
        name: 'crm_get_contact_details',
        description: 'Get full contact details including emails, companies, tags, deals for comparison',
        inputSchema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string', description: 'UUID of contact' }
          },
          required: ['contact_id']
        },
        _server: 'crm',
        _handler: this.handleGetContactDetails.bind(this)
      },
      {
        name: 'crm_compare_contacts',
        description: 'Compare two contacts side-by-side with merge recommendation',
        inputSchema: {
          type: 'object',
          properties: {
            contact_id_1: { type: 'string' },
            contact_id_2: { type: 'string' }
          },
          required: ['contact_id_1', 'contact_id_2']
        },
        _server: 'crm',
        _handler: this.handleCompareContacts.bind(this)
      },
      {
        name: 'crm_merge_contacts',
        description: 'Merge two contacts. Primary is kept, duplicate is absorbed and deleted. Use dry_run=true first!',
        inputSchema: {
          type: 'object',
          properties: {
            primary_contact_id: { type: 'string', description: 'Contact to keep' },
            duplicate_contact_id: { type: 'string', description: 'Contact to merge and delete' },
            dry_run: { type: 'boolean', description: 'Preview changes without executing (default true)' }
          },
          required: ['primary_contact_id', 'duplicate_contact_id']
        },
        _server: 'crm',
        _handler: this.handleMergeContacts.bind(this)
      },
      {
        name: 'crm_mark_not_duplicate',
        description: 'Mark two contacts as NOT duplicates (removes from queue)',
        inputSchema: {
          type: 'object',
          properties: {
            contact_id_1: { type: 'string' },
            contact_id_2: { type: 'string' }
          },
          required: ['contact_id_1', 'contact_id_2']
        },
        _server: 'crm',
        _handler: this.handleMarkNotDuplicate.bind(this)
      }
    ];

    this.tools.push(...crmTools);
    console.log(`[MCP] Added ${crmTools.length} CRM tools`);
  }

  // CRM Tool Handlers
  async handleFindDuplicates({ method, search_term, limit = 20 }) {
    if (!supabaseCRM) throw new Error('Supabase not configured');

    let results = [];

    if (method === 'pending_queue') {
      const { data, error } = await supabaseCRM
        .from('contact_duplicates')
        .select(`
          *,
          contact1:contacts!contact_duplicates_contact_id_1_fkey(contact_id, first_name, last_name, created_at),
          contact2:contacts!contact_duplicates_contact_id_2_fkey(contact_id, first_name, last_name, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      results = data || [];
    } else if (method === 'name_search' && search_term) {
      const { data, error } = await supabaseCRM
        .from('contacts')
        .select('contact_id, first_name, last_name, created_at')
        .or(`first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%`)
        .order('last_name')
        .limit(limit);
      if (error) throw error;
      results = data || [];
    } else if (method === 'email_domain' && search_term) {
      const { data, error } = await supabaseCRM
        .from('contact_emails')
        .select(`email, contacts(contact_id, first_name, last_name, created_at)`)
        .ilike('email', `%@${search_term}%`)
        .limit(limit);
      if (error) throw error;
      results = data || [];
    }

    return { method, search_term, count: results.length, results };
  }

  async handleGetContactDetails({ contact_id }) {
    if (!supabaseCRM) throw new Error('Supabase not configured');

    const { data: contact, error } = await supabaseCRM
      .from('contacts')
      .select('*')
      .eq('contact_id', contact_id)
      .single();
    if (error) throw error;

    const [emails, mobiles, companies, tags, deals] = await Promise.all([
      supabaseCRM.from('contact_emails').select('*').eq('contact_id', contact_id),
      supabaseCRM.from('contact_mobiles').select('*').eq('contact_id', contact_id),
      supabaseCRM.from('contact_companies').select('*, companies(company_id, name)').eq('contact_id', contact_id),
      supabaseCRM.from('contact_tags').select('*, tags(tag_id, name)').eq('contact_id', contact_id),
      supabaseCRM.from('deals_contacts').select('*, deals(deal_id, name)').eq('contact_id', contact_id),
    ]);

    return {
      ...contact,
      emails: emails.data || [],
      mobiles: mobiles.data || [],
      companies: companies.data || [],
      tags: tags.data || [],
      deals: deals.data || [],
    };
  }

  async handleCompareContacts({ contact_id_1, contact_id_2 }) {
    const [c1, c2] = await Promise.all([
      this.handleGetContactDetails({ contact_id: contact_id_1 }),
      this.handleGetContactDetails({ contact_id: contact_id_2 }),
    ]);

    // Generate recommendation
    let score1 = 0, score2 = 0;
    if (c1.created_at < c2.created_at) score1 += 2;
    else if (c2.created_at < c1.created_at) score2 += 2;

    ['first_name', 'last_name', 'description', 'linkedin_url'].forEach(f => {
      if (c1[f] && !c2[f]) score1++;
      if (c2[f] && !c1[f]) score2++;
    });

    ['emails', 'companies', 'deals'].forEach(r => {
      if ((c1[r]?.length || 0) > (c2[r]?.length || 0)) score1++;
      if ((c2[r]?.length || 0) > (c1[r]?.length || 0)) score2++;
    });

    return {
      contact_1: { id: contact_id_1, name: `${c1.first_name} ${c1.last_name}`, data: c1 },
      contact_2: { id: contact_id_2, name: `${c2.first_name} ${c2.last_name}`, data: c2 },
      recommendation: {
        keep: score1 >= score2 ? contact_id_1 : contact_id_2,
        merge: score1 >= score2 ? contact_id_2 : contact_id_1,
        confidence: Math.abs(score1 - score2) > 3 ? 'high' : Math.abs(score1 - score2) > 1 ? 'medium' : 'low'
      }
    };
  }

  async handleMergeContacts({ primary_contact_id, duplicate_contact_id, dry_run = true }) {
    if (!supabaseCRM) throw new Error('Supabase not configured');

    const junctionTables = [
      { table: 'contact_emails', fk: 'contact_id' },
      { table: 'contact_mobiles', fk: 'contact_id' },
      { table: 'contact_companies', fk: 'contact_id', unique: ['company_id'] },
      { table: 'contact_tags', fk: 'contact_id', unique: ['tag_id'] },
      { table: 'deals_contacts', fk: 'contact_id', unique: ['deal_id'] },
      { table: 'meeting_contacts', fk: 'contact_id', unique: ['meeting_id'] },
      { table: 'notes_contacts', fk: 'contact_id', unique: ['note_id'] },
      { table: 'interactions', fk: 'contact_id' },
    ];

    const operations = [];

    // Check both contacts exist
    const [p, d] = await Promise.all([
      supabaseCRM.from('contacts').select('*').eq('contact_id', primary_contact_id).single(),
      supabaseCRM.from('contacts').select('*').eq('contact_id', duplicate_contact_id).single(),
    ]);
    if (p.error) throw new Error(`Primary contact not found`);
    if (d.error) throw new Error(`Duplicate contact not found`);

    operations.push({ action: 'verified', primary: `${p.data.first_name} ${p.data.last_name}`, duplicate: `${d.data.first_name} ${d.data.last_name}` });

    // Check each junction table
    for (const t of junctionTables) {
      const { data } = await supabaseCRM.from(t.table).select('*').eq(t.fk, duplicate_contact_id);
      if (data?.length > 0) {
        operations.push({ table: t.table, records: data.length, action: 'move to primary' });
      }
    }

    if (dry_run) {
      return { dry_run: true, message: 'Preview - no changes made. Run with dry_run=false to execute.', operations };
    }

    // Execute merge
    for (const t of junctionTables) {
      if (t.unique) {
        // Delete duplicates first
        const { data: primaryRecs } = await supabaseCRM.from(t.table).select('*').eq(t.fk, primary_contact_id);
        const primaryKeys = new Set(primaryRecs?.map(r => r[t.unique[0]]) || []);

        const { data: dupRecs } = await supabaseCRM.from(t.table).select('*').eq(t.fk, duplicate_contact_id);
        for (const rec of dupRecs || []) {
          if (primaryKeys.has(rec[t.unique[0]])) {
            await supabaseCRM.from(t.table).delete().eq(t.fk, duplicate_contact_id).eq(t.unique[0], rec[t.unique[0]]);
          }
        }
      }
      await supabaseCRM.from(t.table).update({ [t.fk]: primary_contact_id }).eq(t.fk, duplicate_contact_id);
    }

    // Update emails table sender
    await supabaseCRM.from('emails').update({ sender_contact_id: primary_contact_id }).eq('sender_contact_id', duplicate_contact_id);

    // Merge fields
    const updates = {};
    ['description', 'linkedin_url', 'twitter_url', 'avatar_url'].forEach(f => {
      if (!p.data[f] && d.data[f]) updates[f] = d.data[f];
    });
    if (Object.keys(updates).length > 0) {
      await supabaseCRM.from('contacts').update(updates).eq('contact_id', primary_contact_id);
    }

    // Save audit log
    await supabaseCRM.from('contact_duplicates_completed').insert({
      primary_contact_id,
      duplicate_contact_id,
      merged_data: { primary: p.data, duplicate: d.data },
      merged_at: new Date().toISOString()
    });

    // Remove from queue
    await supabaseCRM.from('contact_duplicates').delete()
      .or(`contact_id_1.eq.${duplicate_contact_id},contact_id_2.eq.${duplicate_contact_id}`);

    // Delete duplicate
    await supabaseCRM.from('contacts').delete().eq('contact_id', duplicate_contact_id);

    return { success: true, message: `Merged ${d.data.first_name} ${d.data.last_name} into ${p.data.first_name} ${p.data.last_name}`, operations };
  }

  async handleMarkNotDuplicate({ contact_id_1, contact_id_2 }) {
    if (!supabaseCRM) throw new Error('Supabase not configured');

    await supabaseCRM.from('contact_duplicates').delete()
      .or(`and(contact_id_1.eq.${contact_id_1},contact_id_2.eq.${contact_id_2}),and(contact_id_1.eq.${contact_id_2},contact_id_2.eq.${contact_id_1})`);

    return { success: true, message: 'Marked as not duplicates' };
  }

  async connectSupabase() {
    console.log('[MCP] Connecting to Supabase MCP server...');

    const client = new Client({
      name: 'crm-backend',
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    // Use npx to run the Supabase MCP server
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@supabase/mcp-server-supabase@latest', '--access-token', process.env.SUPABASE_ACCESS_TOKEN],
      env: {
        ...process.env,
      },
    });

    await client.connect(transport);

    // Get available tools
    const toolsResponse = await client.listTools();
    const supabaseTools = toolsResponse.tools || [];

    console.log(`[MCP] Supabase connected with ${supabaseTools.length} tools`);

    this.clients.set('supabase', client);

    // Add tools with server prefix
    for (const tool of supabaseTools) {
      this.tools.push({
        ...tool,
        _server: 'supabase',
        name: `supabase_${tool.name}`,
      });
    }
  }

  async connectMemory() {
    console.log('[MCP] Connecting to Memory MCP server...');

    const client = new Client({
      name: 'crm-backend-memory',
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    // Memory file path - persistent storage for Claude's memory
    const memoryPath = path.join(__dirname, '..', 'data', 'claude-memory.json');

    // Use npx to run the Memory MCP server
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory', memoryPath],
      env: {
        ...process.env,
      },
    });

    await client.connect(transport);

    // Get available tools
    const toolsResponse = await client.listTools();
    const memoryTools = toolsResponse.tools || [];

    console.log(`[MCP] Memory connected with ${memoryTools.length} tools`);

    this.clients.set('memory', client);

    // Add tools with server prefix
    for (const tool of memoryTools) {
      this.tools.push({
        ...tool,
        _server: 'memory',
        name: `memory_${tool.name}`,
      });
    }
  }

  // Convert MCP tools to Anthropic tool format
  getAnthropicTools() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: tool.inputSchema || { type: 'object', properties: {} },
    }));
  }

  // Execute a tool call
  async executeTool(toolName, toolInput) {
    // Find which server owns this tool
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const serverName = tool._server;
    console.log(`[MCP] Executing ${toolName} with:`, JSON.stringify(toolInput).substring(0, 200));

    // CRM tools have direct handlers
    if (serverName === 'crm' && tool._handler) {
      const result = await tool._handler(toolInput);
      console.log(`[MCP] CRM Result:`, JSON.stringify(result).substring(0, 200));
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    // MCP server tools
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server not connected: ${serverName}`);
    }

    // Remove server prefix from tool name for the actual call
    const originalToolName = toolName.replace(`${serverName}_`, '');

    const result = await client.callTool({
      name: originalToolName,
      arguments: toolInput,
    });

    console.log(`[MCP] Result:`, JSON.stringify(result).substring(0, 200));

    return result;
  }

  async close() {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
        console.log(`[MCP] Closed ${name}`);
      } catch (e) {
        console.error(`[MCP] Error closing ${name}:`, e.message);
      }
    }
    this.clients.clear();
    this.tools = [];
    this.initialized = false;
  }
}

// Singleton instance
export const mcpManager = new MCPClientManager();
