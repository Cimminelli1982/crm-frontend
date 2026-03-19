# Backend Patterns

Railway backend (`backend/src/index.js`). Real snippets.

---

## New Endpoint

```javascript
app.post('/my-endpoint', async (req, res) => {
  try {
    const { param1, param2 } = req.body;

    if (!param1) {
      return res.status(400).json({ success: false, error: 'Missing param1' });
    }

    // ... business logic

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[MyEndpoint] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Response convention: always `{ success: true/false, data?, error? }`.

---

## Claude SDK — Agentic Loop

From the `/chat` endpoint (line 2388):

```javascript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Build request
const requestParams = {
  model: 'claude-sonnet-4-20250514',  // Sonnet for chat, Haiku for classification
  max_tokens: 2048,
  system: 'System prompt here',
  messages: [...messages],
  tools: mcpReady ? mcpManager.getAnthropicTools() : [],
};

// Agentic loop — keep going while Claude wants to use tools
let response = await anthropic.messages.create(requestParams);
let loopCount = 0;
const maxLoops = 10;

while (response.stop_reason === 'tool_use' && loopCount < maxLoops) {
  loopCount++;
  const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

  const toolResults = [];
  for (const toolUse of toolUseBlocks) {
    try {
      const result = await mcpManager.executeTool(toolUse.name, toolUse.input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result.content || result),
      });
    } catch (toolError) {
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: `Error: ${toolError.message}`,
        is_error: true,
      });
    }
  }

  requestParams.messages.push({ role: 'assistant', content: response.content });
  requestParams.messages.push({ role: 'user', content: toolResults });
  response = await anthropic.messages.create(requestParams);
}

// Extract final text
const text = response.content
  .filter(b => b.type === 'text')
  .map(b => b.text)
  .join('\n');
```

---

## MCP Tools (for Claude agent)

From `mcp-client.js` — adding a custom tool:

```javascript
// In MCPClientManager.addCRMTools():
{
  name: 'crm_my_tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Description' },
    },
    required: ['param']
  },
  _server: 'crm',
  _handler: async (input) => {
    const sb = getSupabaseCRM();
    const { data, error } = await sb.from('table').select('*').eq('id', input.param);
    if (error) throw error;
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
}
```

---

## Supabase Server-side

```javascript
import { supabase } from './supabase.js';

// Query
const { data, error } = await supabase
  .from('contacts')
  .select('*, contact_emails(*), contact_companies(*, companies(*))')
  .eq('contact_id', id)
  .single();

// Insert
const { data, error } = await supabase
  .from('contacts')
  .insert({ first_name: 'John', last_name: 'Doe' })
  .select()
  .single();
```

---

## Apollo Enrichment

External service for contact enrichment:

```javascript
const response = await fetch(
  'https://crm-agent-api-production.up.railway.app/suggest-contact-profile',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, first_name, last_name }),
  }
);
const suggestions = await response.json();
```

---

## Deploy

```bash
cd backend && railway up --detach
```

Health check on `/health` (30s timeout, restart on failure — configured in `railway.toml`).
