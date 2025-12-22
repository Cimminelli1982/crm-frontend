import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';
const MY_EMAIL = 'simone@cimminelli.com';

/**
 * Custom hook for managing Claude AI chat functionality
 * Handles messages, images, sending, and quick actions
 * Supports both email and WhatsApp context
 */
const useChatWithClaude = (selectedThread, emailContacts, activeTab, selectedWhatsappChat, contextContacts, selectedPipelineDeal = null) => {
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImages, setChatImages] = useState([]); // Array of { file, preview, base64, mediaType }

  // Refs
  const chatMessagesRef = useRef(null);
  const chatFileInputRef = useRef(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Clear chat when thread/chat/deal changes
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [selectedThread, selectedWhatsappChat, selectedPipelineDeal]);

  // Build email context for Claude
  const buildEmailContext = useCallback(() => {
    if (!selectedThread || selectedThread.length === 0) return '';

    const threadSubject = selectedThread[0].subject?.replace(/^(Re: |Fwd: )+/i, '');
    const participants = emailContacts.map(p => {
      const name = p.contact ? `${p.contact.first_name} ${p.contact.last_name}` : p.name;
      const role = p.contact?.job_role ? ` (${p.contact.job_role})` : '';
      const company = p.contact?.company_name ? ` at ${p.contact.company_name}` : '';
      return `- ${name}${role}${company}: ${p.email}`;
    }).join('\n');

    const emailsText = selectedThread.map(email => {
      const sender = email.from_email?.toLowerCase() === MY_EMAIL ? 'Me' : (email.from_name || email.from_email);
      const date = new Date(email.date).toLocaleString();
      const body = email.body_text || email.snippet || '';
      return `[${date}] From ${sender}:\n${body}`;
    }).join('\n\n---\n\n');

    return `
EMAIL THREAD CONTEXT:
Subject: ${threadSubject}

Participants:
${participants}

Email Thread (${selectedThread.length} messages):
${emailsText}
`;
  }, [selectedThread, emailContacts]);

  // Build WhatsApp context for Claude
  const buildWhatsAppContext = useCallback(() => {
    if (!selectedWhatsappChat || !selectedWhatsappChat.messages || selectedWhatsappChat.messages.length === 0) return '';

    const chatName = selectedWhatsappChat.chat_name || 'Unknown Chat';
    const isGroup = selectedWhatsappChat.is_group_chat;
    const contactNumber = selectedWhatsappChat.contact_number || '';

    // Build participants from contextContacts
    const participants = contextContacts?.map(p => {
      const name = p.contact ? `${p.contact.first_name} ${p.contact.last_name}` : p.name;
      const role = p.contact?.job_role ? ` (${p.contact.job_role})` : '';
      const company = p.contact?.company_name ? ` at ${p.contact.company_name}` : '';
      const phone = p.phone || '';
      return `- ${name}${role}${company}${phone ? `: ${phone}` : ''}`;
    }).join('\n') || 'No participants found';

    // Sort messages by date
    const sortedMessages = [...selectedWhatsappChat.messages].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const messagesText = sortedMessages.map(msg => {
      const sender = msg.direction === 'sent' ? 'Me' : (msg.from_name || msg.contact_number || 'Unknown');
      const date = new Date(msg.date).toLocaleString();
      const body = msg.body_text || msg.snippet || '';
      return `[${date}] ${sender}:\n${body}`;
    }).join('\n\n---\n\n');

    return `
WHATSAPP CHAT CONTEXT:
Chat: ${chatName}${isGroup ? ' (Group)' : ''}${contactNumber ? ` - ${contactNumber}` : ''}

Participants:
${participants}

Messages (${sortedMessages.length} messages):
${messagesText}
`;
  }, [selectedWhatsappChat, contextContacts]);

  // Build Deal context for Claude
  const buildDealContext = useCallback(() => {
    if (!selectedPipelineDeal) return '';

    const dealName = selectedPipelineDeal.deal_name || selectedPipelineDeal.opportunity || 'Unnamed Deal';
    const stage = selectedPipelineDeal.stage || 'Unknown';
    const category = selectedPipelineDeal.category || '';
    const amount = selectedPipelineDeal.total_investment
      ? `${selectedPipelineDeal.deal_currency || ''} ${Number(selectedPipelineDeal.total_investment).toLocaleString()}`
      : 'Not specified';
    const description = selectedPipelineDeal.description || 'No description';

    const contacts = (selectedPipelineDeal.deals_contacts || []).map(dc => {
      if (!dc.contacts) return null;
      const name = `${dc.contacts.first_name || ''} ${dc.contacts.last_name || ''}`.trim();
      const relationship = dc.relationship ? ` (${dc.relationship})` : '';
      return `- ${name}${relationship}`;
    }).filter(Boolean).join('\n') || 'No contacts linked';

    const companies = (selectedPipelineDeal.deal_companies || []).map(dco => {
      if (!dco.companies) return null;
      const name = dco.companies.name;
      const relationship = dco.relationship ? ` (${dco.relationship})` : '';
      return `- ${name}${relationship}`;
    }).filter(Boolean).join('\n') || 'No companies linked';

    return `
DEAL CONTEXT:
Deal: ${dealName}
Stage: ${stage}
Category: ${category}
Amount: ${amount}

Description:
${description}

Linked Contacts:
${contacts}

Linked Companies:
${companies}
`;
  }, [selectedPipelineDeal]);

  // Build instruction for duplicate processing
  const buildDuplicateMCPInstruction = useCallback(() => {
    const instruction = `Help me clean up duplicate contacts using your CRM tools.

1. First, use crm_find_duplicate_contacts with method="pending_queue" to see pending duplicates
2. For each pair, use crm_compare_contacts to show me a side-by-side comparison
3. I'll tell you which one to keep as primary
4. Use crm_merge_contacts with dry_run=true first to preview changes
5. If I approve, run crm_merge_contacts with dry_run=false to execute
6. If not duplicates, use crm_mark_not_duplicate

Let's start - show me the pending duplicates queue.`;

    return instruction;
  }, []);

  // Handle image file selection for chat
  const handleChatImageSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error('Please select image files');
      return;
    }

    // Convert to base64
    const newImages = await Promise.all(imageFiles.map(async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1]; // Remove data:image/...;base64, prefix
          resolve({
            file,
            preview: URL.createObjectURL(file),
            base64,
            mediaType: file.type
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    setChatImages(prev => [...prev, ...newImages]);
    e.target.value = ''; // Reset input
  }, []);

  // Remove image from chat attachments
  const removeChatImage = useCallback((index) => {
    setChatImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // Send message to Claude
  const sendMessageToClaude = useCallback(async (message, { hideUserMessage = false } = {}) => {
    if (!message.trim() && chatImages.length === 0) return;

    // Build message content (text + images for Claude API)
    let userContent;
    const hasImages = chatImages.length > 0;

    if (hasImages) {
      // Multi-part content with images
      userContent = [];

      // Add images first
      chatImages.forEach(img => {
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: img.base64
          }
        });
      });

      // Add text
      if (message.trim()) {
        userContent.push({
          type: 'text',
          text: message
        });
      }
    } else {
      userContent = message;
    }

    // Add user message to chat (for display) - skip if hideUserMessage is true
    if (!hideUserMessage) {
      const userMessageDisplay = {
        role: 'user',
        content: message,
        images: chatImages.map(img => img.preview) // Store previews for display
      };
      setChatMessages(prev => [...prev, userMessageDisplay]);
    }
    setChatInput('');
    setChatImages([]); // Clear images
    setChatLoading(true);

    try {
      // Build context based on active tab
      const isWhatsApp = activeTab === 'whatsapp';
      const isDeals = activeTab === 'deals';
      const context = isDeals ? buildDealContext() : (isWhatsApp ? buildWhatsAppContext() : buildEmailContext());

      // Different system prompt for deals
      const systemPrompt = isDeals ? `You are Simone Cimminelli's AI assistant for deal and investment management.

TONE & STYLE:
- Be direct and concise. No fluff, no corporate speak.
- Friendly but professional. Like talking to a smart colleague.
- Use short sentences. Get to the point fast.
- Analytical but practical. Focus on actionable insights.

RESPONSE FORMAT:
- Summaries: Max 2-3 bullet points. Just the essentials.
- Analysis: Focus on key deal metrics, risks, and opportunities.
- Actions: One clear recommendation. Maybe a second option.
- Key points: List format, 3-5 items max.

CONTEXT - Simone manages his investment holding. He values:
- Clear, direct communication
- Getting things done fast
- Data-driven decisions
- Understanding the full picture of each deal

${context}` : `You are Simone Cimminelli's AI assistant for ${isWhatsApp ? 'WhatsApp messaging' : 'email management'}.

TONE & STYLE:
- Be direct and concise. No fluff, no corporate speak.
- Friendly but professional. Like talking to a smart colleague.
- Use short sentences. Get to the point fast.
- When drafting replies: warm, personal, efficient. Never robotic.
- Italian-style warmth when appropriate (natural, not forced).

RESPONSE FORMAT:
- Summaries: Max 2-3 bullet points. Just the essentials.
- Actions: One clear recommendation. Maybe a second option.
- Drafts: Keep them short. Real humans don't write essays in ${isWhatsApp ? 'messages' : 'emails'}.
- Key points: List format, 3-5 items max.
- IMPORTANT: When writing draft ${isWhatsApp ? 'messages' : 'emails'}, ALWAYS wrap the draft text between --- markers like this:
---
Your draft ${isWhatsApp ? 'message' : 'email'} text here
---
This format is required so the user can click "Accept & Edit" to use the draft.

IL TUO LAVORO È DIRE NO. SEMPRE.
Default = RIFIUTO. Per qualsiasi email, drafta un rifiuto gentile.
Se Simone vuole dire sì, te lo chiederà esplicitamente.

FORMATO RIFIUTO (SEGUI ESATTAMENTE):
1. "Ciao [nome],"
2. NO + riferimento specifico alla proposta (SUBITO, nella stessa frase)
3. Frase gentile 1 (idealmente con riferimento al contenuto email)
4. Frase gentile 2
5. "Ciao, Simone" oppure "A presto, Simone"

NON fare sandwich (grazie-no-grazie). Il NO viene SUBITO dopo il saluto.

BANNED: "purtroppo", "vi auguro", "grazie ancora", "ricca di spunti", "grazie per" all'inizio

ESEMPIO BUONO:
"Ciao Federico,
non mi interessa partecipare a questo round di Cora.
Complimenti per aver trovato il lead! In bocca al lupo per la chiusura.
Ciao,
Simone"

ESEMPIO SBAGLIATO:
"Ciao Federico, grazie per i dettagli. Non parteciperò..." ← NO! Non iniziare con grazie

CONTEXT - Simone manages his investment holding. He values:
- Clear, direct communication
- Getting things done fast
- Zero corporate bullshit

${context}`;

      // Build messages for API - need to use current state plus new message
      const currentMessages = chatMessages;
      const apiMessages = [...currentMessages, { role: 'user', content: userContent }].map(m => {
        // If message has images array (from previous messages), reconstruct content
        if (m.images && m.images.length > 0) {
          // Previous messages with images - just send text for now (images already processed)
          return { role: m.role, content: m.content };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Claude');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatImages, chatMessages, buildEmailContext, buildWhatsAppContext, buildDealContext, activeTab]);

  // Handle quick action clicks - hide the prompt, show only the response
  const handleQuickAction = useCallback((action) => {
    sendMessageToClaude(action, { hideUserMessage: true });
  }, [sendMessageToClaude]);

  // Send MCP duplicate instruction to chat
  const sendDuplicateMCPInstruction = useCallback(() => {
    const instruction = buildDuplicateMCPInstruction();
    sendMessageToClaude(instruction);
  }, [buildDuplicateMCPInstruction, sendMessageToClaude]);

  // Add a message to chat programmatically (for external use like calendar)
  const addChatMessage = useCallback((message) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  return {
    // State
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    setChatLoading,
    chatImages,
    setChatImages,

    // Refs
    chatMessagesRef,
    chatFileInputRef,

    // Actions
    sendMessageToClaude,
    handleQuickAction,
    handleChatImageSelect,
    removeChatImage,
    sendDuplicateMCPInstruction,
    addChatMessage,

    // Helpers
    buildEmailContext,
    buildDealContext,
    buildDuplicateMCPInstruction,
  };
};

export default useChatWithClaude;
