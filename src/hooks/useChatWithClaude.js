import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';
const MY_EMAIL = 'simone@cimminelli.com';

/**
 * Custom hook for managing Claude AI chat functionality
 * Handles messages, images, sending, and quick actions
 */
const useChatWithClaude = (selectedThread, emailContacts) => {
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

  // Clear chat when thread changes
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [selectedThread]);

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
      const emailContext = buildEmailContext();
      const systemPrompt = `You are Simone Cimminelli's AI assistant for email management.

TONE & STYLE:
- Be direct and concise. No fluff, no corporate speak.
- Friendly but professional. Like talking to a smart colleague.
- Use short sentences. Get to the point fast.
- When drafting replies: warm, personal, efficient. Never robotic.
- Italian-style warmth when appropriate (natural, not forced).

RESPONSE FORMAT:
- Summaries: Max 2-3 bullet points. Just the essentials.
- Actions: One clear recommendation. Maybe a second option.
- Drafts: Keep them short. Real humans don't write essays in emails.
- Key points: List format, 3-5 items max.
- IMPORTANT: When writing draft emails, ALWAYS wrap the draft text between --- markers like this:
---
Your draft email text here
---
This format is required so the user can click "Accept & Edit" to use the draft.

CONTEXT - Simone runs a newsletter business and is an investor. He values:
- Building genuine relationships
- Clear communication
- Getting things done efficiently
- Personal touch over corporate formality

${emailContext}`;

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
  }, [chatImages, chatMessages, buildEmailContext]);

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
    buildDuplicateMCPInstruction,
  };
};

export default useChatWithClaude;
