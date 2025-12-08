import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Spam name patterns to auto-filter
const SPAM_NAME_PATTERNS = [
  'The Spectator',
  'Hide My Email',
];

// Check if from_name matches spam patterns
function isSpamByName(fromName) {
  if (!fromName) return false;
  return SPAM_NAME_PATTERNS.some(pattern =>
    fromName.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Extract domain from email
function getDomain(email) {
  if (!email) return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

// Load spam lists from DB
async function loadSpamLists() {
  const [emailsResult, domainsResult] = await Promise.all([
    supabase.from('emails_spam').select('email'),
    supabase.from('domains_spam').select('domain'),
  ]);

  if (emailsResult.error) {
    console.error('Error loading emails_spam:', emailsResult.error.message);
  }
  if (domainsResult.error) {
    console.error('Error loading domains_spam:', domainsResult.error.message);
  }

  const spamEmails = new Set(
    (emailsResult.data || []).map(e => e.email?.toLowerCase()).filter(Boolean)
  );
  const spamDomains = new Set(
    (domainsResult.data || []).map(d => d.domain?.toLowerCase()).filter(Boolean)
  );

  return { spamEmails, spamDomains };
}

// Add email to spam list
async function addToEmailSpam(email) {
  const { error } = await supabase
    .from('emails_spam')
    .upsert({
      email: email.toLowerCase(),
      counter: 1,
      created_at: new Date().toISOString(),
      last_modified_at: new Date().toISOString(),
    }, {
      onConflict: 'email',
    });

  if (error) console.error('Error adding to emails_spam:', error);
}

// Increment email spam counter
async function incrementEmailSpamCounter(email) {
  const { data } = await supabase
    .from('emails_spam')
    .select('counter')
    .eq('email', email.toLowerCase())
    .single();

  const newCounter = (data?.counter || 0) + 1;

  await supabase
    .from('emails_spam')
    .update({
      counter: newCounter,
      last_modified_at: new Date().toISOString()
    })
    .eq('email', email.toLowerCase());
}

// Increment domain spam counter
async function incrementDomainSpamCounter(domain) {
  const { data } = await supabase
    .from('domains_spam')
    .select('counter')
    .eq('domain', domain.toLowerCase())
    .single();

  const newCounter = (data?.counter || 0) + 1;

  await supabase
    .from('domains_spam')
    .update({ counter: newCounter })
    .eq('domain', domain.toLowerCase());
}

// Filter and upsert emails with spam detection
// Returns { validEmails: [...], spamByEmail: [...], spamByDomain: [...] }
export async function upsertEmailsWithSpamFilter(emails) {
  const { spamEmails, spamDomains } = await loadSpamLists();

  const validEmails = [];
  const spamByEmail = []; // Fastmail IDs blocked by email address -> Skip_Email
  const spamByDomain = []; // Fastmail IDs blocked by domain -> Skip_Domain
  const myEmail = process.env.FASTMAIL_USERNAME?.toLowerCase();

  for (const email of emails) {
    const fromEmail = email.from_email?.toLowerCase();
    const fromName = email.from_name;
    const domain = getDomain(fromEmail);

    // Never filter my own sent emails
    if (fromEmail === myEmail) {
      validEmails.push(email);
      continue;
    }

    // Check 1: Spam name patterns (treat as email spam)
    if (isSpamByName(fromName)) {
      console.log(`  [SPAM] Name pattern: ${fromName} <${fromEmail}>`);
      await addToEmailSpam(fromEmail);
      spamByEmail.push(email.fastmail_id);
      continue;
    }

    // Check 2: Email in spam list
    if (fromEmail && spamEmails.has(fromEmail)) {
      console.log(`  [SPAM] Email blocked: ${fromEmail}`);
      await incrementEmailSpamCounter(fromEmail);
      spamByEmail.push(email.fastmail_id);
      continue;
    }

    // Check 3: Domain in spam list
    if (domain && spamDomains.has(domain)) {
      console.log(`  [SPAM] Domain blocked: ${domain}`);
      await incrementDomainSpamCounter(domain);
      spamByDomain.push(email.fastmail_id);
      continue;
    }

    // Passed all filters
    validEmails.push(email);
  }

  const totalSpam = spamByEmail.length + spamByDomain.length;
  if (totalSpam > 0) {
    console.log(`  Filtered ${totalSpam} spam emails (${spamByEmail.length} by email, ${spamByDomain.length} by domain)`);
  }

  let insertedData = [];
  if (validEmails.length > 0) {
    const { data, error } = await supabase
      .from('command_center_inbox')
      .upsert(validEmails, {
        onConflict: 'fastmail_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }
    insertedData = data;
  }

  return { validEmails: insertedData, spamByEmail, spamByDomain };
}

// Legacy function (without spam filter)
export async function upsertEmails(emails) {
  return upsertEmailsWithSpamFilter(emails);
}

export async function getLatestEmailDate(mailboxType = 'inbox') {
  // Get last sync date from sync_state table (not affected by deletions)
  // Use separate sync dates for inbox and sent to avoid missing sent emails
  const syncId = mailboxType === 'sent' ? 'email_sync_sent' : 'email_sync';

  const { data, error } = await supabase
    .from('sync_state')
    .select('last_sync_date')
    .eq('id', syncId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error(`Error fetching sync state for ${mailboxType}:`, error);
  }

  return data?.last_sync_date || null;
}

export async function updateSyncDate(date, mailboxType = 'inbox') {
  // Use separate sync dates for inbox and sent
  const syncId = mailboxType === 'sent' ? 'email_sync_sent' : 'email_sync';

  const { error } = await supabase
    .from('sync_state')
    .upsert({
      id: syncId,
      last_sync_date: date
    });

  if (error) {
    console.error(`Error updating sync state for ${mailboxType}:`, error);
  }
}
