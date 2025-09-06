# 7. Deploy everything
Write-Host "Deploying to GitHub..."
git checkout develop
git add .
git commit -m "Complete MVP: AI analysis, external verification, screenshot analysis"
git push origin develop

Write-Host "Deploying to production..."
git checkout main
git merge develop --no-edit
git push origin main

Write-Host "Deployment completed!"
Write-Host "API: https://elara-api-dev.azurewebsites.net"
Write-Host "Dashboard: https://elara-dashboard-live.azurewebsites.net"