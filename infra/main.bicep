@description('Resource name prefix (letters/numbers, 3–10 chars). Example: elara')
param namePrefix string

@description('Azure location, e.g., canadacentral or canadaeast')
param location string = 'canadacentral'

@description('App Service Plan SKU (S1 or higher for slots)')
param planSku string = 'S1'

@description('Create a staging slot (requires S1 or higher)')
param enableStagingSlot bool = true

// ---------------------- Observability ----------------------
resource la 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-${namePrefix}-dev'
  location: location
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource ai 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${namePrefix}-dev'
  location: location
  kind: 'web'
  properties: {
    WorkspaceResourceId: la.id
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
    IngestionMode: 'LogAnalytics'
  }
}

// ---------------------- Key Vault (RBAC) ----------------------
resource kv 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: 'kv-${namePrefix}-dev'
  location: location
  properties: {
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'   // valid values: 'standard' or 'premium'
    }
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
  }
}

// ---------------------- App Service Plan (Linux) ----------------------
resource plan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-${namePrefix}-dev'
  location: location
  sku: {
    name: planSku          // e.g., 'S1'
    tier: 'Standard'       // since we’re using S1
    size: planSku
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// ---------------------- API App (Node 18) ----------------------
resource api 'Microsoft.Web/sites@2022-09-01' = {
  name: '${namePrefix}-api-dev'
  location: location
  identity: { type: 'SystemAssigned' }
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      alwaysOn: true
      appSettings: [
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'PORT', value: '3001' }
        { name: 'ALLOW_ORIGIN', value: '*' }
        { name: 'DATA_DIR', value: '/home/site/wwwroot/data' }
        // LLM toggles (non-secret). Put secrets in Key Vault and reference them later.
        { name: 'LLM_PROVIDER', value: 'azure_openai' }
        { name: 'AZURE_OPENAI_ENDPOINT', value: '' }
        { name: 'AZURE_OPENAI_DEPLOYMENT', value: '' }
        { name: 'AZURE_OPENAI_API_VERSION', value: '2024-02-15-preview' }
      ]
    }
  }
}

// Staging slot (only if enabled)
resource apiSlot 'Microsoft.Web/sites/slots@2022-09-01' = if (enableStagingSlot) {
  name: 'staging'
  parent: api
  location: location
  identity: { type: 'SystemAssigned' }
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      alwaysOn: true
      appSettings: [
        { name: 'PORT', value: '3001' }
        { name: 'ALLOW_ORIGIN', value: '*' }
        { name: 'DATA_DIR', value: '/home/site/wwwroot/data' }
      ]
    }
  }
}

// ---------------------- Web App (serves built React) ----------------------
resource web 'Microsoft.Web/sites@2022-09-01' = {
  name: '${namePrefix}-web-dev'
  location: location
  identity: { type: 'SystemAssigned' }
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      alwaysOn: true
      // We deploy a zip of /web/dist to wwwroot; pm2 serves static files.
      appSettings: [
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: '0' }
        { name: 'STARTUP_COMMAND', value: 'pm2 serve /home/site/wwwroot --no-daemon --spa' }
      ]
    }
  }
}

// ---------------------- KV Role Assignments ----------------------
resource kvRoleApi 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, 'kvSecretsUserApi')
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
    )
    principalId: api.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource kvRoleApiSlot 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableStagingSlot) {
  name: guid(resourceGroup().id, 'kvSecretsUserApiSlot')
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
    principalId: apiSlot.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------------------- Outputs (pure string – no property reads) ----------------------
@description('Public API URL')
output apiUrl string = 'https://${namePrefix}-api-dev.azurewebsites.net'

@description('Public API staging URL (empty if slots disabled)')
output apiSlotUrl string = enableStagingSlot ? 'https://${namePrefix}-api-dev-staging.azurewebsites.net' : ''

@description('Public Web URL')
output webUrl string = 'https://${namePrefix}-web-dev.azurewebsites.net'

@description('Key Vault name')
output keyVaultName string = 'kv-${namePrefix}-dev'
