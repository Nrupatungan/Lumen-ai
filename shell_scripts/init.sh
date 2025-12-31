#!/usr/bin/env bash
set -euo pipefail

echo "Downing existing Docker compose..."
docker compose -f docker/docker-compose.dev.yaml down

echo "\nRunning Docker compose for local dev..."
docker compose -f docker/docker-compose.dev.yaml up -d

echo "\nRunning package lambdas shell script..."
./shell_scripts/package-lambdas.sh

echo "\nStart your localstack server in another terminal beforehand..."

echo "\nCreating Infrastructure for your application..."
cd infra/localstack
tflocal init
tflocal apply

echo "\nRunning workers locally..."
pnpm --filter workers dev