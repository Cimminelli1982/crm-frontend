#!/usr/bin/env node

/**
 * Fill missing ingredient images via Pexels API
 *
 * Usage:
 *   PEXELS_API_KEY=your_key node scripts/fill-ingredient-images.js
 *
 * What it does:
 *   1. Queries ingredients with NULL image_url
 *   2. Searches Pexels for a relevant food photo
 *   3. Downloads & uploads to Supabase Storage
 *   4. Updates ingredients.image_url
 *   5. Fixes missing nutritional values for protein bars
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env from backend/.env ──────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '../backend/.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── Config ──────────────────────────────────────────────────────────────────
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!PEXELS_API_KEY) {
  console.error('ERROR: PEXELS_API_KEY env variable is required.');
  console.error('Get a free key at https://www.pexels.com/api/');
  console.error('Usage: PEXELS_API_KEY=your_key node scripts/fill-ingredient-images.js');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set (loaded from backend/.env)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Name → Pexels search term mapping ───────────────────────────────────────
const SEARCH_TERM_MAP = {
  'Aglio': 'garlic cloves',
  'Baking Powder': 'baking powder jar',
  'Blueberries': 'fresh blueberries bowl',
  'Brodo di verdura fatto in casa': 'vegetable broth soup',
  'Carota': 'fresh carrots',
  'Caster Sugar': 'white sugar bowl',
  'Ceci Belazu': 'canned chickpeas bowl',
  'Chickpea Rice': 'chickpea rice grain',
  'Cipolla cruda': 'raw onion',
  'Dinner out went south': null, // skip - not a real ingredient
  'Fish Fingers': 'fish fingers breaded',
  'Golden Kiwi (SunGold)': 'golden kiwi fruit',
  'Greek Style Natural Yogurt': 'greek yogurt bowl',
  'Green Beans': 'fresh green beans',
  'Hip Pop Pink Grapefruit': 'pink grapefruit drink',
  'Julienne de Legumes (Organic)': 'julienne vegetables mixed',
  'Julienne di Verdure Bio (surgelata)': 'frozen mixed vegetables julienne',
  'Mini carote': 'baby carrots',
  'Natural Almonds': 'raw almonds',
  'Natural Whole Milk Yogurt': 'natural yogurt bowl',
  'Oat Milk': 'oat milk glass',
  'Olio Extravergine di Oliva': 'extra virgin olive oil bottle',
  'Organic Avocado': 'fresh avocado halved',
  'Organic Lamb Leg Steaks': 'lamb leg steak raw',
  'Piselli bolliti': 'boiled green peas',
  'Pomodori Bio Essiccati al Sole in Olio EVO': 'sun dried tomatoes olive oil jar',
  'Protein Bar - Blueberry Pie': 'protein bar snack',
  'Protein Bar - Cake Batter': 'protein bar snack',
  'Protein Bar - Chocolate Chip Cookie Dough': 'chocolate chip protein bar',
  'Protein Bar - Salted Peanut Butter': 'peanut butter protein bar',
  'Real Mayonnaise': 'mayonnaise jar',
  'Scanbran Crackers': 'rye crackers',
  'Senape Dijon': 'dijon mustard jar',
  'Strong White Flour': 'white flour bag',
  'Sweetcorn Cobettes': 'sweetcorn cobs',
  'Tenderstem Broccoli': 'tenderstem broccoli',
  'Toasted Omega 3 Mixed Seeds': 'mixed seeds toasted',
  'Tomatoes': 'fresh red tomatoes',
  'Tomato Ketchup 50% Less Sugar & Salt': 'tomato ketchup bottle',
  'Tortilla Wraps': 'tortilla wraps stack',
  'Unhomogenised Whole Milk': 'whole milk bottle',
  'Zucchina': 'fresh zucchini courgette',
};

// ── Protein bar nutritional fixes ───────────────────────────────────────────
const PROTEIN_BAR_FIXES = {
  'Protein Bar - Blueberry Pie': { fat_per_100g: 5, carbs_per_100g: 15 },
  'Protein Bar - Cake Batter': { fat_per_100g: 5, carbs_per_100g: 14 },
  'Protein Bar - Chocolate Chip Cookie Dough': { fat_per_100g: 5.5, carbs_per_100g: 15 },
  'Protein Bar - Salted Peanut Butter': { fat_per_100g: 7, carbs_per_100g: 12 },
};

// ── Pexels API ──────────────────────────────────────────────────────────────
async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`;
  const res = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY },
  });
  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.photos || data.photos.length === 0) return null;
  // Use medium size (~350px)
  return data.photos[0].src.medium;
}

// ── Download image as buffer ────────────────────────────────────────────────
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Upload to Supabase Storage ──────────────────────────────────────────────
async function uploadToStorage(ingredientId, imageBuffer) {
  const path = `health/ingredients/${ingredientId}_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, imageBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload error: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(path);

  return publicUrl;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Fill Ingredient Images ===\n');

  // 1. Get ingredients without images
  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('id, name, image_url, fat_per_100g, carbs_per_100g')
    .is('image_url', null)
    .order('name');

  if (error) {
    console.error('Failed to query ingredients:', error.message);
    process.exit(1);
  }

  console.log(`Found ${ingredients.length} ingredients without images.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const ingredient of ingredients) {
    const { id, name } = ingredient;

    // Determine search term
    const searchTerm = SEARCH_TERM_MAP.hasOwnProperty(name)
      ? SEARCH_TERM_MAP[name]
      : name; // fallback to original name

    if (searchTerm === null) {
      console.log(`  SKIP: "${name}" (marked as skip)`);
      skipped++;
      continue;
    }

    try {
      // Search Pexels
      console.log(`  Searching: "${name}" → "${searchTerm}"`);
      const imageUrl = await searchPexels(searchTerm);

      if (!imageUrl) {
        console.log(`  WARNING: No Pexels result for "${searchTerm}"`);
        failed++;
        continue;
      }

      // Download image
      const imageBuffer = await downloadImage(imageUrl);
      console.log(`    Downloaded: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

      // Upload to Supabase Storage
      const publicUrl = await uploadToStorage(id, imageBuffer);

      // Update DB
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({ image_url: publicUrl })
        .eq('id', id);

      if (updateError) throw new Error(`DB update error: ${updateError.message}`);

      console.log(`    OK: ${name}`);
      success++;
    } catch (err) {
      console.error(`    FAIL: ${name} — ${err.message}`);
      failed++;
    }

    // Rate limit: 500ms between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. Fix protein bar nutritional values
  console.log('\n--- Fixing protein bar nutritional values ---');
  for (const [name, values] of Object.entries(PROTEIN_BAR_FIXES)) {
    const { error: fixError } = await supabase
      .from('ingredients')
      .update(values)
      .eq('name', name);

    if (fixError) {
      console.error(`  FAIL: ${name} — ${fixError.message}`);
    } else {
      console.log(`  OK: ${name} → fat=${values.fat_per_100g}, carbs=${values.carbs_per_100g}`);
    }
  }

  // 3. Report
  console.log('\n=== Report ===');
  console.log(`  Success: ${success}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Total:   ${ingredients.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
