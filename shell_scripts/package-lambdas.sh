#!/usr/bin/env bash
set -euo pipefail

echo "\nBuilding lambdas..."
pnpm --filter lambdas build

# Move to lambdas dist directory
cd apps/lambdas/dist

echo "\nPackaging ingestion-router lambda..."
zip -r ingestion-router.zip ingestion-router

echo "\nPackaging usage-sync lambda..."
zip -r usage-sync.zip usage-sync

echo "\nLambda packages created successfully:"
ls -lh *.zip

# Move to root
cd ../../..