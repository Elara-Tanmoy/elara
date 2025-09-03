
# Elara – Azure Deployment (Baby Steps)

This package gives you **click-by-click + copy-paste** to:
1) Install Git/GitHub locally
2) Create a **private repo**
3) Deploy Azure resources with **Bicep**
4) Wire **OIDC** from GitHub → Azure (no secrets)
5) Push the MVP code and get **public URLs** for API & Web

---

## A) Install Git & GitHub locally
- **Windows:** Install Git for Windows, and optionally GitHub Desktop.
- **macOS:** `xcode-select --install` (for git) or install GitHub Desktop.
- **All:** Install **GitHub CLI** (optional): https://cli.github.com/

Verify:
```
git --version
gh --version   # optional
```

## B) Create a private GitHub repo and push code
1. In GitHub, click **New repository** → Name: `elara` → **Private** → Create.
2. On your machine:
```
mkdir elara && cd elara
# Put your code here (unzip elara-mvp-llm-enabled.zip contents into this folder)
git init
git add .
git commit -m "Initial MVP"
git branch -M main
git remote add origin https://github.com/<YOUR_OWNER>/elara.git
git push -u origin main
```

## C) Azure CLI login and resource group
```
az login
az account set --subscription <SUBSCRIPTION_ID>
az group create -g rg-elara-dev -l canadacentral
```

## D) Deploy infra with Bicep
Copy this folder `infra/` and `scripts/` into your repo (or download this whole package). Then:
```
# from the repo root
bash scripts/deploy.sh elara canadacentral
# or on Windows PowerShell:
# ./scripts/deploy.ps1 -Prefix elara -Location canadacentral
```
Outputs include:
- **API URL**: https://elara-api-dev.azurewebsites.net
- **Web URL**: https://elara-web-dev.azurewebsites.net
- **Key Vault**: kv-elara-dev

## E) Add your LLM key into Key Vault & reference it
```
az keyvault secret set --vault-name kv-elara-dev --name AZURE_OPENAI_API_KEY --value <YOUR_KEY>
SECRET_ID=$(az keyvault secret show --vault-name kv-elara-dev --name AZURE_OPENAI_API_KEY --query id -o tsv)

az webapp config appsettings set -g rg-elara-dev -n elara-api-dev --settings   "LLM_PROVIDER=azure_openai"   "AZURE_OPENAI_ENDPOINT=https://<YOUR-RESOURCE>.openai.azure.com"   "AZURE_OPENAI_DEPLOYMENT=<DEPLOYMENT_NAME>"   "AZURE_OPENAI_API_VERSION=2024-02-15-preview"   "AZURE_OPENAI_API_KEY=@Microsoft.KeyVault(SecretUri=$SECRET_ID)"
```

## F) Configure GitHub → Azure OIDC (one-time)
Create an Entra App for GitHub Actions and give it access to the resource group.
```
APP_NAME=elara-github-oidc
RG=rg-elara-dev
SUB=$(az account show --query id -o tsv)

# Create app
APP_ID=$(az ad app create --display-name $APP_NAME --query appId -o tsv)

# Assign Contributor on the RG
az role assignment create --assignee $APP_ID --role Contributor --scope /subscriptions/$SUB/resourceGroups/$RG

# Add federated credential (replace owner/repo)
cat infra/github-federated-credential.json | \
  sed "s#<GITHUB_OWNER>#<YOUR_OWNER>#; s#<REPO_NAME>#elara#" > /tmp/fc.json
az ad app federated-credential create --id $APP_ID --parameters /tmp/fc.json

# Save values as GitHub repo secrets
# AZURE_TENANT_ID : $(az account show --query tenantId -o tsv)
# AZURE_SUBSCRIPTION_ID : $SUB
# AZURE_CLIENT_ID : $APP_ID
```

In GitHub → Repo → **Settings → Secrets and variables → Actions → New repository secret**: add
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_CLIENT_ID`

## G) Add the CI/CD workflow
Copy `.github/workflows/deploy.yml` from this package into your repo. On next push to `main`, it will:
1) Deploy/update **infra** from Bicep
2) Build and deploy **API** to the **staging slot**, smoke-test, then **swap** to production
3) Build and deploy **web** (static) to its App Service

## H) Point your clients to the public URLs
- **API base**: `https://elara-api-dev.azurewebsites.net`
- **Web**: `https://elara-web-dev.azurewebsites.net`

Update:
- Web `.env`: `VITE_API_BASE=https://elara-api-dev.azurewebsites.net`
- Extension options page: set API URL to the public API base
- Mobile `App.js`: set `API_BASE` to the public API base

## I) Verify (live demo)
- API health: `https://elara-api-dev.azurewebsites.net/health`
- Web UI: paste a link → see verdict card
- Extension: loads block page for risky URLs
- Mobile: paste link/message → gets results

You’re live. When ready, add Front Door + WAF and Private Endpoints for hardening.
