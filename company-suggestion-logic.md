# Company Suggestion Logic Analysis

## Existing ContactsList Logic (Reverse Engineering)

The current system in ContactsList works like this:

1. **For each contact WITHOUT a company:**
   - Extract email domain from `contact_emails` table
   - Filter out generic domains (gmail, outlook, etc.)

2. **Smart Domain Matching (4 steps):**
   - **Step 1:** Exact domain match in `company_domains` table
   - **Step 2:** If multiple companies share domain, use intelligent scoring
   - **Step 3:** Domain variant matching (equinox.com → equinox.it, equinox.co.uk)
   - **Step 4:** Suggest creating new company if no match

3. **Intelligent Scoring Factors:**
   - Primary domain gets higher score
   - Company name similarity to contact name
   - Category preferences (Corporate > others)
   - Domain relevance

## Adaptation for CompanyDetailPage

**Goal:** Show contacts that should be associated with THIS specific company

**Logic:**
1. Get THIS company's domains from `company_domains`
2. Find contacts with emails matching these domains
3. Exclude contacts already associated with this company
4. Use existing ContactsList component (which will show smart suggestions)

**Key Difference:**
- ContactsList: "What company should this contact be associated with?"
- CompanyDetailPage: "What contacts should be associated with this company?"