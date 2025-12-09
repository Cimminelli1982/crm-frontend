// JMAP client for Fastmail
// Docs: https://jmap.io/spec-mail.html

const JMAP_SESSION_URL = 'https://api.fastmail.com/jmap/session';

export class JMAPClient {
  constructor(username, token) {
    this.username = username;
    this.token = token;
    this.session = null;
    this.accountId = null;
    this.apiUrl = null;
  }

  async init() {
    // Get JMAP session
    const response = await fetch(JMAP_SESSION_URL, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`JMAP session failed: ${response.status} ${response.statusText}`);
    }

    this.session = await response.json();
    this.accountId = this.session.primaryAccounts['urn:ietf:params:jmap:mail'];
    this.apiUrl = this.session.apiUrl;

    console.log('JMAP session initialized');
    console.log('Account ID:', this.accountId);

    return this;
  }

  async request(methodCalls) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        using: [
          'urn:ietf:params:jmap:core',
          'urn:ietf:params:jmap:mail',
          'urn:ietf:params:jmap:submission',
        ],
        methodCalls,
      }),
    });

    if (!response.ok) {
      throw new Error(`JMAP request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.methodResponses;
  }

  async getMailboxes() {
    const responses = await this.request([
      ['Mailbox/get', { accountId: this.accountId }, 'a'],
    ]);

    return responses[0][1].list;
  }

  async getInboxId() {
    const mailboxes = await this.getMailboxes();
    const inbox = mailboxes.find(m => m.role === 'inbox');
    return inbox?.id;
  }

  async getSentId() {
    const mailboxes = await this.getMailboxes();
    const sent = mailboxes.find(m => m.role === 'sent');
    return sent?.id;
  }

  async getMailboxIds(roles = ['inbox', 'sent']) {
    const mailboxes = await this.getMailboxes();
    return roles.map(role => {
      const mb = mailboxes.find(m => m.role === role);
      return { role, id: mb?.id };
    }).filter(m => m.id);
  }

  async getEmails({ mailboxId, limit = 50, position = 0, sinceDate = null }) {
    // Build filter
    const filter = {};
    if (mailboxId) {
      filter.inMailbox = mailboxId;
    }
    if (sinceDate) {
      // JMAP requires UTCDate format (ISO 8601 with Z suffix)
      const utcDate = new Date(sinceDate).toISOString();
      filter.after = utcDate;
      console.log(`    Using filter after: ${utcDate}`);
    }
    // Exclude emails already processed by CRM
    filter.notKeyword = '$crm_done';

    // First query for email IDs
    const queryResponses = await this.request([
      ['Email/query', {
        accountId: this.accountId,
        filter,
        sort: [{ property: 'receivedAt', isAscending: false }],
        position,
        limit,
      }, 'query'],
    ]);

    const emailIds = queryResponses[0][1]?.ids || [];

    if (emailIds.length === 0) {
      return [];
    }

    // Then fetch email details
    const getResponses = await this.request([
      ['Email/get', {
        accountId: this.accountId,
        ids: emailIds,
        properties: [
          'id',
          'threadId',
          'messageId',
          'subject',
          'from',
          'to',
          'cc',
          'receivedAt',
          'preview',
          'bodyValues',
          'textBody',
          'htmlBody',
          'hasAttachment',
          'attachments',
          'keywords',
        ],
        fetchTextBodyValues: true,
        fetchHTMLBodyValues: true,
        maxBodyValueBytes: 1000000,
      }, 'get'],
    ]);

    return getResponses[0][1].list;
  }

  async getEmailById(emailId) {
    const responses = await this.request([
      ['Email/get', {
        accountId: this.accountId,
        ids: [emailId],
        properties: [
          'id',
          'threadId',
          'messageId',
          'inReplyTo',
          'references',
          'subject',
          'from',
          'to',
          'cc',
          'receivedAt',
          'preview',
          'bodyValues',
          'textBody',
          'htmlBody',
          'hasAttachment',
          'attachments',
          'keywords',
        ],
        fetchTextBodyValues: true,
        fetchHTMLBodyValues: true,
        maxBodyValueBytes: 1000000,
      }, 'get'],
    ]);

    return responses[0][1].list[0];
  }

  async getDraftsId() {
    const mailboxes = await this.getMailboxes();
    const drafts = mailboxes.find(m => m.role === 'drafts');
    return drafts?.id;
  }

  async getSentId() {
    const mailboxes = await this.getMailboxes();
    const sent = mailboxes.find(m => m.role === 'sent');
    return sent?.id;
  }

  async getArchiveId() {
    const mailboxes = await this.getMailboxes();
    const archive = mailboxes.find(m => m.role === 'archive');
    return archive?.id;
  }

  async getOrCreateFolder(folderName) {
    const mailboxes = await this.getMailboxes();

    // Look for existing folder
    let folder = mailboxes.find(m => m.name === folderName);
    if (folder) {
      return folder.id;
    }

    // Create folder
    const responses = await this.request([
      ['Mailbox/set', {
        accountId: this.accountId,
        create: {
          newFolder: {
            name: folderName,
            parentId: null,
          }
        }
      }, 'createFolder']
    ]);

    const result = responses[0][1];
    if (result.notCreated?.newFolder) {
      throw new Error(`Failed to create ${folderName} folder: ${JSON.stringify(result.notCreated.newFolder)}`);
    }

    return result.created?.newFolder?.id;
  }

  async getSkipEmailFolderId() {
    return this.getOrCreateFolder('Skip_Email');
  }

  async getSkipDomainFolderId() {
    return this.getOrCreateFolder('Skip_Domain');
  }

  async moveToFolder(emailId, folderId, markAsRead = false) {
    const update = {
      mailboxIds: { [folderId]: true }
    };
    if (markAsRead) {
      update.keywords = { '$seen': true };
    }

    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update: {
          [emailId]: update
        }
      }, 'moveToFolder']
    ]);

    const result = responses[0][1];
    if (result.notUpdated?.[emailId]) {
      throw new Error(`Failed to move email: ${JSON.stringify(result.notUpdated[emailId])}`);
    }

    return { moved: true, emailId };
  }

  async moveMultipleToFolder(emailIds, folderId, markAsRead = false) {
    if (!emailIds || emailIds.length === 0) return { moved: 0 };

    // Build update object for all emails
    const update = {};
    emailIds.forEach(id => {
      const emailUpdate = { mailboxIds: { [folderId]: true } };
      if (markAsRead) {
        emailUpdate.keywords = { '$seen': true };
      }
      update[id] = emailUpdate;
    });

    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update
      }, 'moveMultipleToFolder']
    ]);

    const result = responses[0][1];
    const movedCount = Object.keys(result.updated || {}).length;
    const failedCount = Object.keys(result.notUpdated || {}).length;

    return { moved: movedCount, failed: failedCount };
  }

  async moveSpamEmails(spamByEmail, spamByDomain) {
    const results = { emailMoved: 0, domainMoved: 0, failed: 0 };

    // Move emails blocked by email address to Skip_Email (and mark as read)
    if (spamByEmail && spamByEmail.length > 0) {
      const skipEmailId = await this.getSkipEmailFolderId();
      const emailResult = await this.moveMultipleToFolder(spamByEmail, skipEmailId, true);
      results.emailMoved = emailResult.moved;
      results.failed += emailResult.failed;
      console.log(`Moved ${emailResult.moved} emails to Skip_Email`);
    }

    // Move emails blocked by domain to Skip_Domain (and mark as read)
    if (spamByDomain && spamByDomain.length > 0) {
      const skipDomainId = await this.getSkipDomainFolderId();
      const domainResult = await this.moveMultipleToFolder(spamByDomain, skipDomainId, true);
      results.domainMoved = domainResult.moved;
      results.failed += domainResult.failed;
      console.log(`Moved ${domainResult.moved} emails to Skip_Domain`);
    }

    return results;
  }

  async archiveEmail(emailId) {
    const archiveId = await this.getArchiveId();
    if (!archiveId) {
      throw new Error('Archive mailbox not found');
    }

    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update: {
          [emailId]: {
            mailboxIds: { [archiveId]: true }
          }
        }
      }, 'archive']
    ]);

    const result = responses[0][1];
    if (result.notUpdated?.[emailId]) {
      throw new Error(`Failed to archive email: ${JSON.stringify(result.notUpdated[emailId])}`);
    }

    return { archived: true, emailId };
  }

  async markAsRead(emailIds) {
    if (!emailIds || emailIds.length === 0) return { updated: 0 };

    // Build update object for all emails
    const update = {};
    emailIds.forEach(id => {
      update[id] = { 'keywords/$seen': true };
    });

    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update
      }, 'markAsRead']
    ]);

    const result = responses[0][1];
    const updatedCount = Object.keys(result.updated || {}).length;
    const failedCount = Object.keys(result.notUpdated || {}).length;

    return { updated: updatedCount, failed: failedCount };
  }

  // Add a keyword to a single email
  async addKeyword(emailId, keyword) {
    if (!emailId) return { updated: 0 };

    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update: {
          [emailId]: { [`keywords/${keyword}`]: true }
        }
      }, 'addKeyword']
    ]);

    const result = responses[0][1];
    if (result.notUpdated?.[emailId]) {
      console.error(`Failed to add keyword to ${emailId}:`, result.notUpdated[emailId]);
      return { updated: 0, failed: 1 };
    }

    return { updated: 1, failed: 0 };
  }

  // Add a keyword to multiple emails (batch operation)
  async addKeywordToMultiple(emailIds, keyword) {
    if (!emailIds || emailIds.length === 0) return { updated: 0, failed: 0 };

    // Build update object for all emails
    const update = {};
    emailIds.forEach(id => {
      update[id] = { [`keywords/${keyword}`]: true };
    });

    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update
      }, 'addKeywordToMultiple']
    ]);

    const result = responses[0][1];
    const updatedCount = Object.keys(result.updated || {}).length;
    const failedCount = Object.keys(result.notUpdated || {}).length;

    if (failedCount > 0) {
      console.error(`Failed to add keyword to ${failedCount} emails:`, result.notUpdated);
    }

    return { updated: updatedCount, failed: failedCount };
  }

  // Download a blob (attachment) from Fastmail
  async downloadBlob(blobId, name, type) {
    // JMAP download URL from session looks like:
    // https://api.fastmail.com/jmap/download/{accountId}/{blobId}/{name}?accept={type}
    // We need to replace the placeholders
    let downloadUrl = this.session.downloadUrl
      .replace('{accountId}', encodeURIComponent(this.accountId))
      .replace('{blobId}', encodeURIComponent(blobId))
      .replace('{name}', encodeURIComponent(name || 'attachment'))
      .replace('{type}', encodeURIComponent(type || 'application/octet-stream'));

    console.log(`[JMAP] Downloading blob from: ${downloadUrl}`);

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[JMAP] Download failed: ${response.status} - ${errorText}`);
      throw new Error(`Failed to download blob: ${response.status} ${response.statusText}`);
    }

    return {
      buffer: await response.arrayBuffer(),
      contentType: response.headers.get('content-type') || type || 'application/octet-stream',
      filename: name || 'attachment',
    };
  }

  // Upload a blob (attachment) to Fastmail
  async uploadBlob(buffer, type = 'application/octet-stream') {
    // JMAP upload URL from session looks like:
    // https://api.fastmail.com/jmap/upload/{accountId}/
    let uploadUrl = this.session.uploadUrl
      .replace('{accountId}', encodeURIComponent(this.accountId));

    console.log(`[JMAP] Uploading blob to: ${uploadUrl}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': type,
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[JMAP] Upload failed: ${response.status} - ${errorText}`);
      throw new Error(`Failed to upload blob: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[JMAP] Uploaded blob: ${result.blobId}, size: ${result.size}`);
    return result; // { accountId, blobId, type, size }
  }

  async sendEmail({ to, cc, subject, textBody, htmlBody, inReplyTo, references, attachments }) {
    // Get identity (sender)
    const identityResponse = await this.request([
      ['Identity/get', { accountId: this.accountId }, 'identity'],
    ]);

    console.log('Identity response:', JSON.stringify(identityResponse, null, 2));

    if (!identityResponse || !identityResponse[0] || !identityResponse[0][1]) {
      throw new Error('Invalid identity response from JMAP');
    }

    const identity = identityResponse[0][1].list?.[0];
    if (!identity) {
      throw new Error('No identity found for sending email');
    }

    console.log('Using identity:', identity.email);

    // Get drafts mailbox ID
    const draftsId = await this.getDraftsId();
    if (!draftsId) {
      throw new Error('Drafts mailbox not found');
    }

    // Build email object
    const email = {
      mailboxIds: { [draftsId]: true },
      from: [{ email: identity.email, name: identity.name }],
      to: to.map(r => typeof r === 'string' ? { email: r } : r),
      subject,
      bodyValues: {
        body: { value: textBody, charset: 'utf-8' }
      },
      textBody: [{ partId: 'body', type: 'text/plain' }],
      keywords: { $draft: true },
    };

    if (cc && cc.length > 0) {
      email.cc = cc.map(r => typeof r === 'string' ? { email: r } : r);
    }

    if (htmlBody) {
      email.bodyValues.htmlBody = { value: htmlBody, charset: 'utf-8' };
      email.htmlBody = [{ partId: 'htmlBody', type: 'text/html' }];
    }

    if (inReplyTo) {
      email.inReplyTo = [inReplyTo];
    }

    if (references) {
      email.references = Array.isArray(references) ? references : [references];
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      email.attachments = attachments.map(att => ({
        blobId: att.blobId,
        type: att.type || 'application/octet-stream',
        name: att.name,
        size: att.size,
        disposition: 'attachment',
      }));
      console.log(`[JMAP] Adding ${attachments.length} attachments to email`);
    }

    // Get Sent mailbox ID
    const sentId = await this.getSentId();
    if (!sentId) {
      throw new Error('Sent mailbox not found');
    }

    // Create and send in one request using EmailSubmission
    // On success, move the email from Drafts to Sent (not destroy it)
    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        create: {
          draft: email
        }
      }, 'email'],
      ['EmailSubmission/set', {
        accountId: this.accountId,
        create: {
          send: {
            identityId: identity.id,
            emailId: '#draft',
          }
        },
        // Move to Sent folder on success instead of destroying
        onSuccessUpdateEmail: {
          '#send': {
            mailboxIds: { [sentId]: true },
            'keywords/$draft': null  // Remove draft keyword
          }
        }
      }, 'submit'],
    ]);

    const emailResult = responses[0][1];
    const submitResult = responses[1][1];

    if (emailResult.notCreated?.draft) {
      throw new Error(`Failed to create email: ${JSON.stringify(emailResult.notCreated.draft)}`);
    }

    if (submitResult.notCreated?.send) {
      throw new Error(`Failed to send email: ${JSON.stringify(submitResult.notCreated.send)}`);
    }

    // Stamp the sent email with $crm_done to prevent re-sync
    const sentEmailId = emailResult.created?.draft?.id;
    if (sentEmailId) {
      try {
        await this.addKeyword(sentEmailId, '$crm_done');
        console.log(`Stamped sent email ${sentEmailId} with $crm_done`);
      } catch (stampError) {
        console.error(`Failed to stamp sent email:`, stampError.message);
      }
    }

    return {
      emailId: sentEmailId,
      submitted: !!submitResult.created?.send
    };
  }
}

