// netlify/functions/sync-whatsapp-contacts.js

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  // CORS headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    // Debug logging (safe - only shows first few characters)
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseKey)
    console.log('Supabase Key starts with:', supabaseKey?.substring(0, 10) + '...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get parameters from query string
    const params = event.queryStringParameters || {}
    const days = parseInt(params.days || '90')
    const excludeSpam = params.excludeSpam !== 'false' // default true
    
    console.log(`Syncing contacts from last ${days} days, excludeSpam: ${excludeSpam}`)

    // Step 1: Get active WhatsApp numbers
    const whatsappNumbers = await getActiveWhatsAppNumbers(supabase, days, excludeSpam)
    console.log(`Found ${whatsappNumbers.length} unique WhatsApp numbers`)
    
    // Step 2: Get matching contacts from your contacts tables
    const contacts = await getContactsFromSupabase(supabase, whatsappNumbers)
    console.log(`Found ${contacts.length} matching contacts`)
    
    // Step 3: Generate VCF content
    const vcfContent = generateVCF(contacts)
    
    // Return VCF file
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/vcard;charset=utf-8',
        'Content-Disposition': `attachment; filename="whatsapp-contacts-${new Date().toISOString().split('T')[0]}.vcf"`
      },
      body: vcfContent
    }
    
  } catch (error) {
    console.error('Error syncing contacts:', error)
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    }
  }
}

async function getActiveWhatsAppNumbers(supabase, days, excludeSpam) {
  // Calculate the date threshold
  const dateThreshold = new Date()
  dateThreshold.setDate(dateThreshold.getDate() - days)
  
  console.log(`Fetching WhatsApp interactions since: ${dateThreshold.toISOString()}`)
  
  // Query contacts who have WhatsApp interactions within the date range
  // This uses the interactions table that process_whatsapp_message() populates
  let query = supabase
    .from('interactions')
    .select(`
      contact_id,
      contacts!inner(
        contact_id,
        category,
        contact_mobiles!inner(
          mobile
        )
      )
    `)
    .eq('interaction_type', 'whatsapp')
    .gte('interaction_date', dateThreshold.toISOString())
    .not('contact_id', 'is', null)
  
  // Execute query
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching WhatsApp interactions:', error)
    throw error
  }
  
  // Extract unique mobile numbers from the nested structure
  const mobileNumbers = new Set()
  
  data?.forEach(interaction => {
    // Skip if contact is in Skip category
    if (interaction.contacts?.category === 'Skip') {
      return
    }
    
    // Get all mobile numbers for this contact
    interaction.contacts?.contact_mobiles?.forEach(mobile => {
      if (mobile.mobile) {
        mobileNumbers.add(normalizePhoneNumber(mobile.mobile))
      }
    })
  })
  
  const uniqueNumbers = Array.from(mobileNumbers).filter(num => num && num.length > 0)
  
  // If excludeSpam is true, filter out spam numbers
  if (excludeSpam && uniqueNumbers.length > 0) {
    console.log('Filtering out spam numbers...')
    
    // Get all spam numbers
    const { data: spamData, error: spamError } = await supabase
      .from('whatsapp_spam')
      .select('mobile_number')
    
    if (spamError) {
      console.error('Error fetching spam numbers:', spamError)
      // Continue without spam filtering if there's an error
      return uniqueNumbers
    }
    
    const spamNumbers = new Set(
      (spamData || []).map(row => normalizePhoneNumber(row.mobile_number))
    )
    
    const filteredNumbers = uniqueNumbers.filter(num => !spamNumbers.has(num))
    console.log(`Filtered out ${uniqueNumbers.length - filteredNumbers.length} spam numbers`)
    
    return filteredNumbers
  }
  
  return uniqueNumbers
}

function normalizePhoneNumber(phone) {
  if (!phone) return null
  
  // Convert to string and remove all non-numeric characters except +
  let cleaned = String(phone).replace(/[^\d+]/g, '')
  
  // If already has +, keep it
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '')
  
  // Handle common patterns
  if (cleaned.length === 10 && !cleaned.startsWith('1')) {
    // Likely US number without country code
    cleaned = '1' + cleaned
  } else if (cleaned.length === 11 && cleaned.startsWith('44')) {
    // UK number with country code but missing +
    // Already in correct format
  } else if (cleaned.length === 9 && !cleaned.startsWith('44')) {
    // Possibly UK number without country code
    cleaned = '44' + cleaned
  }
  
  // Ensure it starts with + for international format
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  
  return cleaned
}

