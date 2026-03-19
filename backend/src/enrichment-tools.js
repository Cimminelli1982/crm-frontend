// Enrichment Tools — Standalone functions extracted from smart-create
// Each function can be called directly (no agent needed) or wrapped as a Claude tool
//
// Used by: /contact/smart-enrich (targeted enrichment of existing contacts)
// smart-create still has its own inline handlers (untouched)

import { supabase } from './supabase.js';
import { createHash } from 'crypto';

const CRM_AGENT_URL = process.env.CRM_AGENT_URL || 'http://localhost:8000';

// ============ QUALITY CHECK ============

export async function runQualityCheck(contactId) {
  const missing = [];
  const details = {};

  // 1. Completeness
  const { data: cc } = await supabase
    .from('contact_completeness')
    .select('*')
    .eq('contact_id', contactId)
    .maybeSingle();

  if (!cc || cc.completeness_score < 100) {
    missing.push('completeness');
    const missingFields = [];
    if (!cc?.category || ['Not Set', 'Inbox'].includes(cc?.category)) missingFields.push('category');
    if (!cc?.score) missingFields.push('score');
    if (!cc?.description) missingFields.push('description');
    if (!cc?.job_role) missingFields.push('job_role');
    if (!cc?.linkedin) missingFields.push('linkedin');
    if (!cc?.birthday) missingFields.push('birthday');
    if (!cc?.keep_in_touch_frequency || cc?.keep_in_touch_frequency === 'Not Set') missingFields.push('keep_in_touch');
    if (cc?.email_count === 0) missingFields.push('email');
    if (cc?.mobile_count === 0) missingFields.push('mobile');
    if (cc?.city_count === 0) missingFields.push('city');
    if (cc?.tag_count === 0) missingFields.push('tags');
    details.completeness = { score: cc?.completeness_score || 0, missing_fields: missingFields };
  }

  // 2. Photo
  const { data: contactPhoto } = await supabase
    .from('contacts')
    .select('profile_image_url')
    .eq('contact_id', contactId)
    .maybeSingle();
  if (!contactPhoto?.profile_image_url) {
    missing.push('photo');
    details.photo = true;
  }

  // 3. Note (>500 chars)
  const { data: notes } = await supabase
    .from('notes_contacts')
    .select('notes(note_id, text, deleted_at)')
    .eq('contact_id', contactId);
  const hasGoodNote = (notes || []).some(n => n.notes && !n.notes.deleted_at && (n.notes.text || '').length > 500);
  if (!hasGoodNote) {
    missing.push('note');
    details.note = true;
  }

  // 4. Company linked
  const { data: companies } = await supabase
    .from('contact_companies')
    .select('company_id, relationship')
    .eq('contact_id', contactId)
    .neq('relationship', 'suggestion');
  if (!companies?.length) {
    missing.push('company');
    details.company = true;
    missing.push('company_complete');
    details.company_complete = true;
  } else {
    // 5. Company complete
    const companyId = companies[0].company_id;
    const { data: compComp } = await supabase
      .from('company_completeness')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();
    if (!compComp || compComp.completeness_score < 100) {
      missing.push('company_complete');
      const compMissing = [];
      if (!compComp?.website) compMissing.push('website');
      if (!compComp?.description) compMissing.push('description');
      if (!compComp?.linkedin) compMissing.push('linkedin');
      if (compComp?.domain_count === 0) compMissing.push('domains');
      if (compComp?.tag_count === 0) compMissing.push('tags');
      if (!compComp?.has_logo) compMissing.push('logo');
      details.company_complete = {
        company_name: compComp?.name || 'Unknown',
        score: compComp?.completeness_score || 0,
        missing_fields: compMissing,
      };
    }
  }

  // Determine bucket
  let bucket = 'c';
  if (missing.includes('completeness')) {
    const mf = details.completeness?.missing_fields || [];
    if (mf.includes('category') || mf.includes('score') || mf.includes('keep_in_touch')) {
      bucket = 'b';
    }
  }

  // Upsert into contacts_clarissa_processing
  if (missing.length > 0) {
    await supabase
      .from('contacts_clarissa_processing')
      .upsert({
        contact_id: contactId,
        bucket,
        missing_dimensions: missing,
        missing_details: details,
        checked_at: new Date().toISOString(),
        resolved_at: null,
      }, { onConflict: 'contact_id' });
  } else {
    await supabase
      .from('contacts_clarissa_processing')
      .upsert({
        contact_id: contactId,
        bucket: 'a',
        missing_dimensions: [],
        missing_details: {},
        checked_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      }, { onConflict: 'contact_id' });
  }

  return {
    dimensions_total: 5,
    dimensions_complete: 5 - missing.length,
    missing_dimensions: missing,
    missing_details: details,
    bucket: missing.length > 0 ? bucket : 'a',
  };
}

