import 'dotenv/config';
import { JMAPClient, transformEmail } from './jmap.js';
import { upsertEmails } from './supabase.js';

async function syncEmails() {
  console.log('Starting email sync...');

  // Initialize JMAP client
  const jmap = new JMAPClient(
    process.env.FASTMAIL_USERNAME,
    process.env.FASTMAIL_API_TOKEN
  );

  await jmap.init();

  // Get inbox mailbox ID
  const inboxId = await jmap.getInboxId();
  console.log('Inbox ID:', inboxId);

  // Fetch recent emails
  const emails = await jmap.getEmails({
    mailboxId: inboxId,
    limit: 50, // Start with 50 for testing
  });

  console.log(`Fetched ${emails.length} emails from Fastmail`);

  if (emails.length === 0) {
    console.log('No emails to sync');
    return;
  }

  // Transform to our schema
  const transformed = emails.map(transformEmail);

  // Upsert to Supabase
  const result = await upsertEmails(transformed);
  console.log(`Synced ${result.length} emails to Supabase`);

  // Show sample
  console.log('\nSample emails:');
  result.slice(0, 3).forEach(e => {
    console.log(`- ${e.subject} (from: ${e.from_email})`);
  });
}

syncEmails()
  .then(() => {
    console.log('\nSync complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
