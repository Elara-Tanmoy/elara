
# VS Code Baby Steps – Deploy Fully Working MVP on Azure

Follow these in **this order** inside VS Code.

## 0) Prereqs
- Install **Azure CLI**: https://learn.microsoft.com/cli/azure/install-azure-cli
- Install **Node 18+**
- VS Code Extensions will prompt (recommended list included)

## 1) Open this folder in VS Code
- Press **Ctrl/Cmd+Shift+P** → “**Tasks: Run Task**”

## 2) Azure Login & Subscription
- Run task **A0: Azure Login**
- Run task **A1: Set Subscription** (paste your Subscription ID)

## 3) Create Resource Group & Deploy Infra
- Run task **A2: Create Resource Group** (prefix defaults to `elara`, location `canadacentral`)
- Run task **A3: Deploy Infra (Bicep)**

When done, find your URLs:
- API: https://<prefix>-api-dev.azurewebsites.net
- Web: https://<prefix>-web-dev.azurewebsites.net
- Key Vault: kv-<prefix>-dev

## 4) Put LLM keys in Key Vault & wire API Settings
- Run task **A4: Set Key Vault Secret (LLM)** (paste your Azure OpenAI key)
- Run task **A5: Wire API App Settings (LLM)** (enter endpoint and deployment name)

## 5) Deploy API code (staging slot → swap)
- Run task **B0: Build API (zip)**
- Run task **B1: Deploy API to Staging Slot**
- Verify: https://<prefix>-api-dev-staging.azurewebsites.net/health shows `{ ok: true }`
- Run task **B2: Swap Slot → Production**
- Verify: https://<prefix>-api-dev.azurewebsites.net/health

## 6) Build & Deploy Web (points to your live API)
- Run task **C0: Build Web (Vite)** (it bakes `VITE_API_BASE=https://<prefix>-api-dev.azurewebsites.net`)
- Run task **C1: Deploy Web (static)**
- Open: https://<prefix>-web-dev.azurewebsites.net

## 7) Point the Extension/Mobile to your API
- Extension options page → set API URL to `https://<prefix>-api-dev.azurewebsites.net`
- Mobile (Expo) → set `API_BASE` in `mobile-expo/App.js` (or keep local during dev)

## 8) (Optional) GitHub OIDC CI/CD
- Run task **D0: Create Entra App for GitHub OIDC**, then follow the README in `/infra` to add the federated credential and repo secrets.
- Push to `main` and the workflow `.github/workflows/deploy.yml` will build & deploy automatically.

Done. You have **public URLs** for API and Web, wired to Azure OpenAI via Key Vault, with infra defined in Bicep and repeatable from VS Code tasks.
