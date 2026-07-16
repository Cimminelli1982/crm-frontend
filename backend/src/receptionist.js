// Receptionist agent — SSE streaming endpoint that replaces the old OpenClaw
// WebSocket gateway. Frontend (useAgentChat.js) POSTs here and reads an SSE
// stream. Runs a streaming Anthropic tool-use loop; tools live in
// receptionist-tools.js and reuse the backend's existing endpoints.
//
// SSE events (all `data: {json}`):
//   { type: 'delta',  text }   incremental assistant text
//   { type: 'tool',   name }   a tool is being executed
//   { type: 'final',  text }   full assistant answer (authoritative)
//   { type: 'error',  message }
//
// Usage in index.js:
//   import { registerReceptionist } from './receptionist.js';
//   registerReceptionist(app, { anthropic, supabase, braveWebSearch, PORT });

import { getReceptionistTools, executeReceptionistTool } from './receptionist-tools.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const MAX_LOOPS = 25;

const SYSTEM_PROMPT = `Sei il "Receptionist", l'assistente AI personale di Simone Cimminelli dentro il suo CRM (Command Center). Sei sobrio, concreto e veloce.

LINGUA: rispondi nella lingua dell'utente (di default italiano).

CONTESTO: il messaggio dell'utente può iniziare con un blocco "[CRM Context: ...]" che indica la tab attiva, il contatto/email/evento/deal correntemente selezionato. Usalo per capire a cosa si riferisce l'utente senza richiederlo.

COMANDI: l'utente può usare slash-command (es. /create-task, /what-in-calendar, /create-contact, /search-web). Interpretali come intenzioni e usa il tool corrispondente. Se un comando arriva senza dettagli, chiedi le informazioni mancanti invece di inventarle.

AZIONI e TOOL: usa i tool per compiere azioni reali. Regole:
- Non inventare dati (id, email, date). Se ti manca un campo obbligatorio, chiedilo.
- Dopo un'azione di scrittura (creare task/evento/contatto ecc.), CONFERMA all'utente cosa hai fatto in modo verificabile (titolo, data, id se utile).
- Per operazioni distruttive o invii (email, completare task), procedi solo se l'utente è stato esplicito; altrimenti riepiloga e chiedi conferma.

BOZZE: quando scrivi una bozza di email o messaggio da far rivedere all'utente, racchiudi SOLO il testo della bozza tra due righe con tre trattini:
---
(testo della bozza)
---

EMAIL — bozza vs invio:
- /reply-to-draft e /reply-all-draft: scrivi SOLO la bozza tra i marcatori --- e NON usare tool di invio (ci pensa l'utente col pulsante Send).
- /reply-to-send e /reply-all-send: usa il tool send_email_reply (reply_all=true per "all"). Serve l'Email Inbox ID dal contesto.

RICERCHE: search-web, search-news, search-flights, search-amazon usano tutte la ricerca web (Brave), non API specializzate — cita sempre i link. /pay non è ancora implementato: se richiesto, dillo all'utente.

STILE: risposte brevi, niente preamboli inutili. Vai al punto.`;

export function registerReceptionist(app, deps) {
  const { anthropic, supabase, braveWebSearch, PORT } = deps;
  const apiBase = `http://127.0.0.1:${PORT}`;
  const toolDeps = { supabase, braveWebSearch, apiBase };
  const tools = getReceptionistTools();

  app.post('/receptionist', async (req, res) => {
    const { sessionKey, message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing message' });
    }

    // --- SSE setup ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (obj) => {
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch { /* client gone */ }
    };

    let aborted = false;
    let done = false;
    let currentStream = null;
    // Detect real client disconnect via the RESPONSE stream. (req 'close' fires
    // as soon as the POST body is consumed, which would abort us immediately.)
    res.on('close', () => {
      if (done) return;
      aborted = true;
      try { currentStream?.abort?.(); } catch { /* noop */ }
    });

    // --- Build conversation ---
    const priorHistory = Array.isArray(history)
      ? history
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
          .map(m => ({ role: m.role, content: m.content }))
      : [];
    const messages = [...priorHistory, { role: 'user', content: message }];

    let fullText = '';

    try {
      let loop = 0;
      while (loop < MAX_LOOPS && !aborted) {
        loop++;

        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages,
          tools,
        });
        currentStream = stream;

        stream.on('text', (delta) => {
          if (aborted || !delta) return;
          fullText += delta;
          send({ type: 'delta', text: delta });
        });

        const finalMsg = await stream.finalMessage();
        if (aborted) break;

        // Record assistant turn (tool calls + text) for the next iteration
        messages.push({ role: 'assistant', content: finalMsg.content });

        if (finalMsg.stop_reason === 'tool_use') {
          const toolUses = finalMsg.content.filter(b => b.type === 'tool_use');
          const toolResults = [];
          for (const tu of toolUses) {
            send({ type: 'tool', name: tu.name });
            try {
              const result = await executeReceptionistTool(tu.name, tu.input || {}, toolDeps);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: JSON.stringify(result ?? {}),
              });
            } catch (err) {
              console.error(`[Receptionist] Tool ${tu.name} error:`, err.message);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: `Error: ${err.message}`,
                is_error: true,
              });
            }
          }
          messages.push({ role: 'user', content: toolResults });
          // Separate any pre-tool narration from the next turn's text
          if (fullText && !fullText.endsWith('\n')) fullText += '\n';
          continue;
        }

        // end_turn — done
        break;
      }

      if (!aborted) {
        send({ type: 'final', text: fullText.trim() });
        // Persist the turn (best-effort) for history
        persistTurn(supabase, sessionKey, message, fullText.trim()).catch(e =>
          console.error('[Receptionist] persist error:', e.message)
        );
      }
    } catch (error) {
      console.error('[Receptionist] Error:', error);
      send({ type: 'error', message: error.message || 'Receptionist error' });
    } finally {
      done = true;
      try { res.end(); } catch { /* noop */ }
    }
  });

  console.log('[Receptionist] endpoint registered at POST /receptionist');
}

// Strip the [CRM Context: ...] prefix before storing the human-readable message
function stripContext(text) {
  return (text || '').replace(/^\[CRM Context:[^\]]*\]\s*/s, '').trim();
}

async function persistTurn(supabase, sessionKey, userMessage, assistantText) {
  if (!sessionKey) return;
  // NOTE: agent_chat_messages has CHECK (role IN ('user','agent')) — the
  // assistant turn is stored as 'agent' and mapped back to 'assistant' on read.
  const rows = [
    {
      agent_id: 'receptionist',
      role: 'user',
      content: stripContext(userMessage),
      metadata: { sessionKey },
    },
    {
      agent_id: 'receptionist',
      role: 'agent',
      content: assistantText || '',
      metadata: { sessionKey },
    },
  ];
  const { error } = await supabase.from('agent_chat_messages').insert(rows);
  if (error) throw new Error(error.message);
}
