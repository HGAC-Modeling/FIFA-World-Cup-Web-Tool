# H-GAC FIFA 2026 Transportation Planning Web App

A **static web application** for the Houston-Galveston Area Council (H-GAC) FIFA World Cup 2026 transportation planning workflow. It supports demand and supply scenario inputs, model scenario visualization, prior/post event analysis, and stakeholder game-plan navigation.

- **No build step** — pages are plain HTML/CSS/JavaScript served as static files.
- **No server-side code** — all logic runs in the browser; data is loaded from static files under `fifaweb/data/`.
- **Web root** is the **`fifaweb/`** folder, not the repository root.

---

## Table of contents

- [Application modules](#application-modules)
- [Repository structure](#repository-structure)
- [Technology stack and dependencies](#technology-stack-and-dependencies)
- [Local development](#local-development)
- [Hosting on GitHub Pages](#hosting-on-github-pages)
- [Hosting on Azure (Docker container — primary path)](#hosting-on-azure-docker-container--primary-path)
  - [1. How the Dockerfile is wired](#1-how-the-dockerfile-is-wired)
  - [2. Build and run the image locally](#2-build-and-run-the-image-locally)
  - [3. Update the Dockerfile for your environment](#3-update-the-dockerfile-for-your-environment)
  - [4. Push the image to Azure Container Registry (ACR)](#4-push-the-image-to-azure-container-registry-acr)
  - [5. Deploy the container to Azure App Service](#5-deploy-the-container-to-azure-app-service)
  - [6. Alternative — Azure Container Apps](#6-alternative--azure-container-apps)
  - [7. Continuous deployment with GitHub Actions](#7-continuous-deployment-with-github-actions)
  - [8. Updating the running site after a code change](#8-updating-the-running-site-after-a-code-change)
- [Alternative Azure hosting (non-container)](#alternative-azure-hosting-non-container)
  - [Azure Static Web Apps](#azure-static-web-apps)
  - [Azure Storage Static Website](#azure-storage-static-website)
- [Embedded maps (ArcGIS)](#embedded-maps-arcgis-felt-power-bi)
- [Large files and Git LFS](#large-files-and-git-lfs)
- [Configuration reference](#configuration-reference)
- [Contributing](#contributing)

---

## Application modules

| Tab / page | File | Purpose |
|------------|------|---------|
| **Overview** | `fifaweb/index.html` | Landing page with navigation cards into major modules |
| **Prior Events Analysis** | `fifaweb/big-data-analysis.html` | Historical NRG/event maps (Felt embeds), OD chord diagrams, arrival/departure profiles |
| **Demand Inputs** | `fifaweb/demand-scenario.html` | Configure demand scenarios (NRG / Fan Fest, profiles, mode share, TDM, CSV import/export) |
| **Supply Inputs** | `fifaweb/tmp-scenario.html` | Supply-side inputs: roads, transit, parking, TDM, airports, bike network, hotels map |
| **Model Scenarios** | `fifaweb/traffic-analysis-summary.html` | Baseline weekday/weekend outputs, incidents, TDM narrative, transit scenario; hosts the shared mega-menu |
| **Game Plan** | `fifaweb/game-plan.html` | Grid of stakeholder entity cards |
| **Post Event Analysis** | `fifaweb/post-event-analysis.html` | Per-match ArcGIS dashboards with Travel Time / Congestion toggle |

The **Model Scenarios** mega-menu is shared across pages via `fifaweb/js/performance-measures-menu.js`.

---

## Repository structure

This reflects the actual on-disk layout.

```
fifawebapp/                                # ← Git repository root
├── README.md                              # This file
├── Dockerfile                             # nginx container build (see Azure Option C)
│
└── fifaweb/                               # ★ Application root — host THIS folder
    │
    ├── index.html                         # Overview (default entry)
    ├── big-data-analysis.html             # Prior Events Analysis
    ├── demand-scenario.html               # Demand Inputs
    ├── tmp-scenario.html                  # Supply Inputs
    ├── traffic-analysis-summary.html      # Model Scenarios
    ├── game-plan.html                     # Game Plan
    ├── post-event-analysis.html           # Post Event Analysis
    │
    ├── .vscode/
    │   └── settings.json                  # Editor settings (not required at runtime)
    │
    ├── css/
    │   ├── styles.css                     # Global layout, cards, maps, TDM, model scenario panels
    │   └── leaflet.css                    # Leaflet map styling
    │
    ├── js/
    │   ├── performance-measures-menu.js   # Shared Model Scenarios mega-menu (loaded on most pages)
    │   ├── main.js                        # Overview page helpers
    │   ├── big-data-analysis.js           # Prior Events charts + map switching
    │   ├── demand-scenario.js             # Demand Inputs state + import/export
    │   ├── tmp-scenario.js                # Supply Inputs (Leaflet maps, hotels, transit)
    │   ├── traffic-analysis-summary.js    # Route/OD helpers (most logic is inline in the HTML)
    │   └── post-event-analysis.js         # Post Event map URL dictionary + tab state
    │
    ├── assets/                            # App images (logos, illustrations)
    │   ├── FIFA.png
    │   └── Fanfest Parking Map.png
    │   # (header HTML also references wc_logo 2.png and image 2023.png — keep these here)
    │
    ├── data/                              # Static data consumed by the app
    │   ├── baseline_weekday/              # WC trip flow, bottlenecks, corridor volume, route travel time
    │   │   ├── WC_trip_flow_pattern/
    │   │   ├── bottlenecks/
    │   │   ├── corridor_volume/
    │   │   └── route_travel_time/
    │   ├── baseline_weekend/              # Same structure as baseline_weekday
    │   ├── TDM Scenario/                  # TDM maps, OD travel time, baseline vs TDM
    │   ├── incident_scenario/             # Incident scenario 
    │   ├── priorEvents/                   # Prior event CSVs (Trip, percent, profile, special event)
    │   │   ├── arrivalDeparture/
    │   │   └── OD_Hourly_Flows/
    │   ├── Preloaded Demand Scenarios/    # baseline_weekday.csv / baseline_weekend.csv
    │   ├── arrivalDeparture/              # Working copies of arrival/departure CSVs
    │   ├── OD_Hourly_Flows/               # Working copies of OD hourly CSVs
    │   ├── OD_routes/                     # unique_priority_routes.geojson
    │   ├── performance measure/           # scenario route performance + ridership CSV/GeoJSON


```

### Things to be aware of

- **`fifaweb/` is the web root.** All page links use relative paths like `css/styles.css`, `js/main.js`, `data/...`. Anything that publishes the repository root instead of `fifaweb/` will produce 404s.
- **External libraries** (`d3.v7.min.js`, `leaflet.js`) are referenced from `fifaweb/js/`. If they are not committed in your branch, fetch them from official sources (see [Dependencies](#technology-stack-and-dependencies)) and place them in `fifaweb/js/` before deploying.
- **Folder names with spaces** exist (e.g., `data/TDM Scenario`, `data/Preloaded Demand Scenarios`). Keep these as-is; the app references them with spaces.
- **`.vscode/` and `specs/`** are developer-facing; safe to deploy but not required at runtime.

---

## Technology stack and dependencies

| Layer | Details |
|-------|---------|
| **UI** | HTML5, CSS3, vanilla JavaScript (no framework) |
| **Charts** | [D3.js v7](https://d3js.org/) → `fifaweb/js/d3.v7.min.js` |
| **Maps** | [Leaflet](https://leafletjs.com/) → `fifaweb/js/leaflet.js` + `fifaweb/css/leaflet.css` |
| **Embedded analytics** | ArcGIS Dashboards / Instant Apps |
| **Data** | Static CSV / GeoJSON / JSON / PNG under `fifaweb/data/`, loaded via `fetch()` |

Where to get vendor files:

- `d3.v7.min.js` → <https://d3js.org/d3.v7.min.js>
- `leaflet.js` and `leaflet.css` → <https://leafletjs.com/download.html>

Place them at:

- `fifaweb/js/d3.v7.min.js`
- `fifaweb/js/leaflet.js`
- `fifaweb/css/leaflet.css` (already present)

---

## Local development

### Option 1 — VS Code Live Server (recommended)

1. Open the **`fifaweb`** folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. URL should look like `http://127.0.0.1:5500/index.html`.


### Option 2 — Node `serve`

```bash
npx serve fifaweb -p 8080
```

> Do **not** open the HTML files directly from disk (`file://`). Browsers will block `fetch()` for local CSVs and many embedded maps will not work.

---

## Hosting on GitHub Pages

GitHub Pages serves the static site. Because the application lives under `fifaweb/`, the simplest reliable approach is **GitHub Actions** that uploads only that folder.

### Step 1 — Add the workflow

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: fifaweb

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 2 — Enable Pages

1. **Settings → Pages**
2. **Source → GitHub Actions**
3. Push to the default branch. The workflow runs and the published URL appears in the run summary.

Site URL pattern: `https://<user-or-org>.github.io/<repo>/index.html`

### Step 3 — Verify

- Open the URL; the Overview page should render with styling and logos.
- Browse each tab; the browser Network tab should not show 404s on `data/...` requests.

---

## Hosting on Azure (Docker container — primary path)

This project ships with a **Dockerfile** that packages the static site into an **nginx** container. That container is the canonical way to host the app on Azure for **any** organization that adopts it — the default uses the public `nginx:alpine` base, so no special registry access is required to build, run, or deploy it.

Below is a complete walk-through for that container path. Two non-container alternatives (Static Web Apps, Storage) are documented later in [Alternative Azure hosting](#alternative-azure-hosting-non-container).

### Prerequisites

- **Azure subscription** with permission to create resources.
- **Azure CLI** — <https://learn.microsoft.com/cli/azure/install-azure-cli>.
- **Docker Desktop** locally (optional — you can also use `az acr build` to build in the cloud).
- A working resource group:

  ```bash
  az login
  az account set --subscription "<your-subscription-name-or-id>"
  az group create --name rg-fifa-webapp --location eastus
  ```

> Replace placeholders such as `<yourorgacr>`, `<unique>`, `<your-subscription...>` with values for your environment. All `azurecr.io` registry names must be **globally unique** and **lowercase alphanumeric**.

### 1. How the Dockerfile is wired

The file at the repository root is intentionally minimal and uses a **public** nginx base so any organization can build it without access to a private registry:

```dockerfile
FROM nginx:alpine
COPY /fifaweb /usr/share/nginx/html/
```

What it does:

| Line | Purpose |
|------|---------|
| `FROM nginx:alpine` | Pulls the official lightweight nginx image from Docker Hub. Works from any environment with internet access. |
| `COPY /fifaweb /usr/share/nginx/html/` | Copies the **`fifaweb/`** folder into nginx’s default document root so `index.html` becomes the site root and all relative paths (`css/`, `js/`, `data/`, `assets/`) resolve correctly. |

When the container starts, nginx serves `fifaweb/index.html` on port `80`. No build step, no application server, no environment variables required.

> **Note for the Arcadis internal team:** earlier versions used `FROM crcitdevprd001.azurecr.io/base/nginx:latest` (an internal hardened nginx). The default was switched to the public image so handed-over copies of the project work for any organization. If you still want the internal base, see [Update the Dockerfile for your environment](#3-update-the-dockerfile-for-your-environment) for how to switch back.

### 2. Build and run the image locally

These commands work for **any** organization — they don’t require access to any private registry.

```bash
# Build from the repo root (the directory that contains the Dockerfile)
docker build -t fifa-webapp:local .

# Run on port 8080 -> container port 80
docker run --rm -p 8080:80 fifa-webapp:local
```

Visit <http://localhost:8080/>.

To stop, press `Ctrl+C` (the `--rm` flag deletes the stopped container automatically).

### 3. Update the Dockerfile for your environment

You only need to change anything here if your organization requires a non-default base image, custom nginx configuration, or both.

#### a) Replace the base image (optional)

The default `nginx:alpine` is fine for most environments. Swap it if your org standardizes on a different/hardened image:

- **Mirror the public nginx into your own Azure Container Registry** (recommended for orgs that don’t allow pulling from Docker Hub at deploy time):

  ```bash
  docker pull nginx:alpine
  docker tag nginx:alpine <yourorgacr>.azurecr.io/base/nginx:latest
  docker push <yourorgacr>.azurecr.io/base/nginx:latest
  ```

  Then update the Dockerfile:

  ```dockerfile
  FROM <yourorgacr>.azurecr.io/base/nginx:latest
  COPY /fifaweb /usr/share/nginx/html/
  ```

- **Internal Arcadis base** (Arcadis team only — only works if you have access to `crcitdevprd001.azurecr.io`):

  ```dockerfile
  FROM crcitdevprd001.azurecr.io/base/nginx:latest
  COPY /fifaweb /usr/share/nginx/html/
  ```

  Before building you’d run `az acr login --name crcitdevprd001`.

#### b) Optional nginx configuration

The default nginx config serves files from `/usr/share/nginx/html/` on port 80 — exactly what this app needs. You only need to customize if your org requires:

- Custom **CSP headers** to allow ArcGIS.
- A specific compression policy, log format, or health-check path.

If so, add an `nginx.conf` next to the Dockerfile and include it:

```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY /fifaweb /usr/share/nginx/html/
```

> **Do not** change the `COPY /fifaweb /usr/share/nginx/html/` line — it’s what makes `index.html` the site root.

### 4. Push the image to Azure Container Registry (ACR)

If your org already has an ACR, skip the create step.

```bash
# Create an ACR (one-time)
az acr create \
  --resource-group rg-fifa-webapp \
  --name <yourorgacr> \
  --sku Basic

# Sign in (writes credentials to docker)
az acr login --name <yourorgacr>
```

Build and push from the repo root. Two paths:

**Local Docker build → push:**

```bash
docker build -t <yourorgacr>.azurecr.io/fifa-webapp:latest .
docker push <yourorgacr>.azurecr.io/fifa-webapp:latest
```

**Server-side build in ACR** (no local Docker required):

```bash
az acr build \
  --registry <yourorgacr> \
  --image fifa-webapp:latest .
```

Tag with a version (recommended) so you can roll back:

```bash
TAG=$(git rev-parse --short HEAD)
az acr build \
  --registry <yourorgacr> \
  --image fifa-webapp:$TAG \
  --image fifa-webapp:latest .
```

### 5. Deploy the container to Azure App Service

App Service (Linux, Web App for Containers) is the most common deployment target for a single-container nginx workload.

```bash
# 5a) Linux App Service Plan (one-time)
az appservice plan create \
  --name asp-fifa-webapp \
  --resource-group rg-fifa-webapp \
  --is-linux \
  --sku B1

# 5b) Create the web app from the image you just pushed
az webapp create \
  --resource-group rg-fifa-webapp \
  --plan asp-fifa-webapp \
  --name fifa-webapp-<unique> \
  --deployment-container-image-name <yourorgacr>.azurecr.io/fifa-webapp:latest

# 5c) Enable managed identity and let it pull from ACR (recommended over admin creds)
az webapp identity assign \
  --name fifa-webapp-<unique> \
  --resource-group rg-fifa-webapp

PRINCIPAL_ID=$(az webapp identity show \
  --name fifa-webapp-<unique> \
  --resource-group rg-fifa-webapp \
  --query principalId -o tsv)

ACR_ID=$(az acr show --name <yourorgacr> --query id -o tsv)

az role assignment create \
  --assignee $PRINCIPAL_ID \
  --scope $ACR_ID \
  --role AcrPull

# 5d) Point the web app at the registry + image
az webapp config container set \
  --name fifa-webapp-<unique> \
  --resource-group rg-fifa-webapp \
  --docker-custom-image-name <yourorgacr>.azurecr.io/fifa-webapp:latest \
  --docker-registry-server-url https://<yourorgacr>.azurecr.io
```

Visit:

```
https://fifa-webapp-<unique>.azurewebsites.net/
```

App Service automatically serves HTTPS with a managed certificate.

#### Adding a custom domain

```bash
az webapp config hostname add \
  --webapp-name fifa-webapp-<unique> \
  --resource-group rg-fifa-webapp \
  --hostname planning.yourdomain.org

# Provision a free managed certificate
az webapp config ssl create \
  --resource-group rg-fifa-webapp \
  --name fifa-webapp-<unique> \
  --hostname planning.yourdomain.org
```

### 6. Alternative — Azure Container Apps

If your organization standardizes on **Azure Container Apps (ACA)** instead of App Service, the same image works without changes.

```bash
# One-time environment
az containerapp env create \
  --name cae-fifa \
  --resource-group rg-fifa-webapp \
  --location eastus

# Deploy
az containerapp create \
  --name fifa-webapp \
  --resource-group rg-fifa-webapp \
  --environment cae-fifa \
  --image <yourorgacr>.azurecr.io/fifa-webapp:latest \
  --target-port 80 \
  --ingress external \
  --registry-server <yourorgacr>.azurecr.io \
  --query properties.configuration.ingress.fqdn
```

Container Apps gives you free HTTPS, revisions, autoscaling, and built-in blue/green via traffic-splitting between revisions.

### 7. Continuous deployment with GitHub Actions

Save this as `.github/workflows/azure-deploy.yml`. It builds the container in ACR on every push to `main` and updates App Service to the new image tag.

```yaml
name: Build & Deploy to Azure (Container)

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build in ACR
        run: |
          az acr build \
            --registry ${{ secrets.ACR_NAME }} \
            --image fifa-webapp:${{ github.sha }} \
            --image fifa-webapp:latest .

      - name: Update Web App image
        run: |
          az webapp config container set \
            --name ${{ secrets.WEBAPP_NAME }} \
            --resource-group ${{ secrets.RG_NAME }} \
            --docker-custom-image-name ${{ secrets.ACR_NAME }}.azurecr.io/fifa-webapp:${{ github.sha }}

      - name: Restart Web App
        run: |
          az webapp restart \
            --name ${{ secrets.WEBAPP_NAME }} \
            --resource-group ${{ secrets.RG_NAME }}
```

GitHub secrets you need to set once (under **Settings → Secrets and variables → Actions**):

| Secret | What to put in it |
|--------|--------------------|
| `AZURE_CREDENTIALS` | Output of `az ad sp create-for-rbac --name fifa-webapp-cicd --role contributor --scopes /subscriptions/<sub-id>/resourceGroups/rg-fifa-webapp --sdk-auth` |
| `ACR_NAME` | Your ACR name (without the `.azurecr.io` suffix) |
| `WEBAPP_NAME` | App Service web app name, e.g. `fifa-webapp-<unique>` |
| `RG_NAME` | Resource group name, e.g. `rg-fifa-webapp` |

For Container Apps replace the last two `az` steps with:

```bash
az containerapp update \
  --name fifa-webapp \
  --resource-group rg-fifa-webapp \
  --image ${{ secrets.ACR_NAME }}.azurecr.io/fifa-webapp:${{ github.sha }}
```

### 8. Updating the running site after a code change

Day-to-day workflow once the container path is wired up:

1. Make changes anywhere under `fifaweb/` (HTML, JS, CSS, data, assets).
2. Commit and push to `main` — the GitHub Actions workflow rebuilds the image and updates the web app automatically.

Manual update (no CI):

```bash
# From the repo root
TAG=$(git rev-parse --short HEAD)
az acr build --registry <yourorgacr> --image fifa-webapp:$TAG --image fifa-webapp:latest .

az webapp config container set \
  --name fifa-webapp-<unique> \
  --resource-group rg-fifa-webapp \
  --docker-custom-image-name <yourorgacr>.azurecr.io/fifa-webapp:$TAG

az webapp restart \
  --name fifa-webapp-<unique> \
  --resource-group rg-fifa-webapp
```

Rolling back is just pointing the web app at a previous tag:

```bash
az webapp config container set \
  --name fifa-webapp-<unique> \
  --resource-group rg-fifa-webapp \
  --docker-custom-image-name <yourorgacr>.azurecr.io/fifa-webapp:<previous-tag>
az webapp restart --name fifa-webapp-<unique> --resource-group rg-fifa-webapp
```

---

## Alternative Azure hosting (non-container)

If your organization does not require containers, two simpler paths exist. Both serve the same `fifaweb/` folder as static content.

### Azure Static Web Apps

Best when you want zero infrastructure, free HTTPS, custom domains, and GitHub-integrated CI/CD.

Create via portal:

1. Azure Portal → **Create a resource** → **Static Web App**.
2. Resource group: `rg-fifa-webapp`.
3. Plan: **Free** (Standard if you need staging slots or auth).
4. Deployment source: **GitHub**, authorize, select repo + branch.
5. Build preset: **Custom**.
6. **App location**: `fifaweb`. **Api location**: empty. **Output location**: empty.
7. Review + Create — Azure writes a workflow into your repo and deploys.

Or via CLI:

```bash
az staticwebapp create \
  --name fifa-webapp \
  --resource-group rg-fifa-webapp \
  --location eastus2 \
  --source https://github.com/<org>/<repo> \
  --branch main \
  --app-location fifaweb \
  --login-with-github
```

### Azure Storage Static Website

Cheapest possible hosting; pair with Azure Front Door for HTTPS + custom domain.

```bash
az storage account create \
  --name fifawebapp$RANDOM \
  --resource-group rg-fifa-webapp \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

ACCOUNT=<your-storage-account-name>

az storage blob service-properties update \
  --account-name $ACCOUNT \
  --static-website \
  --index-document index.html \
  --404-document index.html

az storage blob upload-batch \
  --account-name $ACCOUNT \
  --source ./fifaweb \
  --destination '$web' \
  --overwrite
```

Get the URL:

```bash
az storage account show \
  --name $ACCOUNT \
  --resource-group rg-fifa-webapp \
  --query "primaryEndpoints.web" -o tsv
```

### Choosing between paths

| Need | Best option |
|------|-------------|
| Match the **existing** team workflow (nginx container in App Service) | **Docker container → App Service** *(primary)* |
| Org standardizes on **container** platforms but uses ACA | **Docker container → Container Apps** |
| Want fully managed, zero-ops static hosting with GitHub CI | **Static Web Apps** |
| Lowest-cost, simplest static hosting | **Storage Static Website** |

---

## Embedded maps (ArcGIS)

Embedded maps work locally but can fail when hosted if the host’s headers or sharing settings are different from the source.

Checklist for hosted environments:

1. **ArcGIS sharing** — Each dashboard/instant app *and* every underlying layer must be shared to **Everyone (public)** if visitors are not signing in. Otherwise ArcGIS will attempt an authentication popup inside the iframe and you may see messages like `Missing translation "errors.identity-manager:popup-blocked"`.
2. **HTTPS** — Serve the site over HTTPS. All four Azure options above and GitHub Pages provide HTTPS automatically.
3. **CSP headers** — If you add a Content Security Policy at the host (Azure Front Door, App Service, etc.), allow:

   ```
   frame-src https://*.arcgis.com https://*.arcgisonline.com https://www.arcgis.com https://felt.com https://app.powerbi.com;
   ```

   plus any other embed origins you use.
4. **Third-party cookies** — Browsers with strict tracking-protection settings can block ArcGIS sign-in cookies inside iframes. Public sharing avoids this entirely.

Where map URLs live in code:

- `fifaweb/js/post-event-analysis.js` → `POST_EVENT_MAPS`, `POST_EVENT_CONGESTION_MAPS`
- `fifaweb/traffic-analysis-summary.html` → inline `PM_TREE` and baseline iframe URL mapping
- `fifaweb/js/big-data-analysis.js` → Prior Events Felt embed URLs

---

## Large files and Git LFS

The `fifaweb/data/` tree contains hundreds of PNG/JPG/GeoJSON assets. GitHub warns at **> 50 MB** per file and blocks **> 100 MB**.

- Keep scenario assets in-repo if total size is acceptable.
- For very large datasets, use **Git LFS** or move assets to Azure Blob Storage / a CDN and update paths in JS/HTML to point there.

Optional `.gitattributes` example:

```
fifaweb/data/** filter=lfs diff=lfs merge=lfs -text
```

---

## Configuration reference

| What to change | Where |
|----------------|-------|
| Post Event match list + map URLs | `fifaweb/post-event-analysis.html`, `fifaweb/js/post-event-analysis.js` |
| Model Scenarios menu tree | `fifaweb/traffic-analysis-summary.html` (inline `PM_TREE`) + `fifaweb/js/performance-measures-menu.js` |
| Baseline ArcGIS iframe URLs | `fifaweb/traffic-analysis-summary.html` (inline `BASELINE_IFRAME_URLS`) |
| Demand scenario defaults | `fifaweb/js/demand-scenario.js` |
| Supply / transit map GeoJSON | `fifaweb/js/tmp-scenario.js` and files under `fifaweb/data/` |
| Global styles | `fifaweb/css/styles.css` |
| Demand CSV import format | `fifaweb/schema/README.md` |
| Container image base | `Dockerfile` (root) — update `FROM` to a base your org allows |

---

## Contributing

1. Branch from `main`.
2. Run changes locally with a static HTTP server rooted at `fifaweb/`.
3. Test navigation, data loading, and embedded maps.
4. Open a pull request. If CI/CD is wired (GitHub Pages, Azure Static Web Apps, App Service workflow), merging redeploys automatically.

---