// ============ APOLLO ENRICHMENT ============

export async function enrichWithApollo(email, firstName, lastName) {
  try {
    const resp = await fetch(`${CRM_AGENT_URL}/suggest-contact-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_email: email,
        from_name: `${firstName || ''} ${lastName || ''}`.trim(),
      }),
    });
    return await resp.json();
  } catch (err) {
    return { error: err.message };
  }
}

// ============ SEARCH CRM COMMUNICATIONS ============

export async function searchCrmCommunications(email) {
  const emailLower = email.toLowerCase();

  const { data: inbox } = await supabase
    .from('command_center_inbox')
    .select('id, type, from_email, from_name, subject, snippet, body_text, date, direction')
    .or(`from_email.ilike.${emailLower},to_recipients.cs.[{"email":"${emailLower}"}],cc_recipients.cs.[{"email":"${emailLower}"}]`)
    .order('date', { ascending: false })
    .limit(20);

  const { data: participants } = await supabase
    .from('email_participants')
    .select('email_id, participant_type, emails(email_id, subject, body_text, date, direction, email_threads(subject))')
    .ilike('email', emailLower)
    .limit(20);

  const { data: contactEmails } = await supabase
    .from('contact_emails')
    .select('contact_id')
    .ilike('email', emailLower)
    .limit(1);

  let interactions = [];
  if (contactEmails?.[0]?.contact_id) {
    const { data: ints } = await supabase
      .from('interactions')
      .select('interaction_type, direction, interaction_date, summary')
      .eq('contact_id', contactEmails[0].contact_id)
      .order('interaction_date', { ascending: false })
      .limit(20);
    interactions = ints || [];
  }

  return {
    inbox_messages: inbox || [],
    email_history: (participants || []).map(p => ({
      subject: p.emails?.subject || p.emails?.email_threads?.subject,
      date: p.emails?.date,
      direction: p.emails?.direction,
      body_preview: (p.emails?.body_text || '').substring(0, 300),
      role: p.participant_type,
    })),
    interactions,
  };
}

// ============ FETCH WEBPAGE ============

export async function fetchWebpage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM-Agent/1.0)' },
    });
    clearTimeout(timeout);
    const html = await resp.text();
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
    return { url, text };
  } catch (err) {
    return { error: err.message };
  }
}

// ============ UPDATE CONTACT FIELDS (only NULL/empty) ============

export async function updateContactFields(contactId, fields) {
  // Read current contact to only update empty fields
  const { data: current, error: readErr } = await supabase
    .from('contacts')
    .select('first_name, last_name, job_role, linkedin, description, birthday, profile_image_url')
    .eq('contact_id', contactId)
    .single();

  if (readErr) return { error: readErr.message };

  const updates = {};
  if (fields.last_name && !current.last_name) updates.last_name = fields.last_name;
  if (fields.job_role && !current.job_role) updates.job_role = fields.job_role;
  if (fields.linkedin && !current.linkedin) updates.linkedin = fields.linkedin;
  if (fields.description && !current.description) updates.description = fields.description;
  if (fields.birthday && !current.birthday) updates.birthday = fields.birthday;

  if (Object.keys(updates).length === 0) {
    return { updated: [], message: 'All fields already populated' };
  }

  updates.last_modified_by = 'LLM';
  updates.last_modified_at = new Date().toISOString();

  const { error } = await supabase.from('contacts').update(updates).eq('contact_id', contactId);
  if (error) return { error: error.message };

  return { updated: Object.keys(updates).filter(k => k !== 'last_modified_by' && k !== 'last_modified_at') };
}

// ============ FIND OR CREATE COMPANY ============

export async function findOrCreateCompany(contactId, { domain, name, website, description, linkedin, relationship }) {
  let companyId = null;
  let companyName = null;

  // Search by domain
  if (domain) {
    const { data: domainMatch } = await supabase
      .from('company_domains')
      .select('company_id, companies(company_id, name)')
      .ilike('domain', domain)
      .limit(1)
      .maybeSingle();
    if (domainMatch?.companies) {
      companyId = domainMatch.companies.company_id;
      companyName = domainMatch.companies.name;
    }
  }

  // Search by name
  if (!companyId && name) {
    const { data: nameMatch } = await supabase
      .from('companies')
      .select('company_id, name')
      .ilike('name', name)
      .limit(1)
      .maybeSingle();
    if (nameMatch) {
      companyId = nameMatch.company_id;
      companyName = nameMatch.name;
    }
  }

  // Update existing company's empty fields
  if (companyId) {
    const { data: existing } = await supabase.from('companies').select('website, description, linkedin').eq('company_id', companyId).single();
    const finalUpdates = {};
    if (!existing?.website && website) finalUpdates.website = website;
    if (!existing?.description && description) finalUpdates.description = description;
    if (!existing?.linkedin && linkedin) finalUpdates.linkedin = linkedin;
    if (Object.keys(finalUpdates).length > 0) {
      await supabase.from('companies').update(finalUpdates).eq('company_id', companyId);
    }
  }

  // Create if not found
  if (!companyId && (name || domain)) {
    const { data: created, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: name || domain,
        website: website || (domain ? `https://${domain}` : null),
        description: description || null,
        linkedin: linkedin || null,
        category: 'Inbox',
        created_by: 'LLM',
      })
      .select()
      .single();
    if (companyError) return { error: companyError.message };
    companyId = created.company_id;
    companyName = created.name;

    if (domain) {
      await supabase.from('company_domains').insert({
        company_id: companyId,
        domain: domain.toLowerCase(),
        is_primary: true,
      });
    }
  }

  // Link to contact (if not already linked)
  if (companyId && contactId) {
    const { data: existingLink } = await supabase
      .from('contact_companies')
      .select('contact_companies_id')
      .eq('contact_id', contactId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!existingLink) {
      await supabase.from('contact_companies').insert({
        contact_id: contactId,
        company_id: companyId,
        relationship: relationship || 'not_set',
        is_primary: true,
      });
    }
  }

  return { company_id: companyId, name: companyName, created: !companyName };
}

