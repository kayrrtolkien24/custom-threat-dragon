# Custom Threat Dragon – Custom Features Guide

Welcome to **Custom Threat Dragon** – our streamlined, integrated fork of OWASP Threat Dragon.  
This document explains every custom feature we added, how to configure them, and how to use them in day-to-day threat-modeling.

---

## 1. Quick Start

### 1.1 Prerequisites
* Node .js ≥ 16 (18 LTS recommended)  
* npm ≥ 8  
* Docker (optional, for container builds)  
* Atlassian Cloud Jira instance (for Module 2)

### 1.2 Clone & Install

```bash
git clone <your repo url> custom_dragon
cd custom_dragon
npm install          # installs root deps plus td.server & td.vue
cp .env.custom .env  # then edit .env with real secrets
```

### 1.3 Run Locally

```bash
npm run dev:vue      # front-end dev server (http://localhost:8080)
npm run dev:server   # API server (http://localhost:3000)
```

### 1.4 Run in Docker

```bash
docker build -f Dockerfile.custom -t custom_dragon .
docker run -d --name custom_dragon \
  -p 3000:3000 \
  --env-file .env \
  custom_dragon
```

---

## 2. Environment Variables (`.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | API server port | `3000` |
| `HOST` | Hostname | `0.0.0.0` |
| **Jira integration** |  |  |
| `JIRA_BASE_URL` | Base URL of Jira Cloud | `https://acme.atlassian.net` |
| `JIRA_EMAIL` | Jira account email | `seceng@acme.com` |
| `JIRA_API_TOKEN` | Jira API token | _generate in Atlassian → Account Settings_ |
| `JIRA_PROJECT_KEY` | Default project key | `SEC` |
| **Feature flags** |  |  |
| `ENHANCED_RULES_ENABLED` | Enable Module 4 rules | `true` |
| `TEMPLATES_DIRECTORY` | Location of architecture templates | `./td.vue/src/assets/templates` |

---

## 3. Module 1 – UI/UX Simplification & Templates

### 3.1 Branding

| File | What to edit |
|------|--------------|
| `td.vue/src/assets/logo.svg` | Replace with company logo |
| `td.vue/src/assets/scss/_variables.scss` | Corporate colours |
| `td.vue/src/assets/scss/app.scss` | Global font stack |

### 3.2 Guided Workflow

* The **Threat Model** view now displays four clear tabs:  
  1. _Create Diagram_  
  2. _Identify Threats_ (auto-analysis runs on entry)  
  3. _Define Mitigations_  
  4. _Review Report_

Developers can walk left-to-right through Shostack’s four questions with no extra clicks.

### 3.3 Architecture Templates

Templates live in `td.vue/src/assets/templates/`.

Current shipped templates:
* `microservice-template.json`
* `web-app-template.json`

On **Dashboard → New Threat Model** the user chooses **Blank** or a **Template** drop-down. The chosen JSON loads straight into the diagram editor.

To add templates, drop another valid Threat Dragon JSON file in that directory; the UI lists it automatically.

---

## 4. Module 2 – Jira Integration

### 4.1 Overview
Create Jira tickets directly from any identified threat in one click.

### 4.2 Backend

* Endpoint: `POST /api/jira/create-ticket`
* Code: `td.server/src/controllers/jiraController.js`
* Validation: performed via `express-validator`
* Health check: `GET /api/jira/health`

Authentication uses **Basic Auth** header built from `JIRA_EMAIL:JIRA_API_TOKEN`.

### 4.3 Frontend

Component: `td.vue/src/components/JiraIntegration.vue`

It renders a **Create Jira Ticket** button beside each threat in the threats list:
1. Click → shows spinner while `/api/jira/create-ticket` is called.
2. On success → green alert with the new ticket ID hyper-linked.
3. Errors surface in a red dismissible alert.

### 4.4 Mappings

| Threat Field | Jira Field |
|--------------|-----------|
| `title` | Summary (`[Security] <title>`) |
| `description`, `mitigation`, STRIDE, model & diagram names | Rich-text description |
| STRIDE | automatically added to `labels` |
| Severity (High/Medium/Low) | Jira Priority (1/2/3) |

---

## 5. Module 3 – Automated DFD Generation (Text-to-Diagram)

### 5.1 Component

`td.vue/src/components/TextToDiagram.vue`

* Large textarea for Mermaid **flowchart** syntax.
* Live preview rendered with Mermaid.
* **Generate Diagram** → parses the text and emits a full Threat Dragon diagram JSON which replaces the current canvas.

### 5.2 Supported Mermaid Syntax

| Symbol | Threat Dragon Type | Example |
|--------|-------------------|---------|
| `[Text]` | `tm.Actor` | `user[User]` |
| `(Text)` | `tm.Process` | `app(Web Server)` |
| `[(Text)]` | `tm.Store` | `db[(Database)]` |
| `A --> B` | `tm.Flow` | `user --> app` |
| `A -->\|Label\| B` | Labeled flow | `app -->|Query| db` |

Only `flowchart` diagrams are supported in V1.

### 5.3 Example

```
flowchart LR
  user[User] -->|HTTP| web(Web Server)
  web --> db[(Database)]
```

Click **Generate Diagram** to instantly build a Threat Dragon model with positioned nodes and flows.

---

## 6. Module 4 – Enhanced Threat Rules Engine

### 6.1 Location & Activation

* Rules file: `td.server/src/threats/rules/enhanced-generic.json`  
* Flag: `ENHANCED_RULES_ENABLED=true`

On model analysis, the new rule set checks for:

* Unencrypted public flows  
* Inter-service auth gaps  
* Broken auth, CSRF, IDOR, excessive permissions  
* Secrets in config, missing rate-limiting, insecure uploads, more…

### 6.2 Rule DSL Extensions

We extended the rules engine with helper conditions (documented inline):

```
isPublicNetwork, connects(a,b), hasProperty(key,value),
isWebApplication, isAPI, isOutOfScope, ...
```

These appear in `matches` expressions, e.g.:

```
"matches": ["and(isFlow, isPublicNetwork, not(isEncrypted))"]
```

---

## 7. Logging & Troubleshooting

| Component | Where to look |
|-----------|---------------|
| Server errors | `td.server/logs/*.log` (winston) |
| Front-end | Browser dev-tools console |
| Jira integration | API response in server log; client alert shows message |
| Text-to-Diagram | Red error alert under textarea |

---

## 8. Upgrading & Adding Features

* **Add a new template** → drop JSON in `templates` directory.  
* **Add threat rules** → extend `enhanced-generic.json`; restart server.  
* **Add a new external tracker** → create a controller & route mirroring `jiraController.js`, then embed a new Vue component.

---

### Appendix A – Full Docker Workflow

```bash
# Build
docker build -f Dockerfile.custom -t custom_dragon:latest .

# Run with environment file
docker run --rm -d \
  --env-file .env \
  -p 3000:3000 \
  custom_dragon:latest
```

---

Happy threat-modeling!  
For questions or improvements, open an internal ticket in the **Security Engineering** Jira project.
