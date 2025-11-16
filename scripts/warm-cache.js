#!/usr/bin/env node

const http = require('http');

const pages = [
  '/',
  '/directory',
  '/events',
  '/projects',
  '/volunteer/dashboard',
  '/news',
  '/social',
  '/lists',
  '/dashboard',
  '/analytics',
  '/submit',
  '/about',
  '/highlights',
  '/business',
  '/grants'
];

async function warmPage(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000${path}`, (res) => {
      res.on('data', () => {}); // drain the stream
      res.on('end', () => {
        console.log(`✓ Warmed: ${path}`);
        resolve();
      });
    });
    req.on('error', () => {
      console.log(`✗ Failed: ${path}`);
      resolve();
    });
    req.setTimeout(30000);
  });
}

async function main() {
  console.log('🔥 Warming up all pages...\n');
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Warm pages in parallel (3 at a time to avoid overwhelming)
  for (let i = 0; i < pages.length; i += 3) {
    const batch = pages.slice(i, i + 3);
    await Promise.all(batch.map(warmPage));
  }
  
  console.log('\n✅ All pages warmed! Navigation should be instant now.\n');
}

main();