async function getContactsFromSupabase(supabase, phoneNumbers) {
  if (!phoneNumbers || phoneNumbers.length === 0) {
    return []
  }
  
  console.log('Querying contacts for phone numbers...')
  
  // Query with joins to get all contact information
  // Batch in groups of 100 to avoid query limits
  const batchSize = 100
  const allContacts = []
  
  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    const batch = phoneNumbers.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('contact_mobiles')
      .select(`
        mobile,
        type,
        is_primary,
        contacts!inner(
          contact_id,
          first_name,
          last_name,
          linkedin,
          category,
          job_role,
          description,
          score,
          keep_in_touch_frequency,
          birthday,
          profile_image_url,
          last_interaction_at
        )
      `)
      .in('mobile', batch)
    
    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }
    
    // Transform the nested structure
    data?.forEach(mobileRecord => {
      const contactInfo = mobileRecord.contacts
      if (contactInfo) {
        allContacts.push({
          ...contactInfo,
          phone_number: mobileRecord.mobile,
          phone_type: mobileRecord.type || 'personal',
          is_primary_phone: mobileRecord.is_primary || false
        })
      }
    })
  }
  
  // Remove duplicates (same contact might have multiple phones)
  // Keep the primary phone if multiple exist
  const contactMap = new Map()
  
  allContacts.forEach(contact => {
    const key = contact.contact_id
    const existing = contactMap.get(key)
    
    // If no existing or this is primary phone, use this one
    if (!existing || contact.is_primary_phone) {
      contactMap.set(key, contact)
    }
  })
  
  return Array.from(contactMap.values())
}

function generateVCF(contacts) {
  let vcf = ''
  
  contacts.forEach(contact => {
    vcf += 'BEGIN:VCARD\n'
    vcf += 'VERSION:3.0\n'
    
    // Name fields
    const firstName = (contact.first_name || '').trim()
    const lastName = (contact.last_name || '').trim()
    const fullName = `${firstName} ${lastName}`.trim()
    
    vcf += `FN:${fullName || 'Unknown'}\n`
    vcf += `N:${lastName};${firstName};;;\n`
    
    // Phone number
    if (contact.phone_number) {
      const phoneType = contact.phone_type === 'work' ? 'WORK' : 'CELL'
      vcf += `TEL;TYPE=${phoneType}:${contact.phone_number}\n`
    }
    
    // LinkedIn (as URL)
    if (contact.linkedin) {
      const linkedinUrl = contact.linkedin.includes('http') 
        ? contact.linkedin 
        : `https://linkedin.com/in/${contact.linkedin}`
      vcf += `URL;type=LinkedIn:${linkedinUrl}\n`
    }
    
    // Job role and organization
    if (contact.job_role) {
      vcf += `TITLE:${contact.job_role}\n`
    }
    
    // Birthday
    if (contact.birthday) {
      // Format: YYYYMMDD
      const bday = new Date(contact.birthday)
      const year = bday.getFullYear()
      const month = String(bday.getMonth() + 1).padStart(2, '0')
      const day = String(bday.getDate()).padStart(2, '0')
      vcf += `BDAY:${year}${month}${day}\n`
    }
    
    // Profile image
    if (contact.profile_image_url) {
      vcf += `PHOTO;VALUE=uri:${contact.profile_image_url}\n`
    }
    
    // Notes - combine various fields
    const notes = []
    if (contact.description) notes.push(`Description: ${contact.description}`)
    if (contact.category && contact.category !== 'Inbox') notes.push(`Category: ${contact.category}`)
    if (contact.score) notes.push(`Score: ${contact.score}`)
    if (contact.keep_in_touch_frequency && contact.keep_in_touch_frequency !== 'Not Set') {
      notes.push(`Keep in touch: ${contact.keep_in_touch_frequency}`)
    }
    if (contact.last_interaction_at) {
      const lastInteraction = new Date(contact.last_interaction_at).toLocaleDateString()
      notes.push(`Last interaction: ${lastInteraction}`)
    }
    
    if (notes.length > 0) {
      const combinedNotes = notes.join('\\n')
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .substring(0, 1000) // Limit notes length
      vcf += `NOTE:${combinedNotes}\n`
    }
    
    // Add REV (revision) timestamp
    vcf += `REV:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\n`
    
    vcf += 'END:VCARD\n\n'
  })
  
  return vcf
}
