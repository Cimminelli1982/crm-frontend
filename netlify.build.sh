#!/bin/bash

# This script is used by Netlify to build the site

# Force npm to install regardless of lockfile
echo "Force installing ag-grid packages..."
npm install ag-grid-community ag-grid-react --no-save

# Run the normal build command
echo "Running build command..."
npm run build