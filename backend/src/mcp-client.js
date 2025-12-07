import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    this.initialized = true;
    console.log(`[MCP] Ready with ${this.tools.length} tools`);
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
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server not connected: ${serverName}`);
    }

    // Remove server prefix from tool name for the actual call
    const originalToolName = toolName.replace(`${serverName}_`, '');

    console.log(`[MCP] Executing ${toolName} with:`, JSON.stringify(toolInput).substring(0, 200));

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
