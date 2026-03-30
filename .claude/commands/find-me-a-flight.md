---
allowed-tools: mcp__flight-search__search_flights, mcp__flight-search__search_calendar, mcp__flight-search__get_reference_data, mcp__flight-search__discover_flights
description: Search flights with natural language and get recommended options
---

Find flights based on the user's request: $ARGUMENTS

## Default assumptions
- **Origin**: London (use "London" not airport codes — the API works better with city names)
- **Passengers**: 1 adult, economy class
- **Language**: User speaks Italian and English — interpret both

## Instructions

1. **Parse the request** — Extract from the natural language:
   - Origin (default: London)
   - Destination
   - Outbound date(s) — if flexible ("7 o 8 ottobre"), search ALL variants
   - Return date(s) — if flexible ("sera dell'8 o il 9"), search ALL variants
   - Time preferences (morning, evening, late night, etc.)
   - Any other constraints (direct flights, budget, airline preference)

2. **Search flights** — Use `search_flights` for each date combination. Run searches in PARALLEL when possible (e.g., outbound Oct 7 + outbound Oct 8 simultaneously). Use `date_flexibility: 0` unless the user explicitly wants nearby dates.

3. **Present results** — Format as a clear, ranked list. YOUR recommendation first (best balance of price, timing, and user preferences).

For each option show:
```
#1 ⭐ RECOMMENDED
✈️  Ryanair FR1234
🕐  07:15 LTN → 10:30 TRN (2h 15m, direct)
💰  £45
🔗  [Book on Ryanair](link) | [Google Flights](link)
```

Group results:
- **OUTBOUND** options (ranked)
- **RETURN** options (ranked)
- **BEST COMBO** — your recommended outbound + return pairing with total price

## Ranking criteria (in order)
1. Matches user's time preferences (e.g., "mattina presto" = earliest departure wins)
2. Direct flights over connections
3. Total travel time (shorter is better)
4. Price (cheaper is better, but not at the cost of terrible times)
5. Airport convenience (LTN/STN preferred over LHR for budget, LHR for long-haul)

## Tips
- If the user says a city name, use it directly in search (don't convert to IATA codes)
- If you need IATA codes for `search_calendar`, use `get_reference_data` first
- For flexible dates, `search_calendar` can show cheapest days in a month
- Always mention if a flight arrives next day (+1)