// Transform JMAP email to our schema
export function transformEmail(jmapEmail) {
  const getBodyValue = (bodyParts, bodyValues) => {
    if (!bodyParts || bodyParts.length === 0) return null;
    const partId = bodyParts[0].partId;
    return bodyValues?.[partId]?.value || null;
  };

  return {
    fastmail_id: jmapEmail.id,
    thread_id: jmapEmail.threadId,
    subject: jmapEmail.subject,
    from_email: jmapEmail.from?.[0]?.email || null,
    from_name: jmapEmail.from?.[0]?.name || null,
    to_recipients: jmapEmail.to?.map(r => ({ email: r.email, name: r.name })) || [],
    cc_recipients: jmapEmail.cc?.map(r => ({ email: r.email, name: r.name })) || [],
    date: jmapEmail.receivedAt,
    body_text: getBodyValue(jmapEmail.textBody, jmapEmail.bodyValues),
    body_html: getBodyValue(jmapEmail.htmlBody, jmapEmail.bodyValues),
    snippet: jmapEmail.preview,
    is_read: jmapEmail.keywords?.['$seen'] || false,
    is_starred: jmapEmail.keywords?.['$flagged'] || false,
    has_attachments: jmapEmail.hasAttachment || false,
    attachments: jmapEmail.attachments?.map(a => ({
      name: a.name,
      type: a.type,
      size: a.size,
      blobId: a.blobId,
    })) || [],
    labels: Object.keys(jmapEmail.keywords || {}),
  };
}
