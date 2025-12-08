#!/bin/bash
set -e  # Exit on any error

# This script is used by Netlify to build the site

# Force npm to install regardless of lockfile
echo "Force installing required packages..."
npm install ag-grid-community ag-grid-react react-toastify --no-save

# Run the normal build command
echo "Running build command..."
npm run build

# Build the new CRM as well
echo "Building new CRM..."
npm run new-crm:build

# Verify new-crm build output exists
echo "Verifying new-crm build..."
ls -la build/new-crm/
echo "New CRM build completed successfully!"