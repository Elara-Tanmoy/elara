# Create the .github/workflows directory
mkdir -p .github/workflows

# Create the deploy-staging.yml file with the workflow content
cat > .github/workflows/deploy-staging.yml << 'EOF'
name: Build & Deploy to Staging

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

env:
  WEBAPP_NAME: ${{ secrets.WEBAPP_NAME }}
  RESOURCE_GROUP: ${{ secrets.RESOURCE_GROUP }}
  STAGING_SLOT: ${{ secrets.STAGING_SLOT }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Use Node 18
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd api
          npm ci

      - name: Run unit tests (if any)
        run: |
          # cd api && npm test || echo "no tests configured"
          echo "Skipping tests (configure if you have tests)."

      - name: Prepare deployment package (zip)
        run: |
          cd api
          zip -r ../api-deploy.zip . -x "node_modules/**" "*.env" ".git/**"

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to WebApp staging slot (ZIP)
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.WEBAPP_NAME }}
          slot-name: ${{ env.STAGING_SLOT }}
          package: ./api-deploy.zip

      - name: Smoke test staging endpoint
        run: |
          echo "Waiting for staging site..."
          sleep 8
          curl --fail -s "https://${{ env.WEBAPP_NAME }}-${{ env.STAGING_SLOT }}.azurewebsites.net/health" -o /tmp/health.txt
          cat /tmp/health.txt
EOF

# Add the workflow file to git
git add .github/workflows/deploy-staging.yml

# Commit the changes
git commit -m "Add GitHub Actions workflow for staging deployment"

# Push to GitHub
git push origin main