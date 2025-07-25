# Dependency Guide for Custom Threat Dragon

This document lists **all new dependencies** required to implement the custom features described in the requirements (UI/UX templates, Jira Integration, Automated Mermaid DFD generation, Enhanced Threat Rules).  
Each section explains why the package is needed, where it is used, and how to install and configure it.

---

## 1. Project Structure Recap

```
custom_dragon/
├── package.json          # root scripts
├── td.server/            # Node/Express backend
└── td.vue/               # Vue 2 front-end (BootstrapVue)
```

Root scripts delegate to each workspace, so you **install packages in the directory where they are used**.

---

## 2. Backend Dependencies (`td.server`)

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | `^1.x`  | HTTP client for calling Atlassian Jira Cloud REST API |
| `express-validator` | `^7.x` | Validate & sanitise incoming API requests (`/api/jira/create-ticket`) |
| `dotenv` | `^16.x` | Load environment variables from `.env` (already present in base Threat Dragon but list for completeness) |

### 2.1 Installation Commands

From repository root:

```bash
cd td.server
npm install axios express-validator dotenv --save
```

> The root `postinstall` script automatically runs `npm install` in `td.server` and `td.vue`, so you may also add the dependencies to `td.server/package.json` first and let the script handle installation.

### 2.2 Configuration

1. **Environment variables** – add/update the following in `.env` (never commit real secrets):

   ```
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-jira-api-token
   JIRA_PROJECT_KEY=KEY
   ```

2. **Server wiring** – `td.server/src/controllers/jiraController.js` and `td.server/src/routes/jiraRoutes.js` require these vars.  
   Ensure `dotenv.config()` is called early in `td.server/server.js` (Threat Dragon already does this).

---

## 3. Front-End Dependencies (`td.vue`)

| Package | Version | Purpose |
|---------|---------|---------|
| `mermaid` | `^10.x` | Render live Mermaid diagrams and validate syntax in **TextToDiagram.vue** |
| `axios`   | `^1.x`  | Client-side HTTP calls to `/api/jira/*` endpoints (already a transitive dep, but list explicitly) |
| `@fortawesome/fontawesome-free` | `^6.x` | Icons used in new components (ticket, spinner, etc.)—Threat Dragon already bundles some FA icons but upgrading ensures full set |

### 3.1 Installation Commands

```bash
cd td.vue
npm install mermaid axios @fortawesome/fontawesome-free --save
```

### 3.2 Configuration

1. **Global import of Font Awesome** (if not already): in `td.vue/src/main.js`

   ```js
   import '@fortawesome/fontawesome-free/css/all.css';
   ```

2. **Mermaid Initialisation** occurs inside `TextToDiagram.vue`; no extra global config required.

---

## 4. Root-Level Dev Dependencies (optional)

| Package | Purpose |
|---------|---------|
| `npm-run-all` | Already present – orchestrates root scripts |
| `rimraf` | Already present – cleans node_modules |

_No additional root-level dev dependencies are required for these features._

---

## 5. Docker / CI Considerations

* The custom **Dockerfile.custom** stage runs:

  ```dockerfile
  RUN cd td.vue && npm install mermaid --save
  RUN cd td.server && npm install axios express-validator --save
  ```

  If you add extra packages, replicate the pattern.

* Ensure your CI/CD pipeline sets `JIRA_*` environment variables as masked secrets.

---

## 6. Verification Checklist

1. `npm run dev:server` starts without **MODULE_NOT_FOUND** errors.  
2. `npm run dev:vue` hot-reloads after importing `mermaid` successfully.  
3. Hitting `GET /api/jira/health` returns `{ status: "configured" }`.  
4. Clicking **Create Jira Ticket** opens a ticket and displays the ID.  
5. **Text-to-Diagram** renders Mermaid preview and injects a JSON model.

If all the above pass, your dependency setup is complete. 🎉
