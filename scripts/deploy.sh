
#!/usr/bin/env bash
set -euo pipefail

PREFIX=${1:-elara}
RG=rg-${PREFIX}-dev
LOCATION=${2:-canadacentral}

echo "==> Azure login (interactive)..."
az account show >/dev/null 2>&1 || az login

echo "==> Set subscription (if needed): az account set --subscription <SUB_ID>"

echo "==> Create resource group: $RG ($LOCATION)"
az group create -g "$RG" -l "$LOCATION"

echo "==> Deploy infra (Bicep)"
az deployment group create -g "$RG" -f infra/main.bicep -p infra/dev.parameters.json

API_URL=$(az deployment group show -g "$RG" -n $(az deployment group list -g "$RG" --query "[0].name" -o tsv) --query "properties.outputs.apiUrl.value" -o tsv)
WEB_URL=$(az deployment group show -g "$RG" -n $(az deployment group list -g "$RG" --query "[0].name" -o tsv) --query "properties.outputs.webUrl.value" -o tsv)
KV_NAME=$(az deployment group show -g "$RG" -n $(az deployment group list -g "$RG" --query "[0].name" -o tsv) --query "properties.outputs.keyVaultName.value" -o tsv)

echo "==> Deployed:"
echo "API: $API_URL"
echo "Web: $WEB_URL"
echo "Key Vault: $KV_NAME"

echo "==> Add your LLM key to Key Vault (example for Azure OpenAI):"
echo "az keyvault secret set --vault-name $KV_NAME --name AZURE_OPENAI_API_KEY --value <YOUR_KEY>"

echo "==> Then set app settings (endpoint/deployment) and Key Vault reference:"
echo "az webapp config appsettings set -g $RG -n elara-api-dev --settings \"AZURE_OPENAI_ENDPOINT=https://<YOUR-RESOURCE>.openai.azure.com\" \"AZURE_OPENAI_DEPLOYMENT=<DEPLOYMENT_NAME>\""
echo "SECRET_ID=$(az keyvault secret show --vault-name $KV_NAME --name AZURE_OPENAI_API_KEY --query id -o tsv)"
echo "az webapp config appsettings set -g $RG -n elara-api-dev --settings \"AZURE_OPENAI_API_KEY=@Microsoft.KeyVault(SecretUri=$SECRET_ID)\""
