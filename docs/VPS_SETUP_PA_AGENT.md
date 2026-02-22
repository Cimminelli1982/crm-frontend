# VPS Setup: nginx WSS Proxy + PA Agent

## 1. nginx Reverse Proxy (WSS on port 8443)

### Install nginx (if not present)
```bash
apt update && apt install -y nginx
```

### Create config
```bash
cat > /etc/nginx/sites-available/openclaw-gateway << 'EOF'
server {
    listen 8443 ssl;
    server_name 5.75.171.198;

    # Self-signed certificate (generate below if not existing)
    ssl_certificate     /etc/nginx/ssl/openclaw.crt;
    ssl_certificate_key /etc/nginx/ssl/openclaw.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        # Disable buffering for streaming
        proxy_buffering off;
    }
}
EOF
```

### Generate self-signed certificate
```bash
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 3650 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/openclaw.key \
  -out /etc/nginx/ssl/openclaw.crt \
  -subj "/CN=5.75.171.198"
```

### Enable site and restart
```bash
ln -sf /etc/nginx/sites-available/openclaw-gateway /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Verify
```bash
# Check nginx is listening on 8443
ss -tlnp | grep 8443

# Test WSS connection (from local machine)
# wscat -c wss://5.75.171.198:8443 --no-check
```

---

## 2. PA Agent Configuration

### Add to openclaw.json
Edit `/root/.openclaw/openclaw.json` and add the PA agent to the `agents` array:

```json
{
  "id": "pa",
  "name": "pa",
  "workspace": "/root/.openclaw/workspace-pa",
  "agentDir": "/root/.openclaw/agents/pa/agent"
}
```

Also add a binding for the PA agent (in the `bindings` array or equivalent config section):
```json
{
  "agentId": "pa",
  "platform": "gateway",
  "config": {}
}
```

### Create workspace and agent directory
```bash
mkdir -p /root/.openclaw/workspace-pa
mkdir -p /root/.openclaw/agents/pa/agent
```

### Create agent config
Create `/root/.openclaw/agents/pa/agent/agent.json` with the PA agent personality and routing rules:

```json
{
  "name": "PA",
  "description": "Personal Assistant — receives CRM requests and routes to Kevin/Clarissa/Lucas as needed",
  "systemPrompt": "You are PA, a Personal Assistant for Simone's CRM. You receive requests from the CRM interface and help with tasks, calendar events, notes, emails, and introductions. When a request requires specialized skills, you can delegate to Kevin (engineering), Clarissa (communications), or Lucas (research). Always be concise and action-oriented.",
  "model": "claude-sonnet-4-20250514",
  "tools": []
}
```

### Restart OpenClaw
```bash
systemctl restart openclaw
# or however the gateway is managed
```

---

## 3. Firewall

Make sure port 8443 is open:
```bash
ufw allow 8443/tcp
```

---

## Verification Checklist

- [ ] `nginx -t` passes
- [ ] Port 8443 is listening (`ss -tlnp | grep 8443`)
- [ ] WSS connection works from browser (check DevTools Network tab)
- [ ] PA agent appears in OpenClaw agent list
- [ ] CRM frontend connects without SSH tunnel
- [ ] Chat messages round-trip correctly
