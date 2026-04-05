const fs = require('fs');
const path = require('path');

// Read the resources file
const filePath = path.join(__dirname, '../data/resources.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Helper function to parse address into Location object
function parseAddressToLocation(address, coords) {
  const parts = address.split(',');
  if (parts.length >= 3) {
    const street = parts[0].trim();
    const city = parts[1].trim();
    const stateZip = parts[2].trim().split(' ');
    const state = stateZip[0];
    const zipCode = stateZip[1] || '';
    return {
      lat: coords?.lat || 40.4406,
      lng: coords?.lng || -79.9961,
      address: street,
      city: city,
      state: state,
      zipCode: zipCode,
    };
  }
  return {
    lat: coords?.lat || 40.4406,
    lng: coords?.lng || -79.9961,
    address: address,
    city: '',
    state: 'PA',
    zipCode: '',
  };
}

// Pattern to find resource objects and add missing fields
// This is a complex regex replacement, so we'll do it step by step

// First, add location, verified, createdAt, updatedAt to resources that don't have them
// We need to be careful with the regex to match the full resource object

console.log('Processing resources file...');

// For each resource, ensure it has:
// - location: Location (required)
// - verified: boolean (required)
// - createdAt: Date (required)
// - updatedAt: Date (required)

// Since this is complex, let's use a simpler approach: find each resource object
// and add the missing fields before the closing brace

// Pattern to match resource objects (simplified - we'll do manual fixes)
const resourceIdPattern = /id:\s*['"]([^'"]+)['"]/g;
let match;
const resourceIds = [];
while ((match = resourceIdPattern.exec(content)) !== null) {
  resourceIds.push(match[1]);
}

console.log(`Found ${resourceIds.length} resources`);

// For now, we'll output instructions for manual fixes
// The actual fix requires careful parsing of the TypeScript structure

fs.writeFileSync(
  path.join(__dirname, '../data/resources-backup.ts'),
  content
);

console.log('Backup created. Manual fixes needed.');

