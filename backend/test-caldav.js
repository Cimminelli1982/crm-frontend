import 'dotenv/config';
import { CalDAVClient } from './src/caldav.js';

const username = process.env.FASTMAIL_USERNAME;
const token = process.env.FASTMAIL_CALDAV_PASSWORD || process.env.FASTMAIL_API_TOKEN;

if (!username || !token) {
  console.log('Missing FASTMAIL_USERNAME or FASTMAIL_CALDAV_PASSWORD');
  process.exit(1);
}

console.log('Testing CalDAV connection for:', username);

const caldav = new CalDAVClient(username, token);

try {
  // Test 1: Get ctag
  const { ctag, displayName } = await caldav.getCalendarCtag();
  console.log('✓ Calendar ctag:', ctag?.substring(0, 30) + '...');
  console.log('✓ Calendar name:', displayName);

  // Test 2: Full sync
  console.log('\nFetching events...');
  const events = await caldav.fullSync();
  console.log('✓ Found', events.length, 'events');

  // Show first 3 events as sample
  for (let i = 0; i < Math.min(3, events.length); i++) {
    const e = events[i];
    console.log(`\nEvent ${i + 1}:`);
    console.log('  Title:', e.title);
    console.log('  Date:', e.startDate);
    console.log('  Location:', e.location || '(none)');
    console.log('  Attendees:', e.attendees?.length || 0);
    if (e.attendees?.length > 0) {
      e.attendees.forEach(a => {
        console.log(`    - ${a.name || a.email}: ${a.status}`);
      });
    }
  }

  // Test 3: Create a test event with attendee
  console.log('\n--- Creating test event with attendee ---');
  const testEvent = await caldav.createEvent({
    title: 'CalDAV Test Event',
    description: 'Testing CalDAV sync from CRM',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
    attendees: [
      { email: 'deals2airtable@gmail.com', name: 'Deals Airtable' }
    ],
    reminders: [15]
  });
  console.log('✓ Created event:', testEvent.uid);
  console.log('  URL:', testEvent.url);

  console.log('\n✓ CalDAV test passed!');
} catch (err) {
  console.error('✗ Error:', err.message);
  process.exit(1);
}
