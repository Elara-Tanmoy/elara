
param(
  [string]$Prefix = "elara",
  [string]$Location = "canadacentral"
)

$ErrorActionPreference = "Stop"

$rg = "rg-$Prefix-dev"

Write-Host "==> Azure login (interactive)"
try { az account show | Out-Null } catch { az login | Out-Null }

Write-Host "==> Create resource group $rg ($Location)"
az group create -g $rg -l $Location | Out-Null

Write-Host "==> Deploy infra (Bicep)"
az deployment group create -g $rg -f infra/main.bicep -p infra/dev.parameters.json | Out-Null

$depName = (az deployment group list -g $rg --query "[0].name" -o tsv)
$apiUrl = az deployment group show -g $rg -n $depName --query "properties.outputs.apiUrl.value" -o tsv
$webUrl = az deployment group show -g $rg -n $depName --query "properties.outputs.webUrl.value" -o tsv
$kvName = az deployment group show -g $rg -n $depName --query "properties.outputs.keyVaultName.value" -o tsv

Write-Host "==> Deployed:"
Write-Host "API: $apiUrl"
Write-Host "Web: $webUrl"
Write-Host "Key Vault: $kvName"

Write-Host "==> Add your LLM key to Key Vault (example):"
Write-Host "az keyvault secret set --vault-name $kvName --name AZURE_OPENAI_API_KEY --value <YOUR_KEY>"
