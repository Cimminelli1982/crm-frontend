---
allowed-tools: Bash, AskUserQuestion
description: Send a payment via Wise Business API
---

# Pay Someone via Wise

Send a GBP bank transfer using the Wise Business API (personal API token).

## Input

$ARGUMENTS — payment details in any format, e.g.:
- `/pay-someone £100 to John Smith, sort code 04-00-75, account 37778842, ref "Invoice 123"`
- `/pay-someone` (no args — will ask for everything)

## Step 1: Parse & Collect Info

Extract from $ARGUMENTS (if provided):
- **Amount** (GBP)
- **Recipient name** (full name)
- **Sort code** (6 digits, dashes optional)
- **Account number** (8 digits)
- **Reference** (what appears on bank statement)

If ANY of these are missing, use `AskUserQuestion` to ask for the missing ones. Structure:

```json
{
  "questions": [
    {
      "question": "How much do you want to send (GBP)?",
      "header": "Amount",
      "multiSelect": false,
      "options": [
        { "label": "£50", "description": "50 GBP" },
        { "label": "£100", "description": "100 GBP" },
        { "label": "£500", "description": "500 GBP" },
        { "label": "£1000", "description": "1000 GBP" }
      ]
    }
  ]
}
```

For name, sort code, account number, and reference — use AskUserQuestion with sensible options or let user type via "Other".

## Step 2: Read API Key

```bash
WISE_API_KEY=$(cat ~/.config/wise/api-key)
```

If the file doesn't exist, tell the user to run:
```
echo "YOUR_KEY" > ~/.config/wise/api-key && chmod 600 ~/.config/wise/api-key
```

## Step 3: Profile & Balance IDs (hardcoded)

- **Business Profile ID**: `15865996`
- **GBP Balance ID**: `13778903`

No need to fetch these — they're fixed.

## Step 4: Create Quote

```bash
curl -s -X POST https://api.wise.com/v3/profiles/{PROFILE_ID}/quotes \
  -H "Authorization: Bearer $WISE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCurrency": "GBP",
    "targetCurrency": "GBP",
    "sourceAmount": {AMOUNT},
    "targetAmount": null
  }'
```

Extract `id` (quote UUID) and `fee` from the response.

## Step 5: Create Recipient

Clean sort code (remove dashes/spaces → 6 digits only).

```bash
curl -s -X POST https://api.wise.com/v1/accounts \
  -H "Authorization: Bearer $WISE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "GBP",
    "type": "sort_code",
    "profile": {PROFILE_ID},
    "ownedByCustomer": false,
    "accountHolderName": "{RECIPIENT_NAME}",
    "details": {
      "legalType": "PRIVATE",
      "sortCode": "{SORT_CODE}",
      "accountNumber": "{ACCOUNT_NUMBER}"
    }
  }'
```

Extract `id` (recipient/target account ID).

## Step 6: Show Summary & Ask Confirmation

Before creating the transfer, show a clear summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WISE PAYMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  To:        John Smith
  Sort code: 04-00-75
  Account:   37778842
  Amount:    £100.00
  Fee:       £0.56
  Total:     £100.56
  Reference: Invoice 123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then use `AskUserQuestion`:
```json
{
  "questions": [
    {
      "question": "Confirm this payment?",
      "header": "Confirm",
      "multiSelect": false,
      "options": [
        { "label": "Yes, send it", "description": "Create and fund the transfer" },
        { "label": "Cancel", "description": "Abort the payment" }
      ]
    }
  ]
}
```

If cancelled, stop and say "Payment cancelled."

## Step 7: Create Transfer

Generate a UUID for idempotency:
```bash
IDEMPOTENCY_UUID=$(python3 -c "import uuid; print(uuid.uuid4())")
```

```bash
curl -s -X POST https://api.wise.com/v1/transfers \
  -H "Authorization: Bearer $WISE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccount": 13778903,
    "targetAccount": {RECIPIENT_ID},
    "quoteUuid": "{QUOTE_UUID}",
    "customerTransactionId": "{IDEMPOTENCY_UUID}",
    "details": {
      "reference": "{REFERENCE}"
    }
  }'
```

Extract `id` (transfer ID) and `status`.

## Step 8: Fund from Balance

```bash
curl -s -X POST \
  https://api.wise.com/v3/profiles/{PROFILE_ID}/transfers/{TRANSFER_ID}/payments \
  -H "Authorization: Bearer $WISE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "BALANCE"}'
```

Check response:
- `status: "COMPLETED"` → Success! Show "Payment sent successfully"
- `status: "REJECTED"` with `errorCode: "transfer.insufficient_funds"` → Tell user "Insufficient funds in Wise balance"
- Other errors → Show the error

## Step 9: Final Output

On success:
```
✅ Payment sent!
   £{AMOUNT} → {RECIPIENT_NAME}
   Transfer ID: {TRANSFER_ID}
   Status: Processing
   Reference: {REFERENCE}
```

## Rules

- NEVER log or save the API key anywhere
- ALWAYS ask for confirmation before funding
- ALWAYS show fee + total before confirming
- Clean sort code: remove dashes and spaces, must be 6 digits
- Clean account number: remove spaces, must be 8 digits
- If any API call fails, show the error and stop — do NOT continue to the next step
- Currency is always GBP → GBP (same currency transfer)
- If the funding step fails with a PSD2/SCA error, inform the user they may need to fund manually from the Wise dashboard
