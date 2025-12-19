import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session storage path
const AUTH_FOLDER = path.join(__dirname, '..', 'baileys_auth');

// Singleton socket instance
let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected'; // disconnected, connecting, connected, qr_ready
let connectionError = null;

// Ensure auth folder exists
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

/**
 * Initialize Baileys connection
 */
export async function initBaileys() {
  if (sock && connectionStatus === 'connected') {
    console.log('[Baileys] Already connected');
    return { status: 'connected' };
  }

  try {
    connectionStatus = 'connecting';
    connectionError = null;
    qrCode = null;

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    console.log('[Baileys] Initializing with version:', version);

    // Create a proper pino-compatible logger
    const logger = {
      level: 'silent',
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: console.warn,
      error: console.error,
      fatal: console.error,
      child: function() { return this; },
    };

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      logger,
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = qr;
        connectionStatus = 'qr_ready';
        console.log('[Baileys] QR code ready - scan with WhatsApp');
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error instanceof Boom &&
          lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

        connectionError = lastDisconnect?.error?.message || 'Connection closed';
        connectionStatus = 'disconnected';

        console.log('[Baileys] Connection closed:', connectionError);

        if (shouldReconnect) {
          console.log('[Baileys] Reconnecting...');
          setTimeout(() => initBaileys(), 3000);
        } else if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
          // Clear auth and require new QR scan
          console.log('[Baileys] Logged out - clearing session');
          clearSession();
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        connectionError = null;
        qrCode = null;
        console.log('[Baileys] Connected successfully!');
      }
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    return { status: connectionStatus };
  } catch (error) {
    connectionStatus = 'disconnected';
    connectionError = error.message;
    console.error('[Baileys] Init error:', error);
    throw error;
  }
}

/**
 * Get current connection status
 */
export function getStatus() {
  return {
    status: connectionStatus,
    error: connectionError,
    hasQR: !!qrCode,
    hasSession: fs.existsSync(path.join(AUTH_FOLDER, 'creds.json')),
  };
}

/**
 * Get QR code for scanning
 */
export function getQRCode() {
  return qrCode;
}

/**
 * Clear session (logout)
 */
export function clearSession() {
  try {
    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }
    sock = null;
    qrCode = null;
    connectionStatus = 'disconnected';
    connectionError = null;
    console.log('[Baileys] Session cleared');
    return { success: true };
  } catch (error) {
    console.error('[Baileys] Clear session error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send text message
 * @param {string} to - Phone number with country code (e.g., "447911123456") or group JID
 * @param {string} text - Message text
 */
export async function sendMessage(to, text) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp not connected');
  }

  // Format JID
  const jid = formatJID(to);

  console.log(`[Baileys] Sending message to ${jid}`);

  const result = await sock.sendMessage(jid, { text });

  console.log(`[Baileys] Message sent:`, result.key.id);

  return {
    success: true,
    messageId: result.key.id,
    timestamp: result.messageTimestamp,
  };
}

/**
 * Send message to a group by chat_id
 * @param {string} chatId - Group JID or chat ID
 * @param {string} text - Message text
 */
export async function sendMessageToChat(chatId, text) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp not connected');
  }

  // chatId should already be a JID for groups (ending in @g.us)
  const jid = chatId.includes('@') ? chatId : `${chatId}@g.us`;

  console.log(`[Baileys] Sending message to chat ${jid}`);

  const result = await sock.sendMessage(jid, { text });

  console.log(`[Baileys] Message sent to chat:`, result.key.id);

  return {
    success: true,
    messageId: result.key.id,
    timestamp: result.messageTimestamp,
  };
}

/**
 * Send media message
 * @param {string} to - Phone number or JID
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - MIME type
 * @param {string} filename - Original filename
 * @param {string} caption - Optional caption
 */
export async function sendMedia(to, buffer, mimetype, filename, caption = '') {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp not connected');
  }

  const jid = formatJID(to);

  console.log(`[Baileys] Sending media to ${jid}: ${filename} (${mimetype})`);

  let messageContent;

  if (mimetype.startsWith('image/')) {
    messageContent = {
      image: buffer,
      caption: caption || undefined,
      mimetype,
    };
  } else if (mimetype.startsWith('video/')) {
    messageContent = {
      video: buffer,
      caption: caption || undefined,
      mimetype,
    };
  } else if (mimetype.startsWith('audio/')) {
    messageContent = {
      audio: buffer,
      mimetype,
      ptt: mimetype.includes('ogg'), // Voice note if ogg
    };
  } else {
    // Document
    messageContent = {
      document: buffer,
      mimetype,
      fileName: filename,
      caption: caption || undefined,
    };
  }

  const result = await sock.sendMessage(jid, messageContent);

  console.log(`[Baileys] Media sent:`, result.key.id);

  return {
    success: true,
    messageId: result.key.id,
    timestamp: result.messageTimestamp,
  };
}

/**
 * Format phone number to WhatsApp JID
 */
function formatJID(input) {
  // Already a JID
  if (input.includes('@')) {
    return input;
  }

  // Clean phone number
  let phone = input.replace(/[^0-9]/g, '');

  // Remove leading zeros
  phone = phone.replace(/^0+/, '');

  // Add @s.whatsapp.net for individual chats
  return `${phone}@s.whatsapp.net`;
}

/**
 * Check if a number is registered on WhatsApp
 */
export async function isRegistered(phone) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp not connected');
  }

  const jid = formatJID(phone);
  const [result] = await sock.onWhatsApp(jid.replace('@s.whatsapp.net', ''));

  return {
    registered: !!result?.exists,
    jid: result?.jid,
  };
}

// Export socket for advanced usage
export function getSocket() {
  return sock;
}
