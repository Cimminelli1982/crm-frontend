# OpenClaw Agents & Models Configuration

Server: `209.97.183.72` (openclaw-production)

## Architecture Overview

OpenClaw runs as a **systemd service** under user `openclaw`:

```
User=openclaw
HOME=/home/openclaw
Config: /home/openclaw/.openclaw/openclaw.json
EnvironmentFile: /opt/openclaw.env
```

**CRITICAL**: The gateway runs as user `openclaw`, NOT `root`. All config paths resolve relative to `/home/openclaw/`, not `/root/`. The CLI run as root reads `/root/.openclaw/openclaw.json` — a completely different file. Always edit the correct one.

## File Locations (gateway perspective)

| What | Path |
|---|---|
| Main config | `/home/openclaw/.openclaw/openclaw.json` |
| Environment vars | `/opt/openclaw.env` |
| Main agent auth | `/home/openclaw/.openclaw/agents/main/agent/auth-profiles.json` |
| Per-agent auth | `/home/openclaw/.openclaw/agents/<id>/agent/auth-profiles.json` |
| Per-agent sessions | `/home/openclaw/.openclaw/agents/<id>/sessions/` |
| Agent workspace | `/home/openclaw/.openclaw/workspace-<name>/` |
| Systemd service | `/etc/systemd/system/openclaw.service` |

**Root CLI files** (`/root/.openclaw/`) are separate and NOT read by the gateway.

## Config Structure (openclaw.json)

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-haiku-4-5-20251001"
      }
    },
    "list": [
      {
        "id": "main"
      },
      {
        "id": "salvatore",
        "name": "salvatore",
        "workspace": "/home/openclaw/.openclaw/workspace-salvatore",
        "agentDir": "/home/openclaw/.openclaw/agents/salvatore/agent",
        "model": "anthropic/claude-opus-4-6"
      }
    ]
  },
  "bindings": [
    {
      "agentId": "salvatore",
      "match": {
        "channel": "slack",
        "accountId": "salvatore"
      }
    }
  ]
}
```

Key fields:
- `agents.defaults.model.primary` — default model for all agents
- `agents.list[].model` — per-agent model override
- `agents.list[].agentDir` — where auth-profiles.json lives for that agent
- `bindings` — routes Slack accounts to specific agents

## auth-profiles.json Format

```json
{
  "version": 1,
  "profiles": {
    "anthropic:default": {
      "type": "api_key",
      "provider": "anthropic",
      "key": "sk-ant-api03-..."
    },
    "openai-codex:default": {
      "type": "oauth",
      "provider": "openai-codex",
      "access": "eyJ...",
      "refresh": "rt_...",
      "expires": 1773572118890,
      "accountId": "..."
    }
  },
  "usageStats": {},
  "authOrder": {
    "anthropic": ["anthropic:default"]
  }
}
```

- `type: "api_key"` + `key: "sk-ant-..."` for Anthropic API keys
- `type: "oauth"` for OpenAI Codex (auto-managed via `openclaw onboard`)
- `authOrder` locks which profile is used per provider

## How to Change an Agent's Model

### 1. Edit the config

```bash
ssh root@209.97.183.72

# Edit the GATEWAY config (not /root/.openclaw/)
python3 -c "
import json
with open('/home/openclaw/.openclaw/openclaw.json') as f:
    data = json.load(f)
for agent in data['agents']['list']:
    if agent['id'] == 'AGENT_ID':
        agent['model'] = 'anthropic/claude-opus-4-6'
with open('/home/openclaw/.openclaw/openclaw.json', 'w') as f:
    json.dump(data, f, indent=2)
"
```

### 2. Set up auth credentials

```bash
# Write auth-profiles.json in the agent's dir
AGENT_DIR="/home/openclaw/.openclaw/agents/AGENT_ID/agent"
mkdir -p "$AGENT_DIR"

python3 -c "
import json
data = {
    'version': 1,
    'profiles': {
        'anthropic:default': {
            'type': 'api_key',
            'provider': 'anthropic',
            'key': 'YOUR_API_KEY_HERE'
        }
    },
    'usageStats': {},
    'authOrder': {
        'anthropic': ['anthropic:default']
    }
}
with open('$AGENT_DIR/auth-profiles.json', 'w') as f:
    json.dump(data, f, indent=2)
"

# Fix ownership so the openclaw user can read it
chown -R openclaw:openclaw "$AGENT_DIR"
```

### 3. Restart the gateway

```bash
systemctl restart openclaw
```

### 4. Verify

```bash
# Check startup logs
journalctl -u openclaw --since '10 sec ago' --no-pager

# Check model status (run as root — reads /root/.openclaw/ not gateway config)
# NOTE: this may show different info than what the gateway actually uses
openclaw models status --agent AGENT_ID
```

## Common Pitfalls

### 1. Root vs openclaw user
The `openclaw` CLI run as root reads `/root/.openclaw/openclaw.json`. The gateway systemd service reads `/home/openclaw/.openclaw/openclaw.json`. They are **completely independent files**. Always edit the one under `/home/openclaw/`.

### 2. File permissions
Files under `/root/` are not readable by the `openclaw` user. If `agentDir` points to `/root/...`, the gateway can't read auth-profiles.json. Always use paths under `/home/openclaw/` or ensure permissions with `chmod 755`.

### 3. Auth: no in models list
`openclaw models list --agent X` may show `Auth: no` even when API key auth works. This column may only reflect OAuth status. The key being listed in `openclaw models status --agent X` with the key prefix/suffix is sufficient confirmation.

### 4. Gateway token mismatch
After running `openclaw onboard` as root, the gateway token in `/root/.openclaw/openclaw.json` may differ from the one in `/home/openclaw/.openclaw/openclaw.json`. The `openclaw agent` CLI command may fail with "gateway token mismatch" and fall back to embedded mode — which uses the root config, not the gateway config. Don't trust CLI test results.

### 5. Agent sessions
Old sessions may cache model context. After changing models, the agent picks up the new model on new sessions. Existing Slack conversations continue with the new model automatically (no session reset needed, but the agent may "remember" old context from compaction).

## Useful Commands

```bash
# Gateway status
openclaw health

# List agents
openclaw agents list

# Check bindings (Slack → agent routing)
openclaw agents bindings

# Restart gateway
systemctl restart openclaw

# Gateway logs (live)
journalctl -u openclaw -f

# Recent logs
journalctl -u openclaw --since '5 min ago' --no-pager

# Check model for an agent (reads ROOT config, not gateway)
openclaw models status --agent salvatore

# List sessions
openclaw sessions --agent salvatore
```

## Current Setup (2026-03-11)

| Agent | Model | Slack Account | API Key |
|---|---|---|---|
| main (Barbara) | anthropic/claude-haiku-4-5-20251001 | default | Global ANTHROPIC_API_KEY from /opt/openclaw.env |
| salvatore | anthropic/claude-opus-4-6 | salvatore | Dedicated key in agent auth-profiles.json |
| receptionist | (default) | receptionist | (default) |
