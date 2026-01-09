const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/resources-extended.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Helper to parse address
function parseAddress(address, coords) {
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

// Pattern to match resource objects and extract address, coordinates
const resourcePattern = /(\{[^}]*id:\s*['"]([^'"]+)['"][^}]*address:\s*['"]([^'"]+)['"][^}]*coordinates:\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)\s*\}[^}]*\})/gs;

// For each resource, add location before coordinates and createdAt/updatedAt at the end
// This is complex, so we'll do targeted replacements

// Replace pattern: verified: true/false, coordinates: { lat: X, lng: Y }
// With: verified: true/false, location: parseAddress(...), coordinates: { lat: X, lng: Y }

content = content.replace(
  /(verified:\s*(true|false),?\s*)(coordinates:\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)\s*\})/g,
  (match, verifiedPart, verifiedVal, coordsPart, lat, lng) => {
    // Find the address from the context (look backwards)
    const beforeMatch = content.substring(0, content.indexOf(match));
    const addressMatch = beforeMatch.match(/address:\s*['"]([^'"]+)['"]/);
    const address = addressMatch ? addressMatch[1] : '';
    
    if (address) {
      const location = parseAddress(address, { lat: parseFloat(lat), lng: parseFloat(lng) });
      return `${verifiedPart}location: parseAddress('${address}', { lat: ${lat}, lng: ${lng} }),\n    ${coordsPart}`;
    }
    return match;
  }
);

// Add createdAt and updatedAt before closing brace if missing
content = content.replace(
  /(accessibility:\s*\[[^\]]+\])(\s*)(\n\s*\})/g,
  (match, accessibility, spacing, closing) => {
    if (!content.substring(0, content.indexOf(match)).includes('createdAt')) {
      return `${accessibility}${spacing}\n    createdAt: new Date(),\n    updatedAt: new Date(),${closing}`;
    }
    return match;
  }
);

fs.writeFileSync(filePath, content);
console.log('Updated resources-extended.ts');