// ============ ADD CONTACT DETAILS (phones, city, tags — skips duplicates) ============

export async function addContactDetails(contactId, { phones, city, tags }) {
  const results = { phones: 0, city: null, tags: 0 };

  if (phones?.length) {
    const { data: existingPhones } = await supabase
      .from('contact_mobiles')
      .select('mobile')
      .eq('contact_id', contactId);
    const existingSet = new Set((existingPhones || []).map(p => p.mobile));

    for (const phone of phones) {
      if (!existingSet.has(phone)) {
        await supabase.from('contact_mobiles').insert({
          contact_id: contactId,
          mobile: phone,
          is_primary: results.phones === 0 && existingSet.size === 0,
        });
        results.phones++;
      }
    }
  }

  if (city) {
    const { data: existingCities } = await supabase
      .from('contact_cities')
      .select('city_id')
      .eq('contact_id', contactId);

    if (!existingCities?.length) {
      const { data: cityMatch } = await supabase
        .from('cities')
        .select('city_id, name')
        .ilike('name', `%${city}%`)
        .limit(1)
        .maybeSingle();

      let cityId = cityMatch?.city_id;
      if (!cityId) {
        const { data: newCity } = await supabase
          .from('cities')
          .insert({ name: city })
          .select()
          .single();
        cityId = newCity?.city_id;
      }
      if (cityId) {
        await supabase.from('contact_cities').insert({ contact_id: contactId, city_id: cityId });
        results.city = city;
      }
    }
  }

  if (tags?.length) {
    const { data: existingTags } = await supabase
      .from('contact_tags')
      .select('tag_id')
      .eq('contact_id', contactId);
    const existingTagIds = new Set((existingTags || []).map(t => t.tag_id));

    for (const tagName of tags) {
      const { data: tagMatch } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', tagName)
        .limit(1)
        .maybeSingle();
      if (tagMatch && !existingTagIds.has(tagMatch.tag_id)) {
        await supabase.from('contact_tags').insert({ contact_id: contactId, tag_id: tagMatch.tag_id });
        results.tags++;
      }
    }
  }

  return results;
}

