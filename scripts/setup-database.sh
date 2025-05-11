#!/bin/bash

# Push the schema to the database
echo "Pushing schema to database..."
npm run db:push

# Run the sample data population script
echo "Populating sample data..."
npx tsx scripts/populate-sample-data.ts

echo "Database setup completed!"