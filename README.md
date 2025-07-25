<p align="center">
  <img src="td.vue/src/assets/kademos_logo_simple.svg" width="180" alt="Kademos Custom Dragon Logo"/>
</p>

# Kademos Custom Dragon

Kademos Custom Dragon is **Kademos’ internal fork** of the excellent open-source project [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/).  
It provides the same approachable threat-modelling workflow while adding automation, tighter DevSecOps integration, and a refreshed brand experience for our engineering teams.

> **Attribution**  
> Built on top of OWASP Threat Dragon © OWASP Foundation (Apache-2.0).  
> This fork is **not** an official contribution back to the OWASP project.

---

## ✨ Why This Fork?

| Theme | What we changed |
|-------|-----------------|
| Simplicity | Guided 4-step workflow & corporate styling |
| Automation | One-click Jira ticket creation, Mermaid text-to-diagram parser |
| Accuracy | Enhanced rule engine with 20+ Kademos-specific STRIDE rules |
| Integrations | Secure API endpoints for Jira Cloud & future Guardian-AI services |
| Deployability | Single Docker image; environment-driven config |

---

## 🚀 Key Custom Features

1. **Branded UI / UX**
   * Kademos colours, fonts & golden-tree logo
   * “New Threat Model” page now offers architecture templates (micro-service, 3-tier web, …)
   * Shostack-inspired tabs: *Create Diagram → Identify Threats → Mitigate → Report*

2. **Jira Cloud Integration**
   * `POST /api/jira/create-ticket` creates a richly-formatted security issue
   * Maps STRIDE → labels, severity → priority
   * Front-end button inside each Threat dialog

3. **Text-to-Diagram (Mermaid)**
   * Write simple `flowchart LR` syntax – get a full DFD with nodes/flows positioned
   * Live preview powered by **mermaid.js**

4. **Enhanced Threat Rule Engine**
   * Supplementary rules (`enhanced-generic.json`) detect:
     * Unencrypted public flows
     * Service-to-service auth gaps
     * CSRF, IDOR, excess privileges, & more
   * API: `POST /api/threats/analyze`

5. **Container-first Deployment**
   * `Dockerfile.custom` – multi-stage build, 45 MB final image
   * `.env`‐driven secrets (Jira token, template directory, feature flags)

---

## 🛠️ Quick Start

### Local Dev

```bash
git clone git@github.com:kademos/custom-threat-dragon.git
cd custom-threat-dragon
cp .env.custom .env        # fill in Jira_* vars
npm install                # installs root + workspaces
npm run dev:server         # http://localhost:3000
npm run dev:vue            # http://localhost:8080
```

### Docker

```bash
docker build -f Dockerfile.custom -t kademos/custom-dragon .
docker run -d --name custom-dragon \
  --env-file .env \
  -p 3000:3000 kademos/custom-dragon
```

---

## ⚙️ Environment Variables

| Variable | Purpose |
|----------|---------|
| `JIRA_BASE_URL` | `https://<org>.atlassian.net` |
| `JIRA_EMAIL` / `JIRA_API_TOKEN` | Auth for Jira REST |
| `JIRA_PROJECT_KEY` | Default project for tickets |
| `ENHANCED_RULES_ENABLED` | `true`/`false` toggle |
| `TEMPLATES_DIRECTORY` | Folder of JSON templates |

---

## 📂 Project Structure (Monorepo)

```
custom-threat-dragon/
├─ td.server/   # Node/Express API & rule engine
└─ td.vue/      # Vue 2 UI (BootstrapVue)
```

---

## 📝 Licence

This fork remains under the **Apache-2.0 licence** of the upstream project.  
All additional Kademos-authored files are contributed under the same licence unless specified otherwise.

---

### 🙏 Acknowledgements

Huge thanks to the [OWASP Threat Dragon](https://github.com/OWASP/threat-dragon) maintainers and community for providing a robust foundation on which Kademos builds its internal security tooling.