// ============ CREATE CONTACT NOTE ============

export async function createContactNote(contactId, { firstName, lastName, text }) {
  if (!text || text.length < 500) {
    return { error: `Note must be >500 chars. Current: ${(text || '').length} chars.` };
  }

  const noteTitle = `${firstName} ${lastName || ''} — Contact Notes`.replace(/\s+/g, ' ').trim();
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      title: noteTitle,
      text,
      note_type: 'general',
      obsidian_path: `Inbox/${noteTitle}.md`,
      created_by: 'LLM',
    })
    .select()
    .single();

  if (noteError) return { error: noteError.message };

  await supabase.from('notes_contacts').insert({ note_id: note.note_id, contact_id: contactId });
  return { note_id: note.note_id, chars: text.length };
}

// ============ UPLOAD CONTACT PHOTO ============

export async function uploadContactPhoto(contactId, imageUrl) {
  const uploadPhoto = async (url, source) => {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 15000);
    const imgResp = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM-Agent/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(tm);
    if (!imgResp.ok) throw new Error(`${source}: HTTP ${imgResp.status}`);
    const ct = imgResp.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) throw new Error(`${source}: not an image (${ct})`);
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
    const buffer = Buffer.from(await imgResp.arrayBuffer());
    if (buffer.length < 1000) throw new Error(`${source}: image too small (${buffer.length} bytes)`);
    const filePath = `profile-images/${contactId}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, buffer, { contentType: ct, cacheControl: '3600', upsert: true });
    if (upErr) throw new Error(`Storage: ${upErr.message}`);
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    await supabase.from('contacts').update({ profile_image_url: publicUrl }).eq('contact_id', contactId);
    return { success: true, url: publicUrl, source };
  };

  const errors = [];

  // 1. Provided URL
  if (imageUrl) {
    try { return await uploadPhoto(imageUrl, 'provided_url'); } catch (e) { errors.push(e.message); }
  }

  // 2. Gravatar fallback
  try {
    const { data: ce } = await supabase.from('contact_emails').select('email').eq('contact_id', contactId).limit(1).maybeSingle();
    if (ce?.email) {
      const hash = createHash('sha256').update(ce.email.trim().toLowerCase()).digest('hex');
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=400`;
      try { return await uploadPhoto(gravatarUrl, 'gravatar'); } catch (e) { errors.push(e.message); }
    }
  } catch (e) { errors.push(`Gravatar lookup: ${e.message}`); }

  return { error: `All photo sources failed: ${errors.join('; ')}` };
}

// ============ UPLOAD COMPANY LOGO ============

export async function uploadCompanyLogo(companyId, { logoUrl, domain }) {
  const saveLogo = async (url, source) => {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 15000);
    const resp = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CRM-Agent/1.0)' }, redirect: 'follow' });
    clearTimeout(tm);
    if (!resp.ok) throw new Error(`${source}: HTTP ${resp.status}`);
    const ct = resp.headers.get('content-type') || 'image/png';
    if (!ct.startsWith('image/')) throw new Error(`${source}: not an image (${ct})`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.length < 500) throw new Error(`${source}: too small (${buffer.length} bytes)`);
    const ext = ct.includes('svg') ? 'svg' : ct.includes('png') ? 'png' : 'jpg';
    const filePath = `company_logos/${companyId}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('attachments').upload(filePath, buffer, { contentType: ct, upsert: false });
    if (upErr) throw new Error(`Storage: ${upErr.message}`);
    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
    const { data: att } = await supabase.from('attachments').insert({
      file_name: `${companyId}_logo.${ext}`, file_url: filePath, file_type: ct, permanent_url: publicUrl,
    }).select().single();
    await supabase.from('company_attachments').delete().eq('company_id', companyId).eq('is_logo', true);
    await supabase.from('company_attachments').insert({ company_id: companyId, attachment_id: att.attachment_id, is_logo: true });
    return { success: true, url: publicUrl, source };
  };

  const errors = [];
  if (logoUrl) { try { return await saveLogo(logoUrl, 'provided_url'); } catch (e) { errors.push(e.message); } }
  if (domain) { try { return await saveLogo(`https://logo.clearbit.com/${domain}`, 'clearbit'); } catch (e) { errors.push(e.message); } }
  if (domain) { try { return await saveLogo(`https://cdn.brandfetch.io/${domain}/w/400/h/400?c=1id_MlnKYTT`, 'brandfetch'); } catch (e) { errors.push(e.message); } }
  if (domain) { try { return await saveLogo(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`, 'google_favicon'); } catch (e) { errors.push(e.message); } }

  return { error: `All logo sources failed: ${errors.join('; ')}` };
}

// ============ ADD COMPANY TAGS ============

export async function addCompanyTags(companyId, tags) {
  let linked = 0;
  for (const tagName of tags) {
    const { data: tagMatch } = await supabase
      .from('tags')
      .select('tag_id, name')
      .ilike('name', tagName)
      .limit(1)
      .maybeSingle();
    if (tagMatch) {
      const { data: existing } = await supabase
        .from('company_tags')
        .select('entry_id')
        .eq('company_id', companyId)
        .eq('tag_id', tagMatch.tag_id)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabase.from('company_tags').insert({ company_id: companyId, tag_id: tagMatch.tag_id });
        if (!error) linked++;
      }
    }
  }
  return { linked, total_requested: tags.length };
}

// ============ UPDATE COMPANY ============

export async function updateCompany(companyId, fields) {
  const updates = {};
  if (fields.name) updates.name = fields.name;
  if (fields.website) updates.website = fields.website;
  if (fields.description) updates.description = fields.description;
  if (fields.linkedin) updates.linkedin = fields.linkedin;
  if (fields.category) updates.category = fields.category;
  if (Object.keys(updates).length === 0) return { error: 'No fields to update' };
  const { error } = await supabase.from('companies').update(updates).eq('company_id', companyId);
  if (error) return { error: error.message };
  return { success: true, updated_fields: Object.keys(updates) };
}

// ============ BRAVE WEB SEARCH ============

export async function braveWebSearch(query, count = 5) {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!braveKey) return { error: 'BRAVE_SEARCH_API_KEY not configured' };
  try {
    const resp = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${Math.min(count, 20)}`, {
      headers: { 'X-Subscription-Token': braveKey, 'Accept': 'application/json' },
    });
    if (!resp.ok) return { error: `Brave search failed: ${resp.status}` };
    const data = await resp.json();
    return { query, results: (data.web?.results || []).map(r => ({ title: r.title, url: r.url, description: r.description })) };
  } catch (err) {
    return { error: err.message };
  }
}

// ============ LOAD EXISTING CONTACT DATA ============

export async function loadContactData(contactId) {
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('contact_id', contactId)
    .single();

  if (!contact) return null;

  const [emails, companies, tags, cities, notes] = await Promise.all([
    supabase.from('contact_emails').select('email, is_primary').eq('contact_id', contactId).then(r => r.data || []),
    supabase.from('contact_companies').select('company_id, relationship, is_primary, companies(name, website, linkedin, description)').eq('contact_id', contactId).then(r => r.data || []),
    supabase.from('contact_tags').select('tags(name)').eq('contact_id', contactId).then(r => r.data || []),
    supabase.from('contact_cities').select('cities(name)').eq('contact_id', contactId).then(r => r.data || []),
    supabase.from('notes_contacts').select('notes(note_id, text, deleted_at)').eq('contact_id', contactId).then(r => r.data || []),
  ]);

  return {
    ...contact,
    emails,
    companies,
    tags: tags.map(t => t.tags?.name).filter(Boolean),
    cities: cities.map(c => c.cities?.name).filter(Boolean),
    hasGoodNote: notes.some(n => n.notes && !n.notes.deleted_at && (n.notes.text || '').length > 500),
    primaryEmail: emails.find(e => e.is_primary)?.email || emails[0]?.email,
  };
}
