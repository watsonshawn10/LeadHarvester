#!/usr/bin/env node

// Deployment readiness check script
import fs from 'fs';
import path from 'path';

console.log('🚀 TaskNab Deployment Readiness Check\n');

const checks = [
  {
    name: 'Server bundle exists',
    check: () => fs.existsSync('dist/index.js'),
    fix: 'Run: npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist'
  },
  {
    name: 'Static files directory exists',
    check: () => fs.existsSync('dist/public'),
    fix: 'Run: mkdir -p dist/public'
  },
  {
    name: 'Index.html exists',
    check: () => fs.existsSync('dist/public/index.html'),
    fix: 'Build frontend or create minimal index.html'
  },
  {
    name: 'Production scripts configured',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts.build && pkg.scripts.start;
    },
    fix: 'Add build and start scripts to package.json'
  },
  {
    name: 'Enhanced production error handling implemented',
    check: () => {
      const serverCode = fs.readFileSync('server/index.ts', 'utf8');
      return serverCode.includes('setupProductionStatic') && 
             serverCode.includes('setupFallbackApp') &&
             serverCode.includes('try {') && 
             serverCode.includes('catch');
    },
    fix: 'Enhanced production error handling with fallback static serving is missing'
  },
  {
    name: 'Production static file handler exists',
    check: () => fs.existsSync('server/production.ts'),
    fix: 'Create production.ts file with alternative static file serving'
  },
  {
    name: 'Database environment configured',
    check: () => !!process.env.DATABASE_URL,
    fix: 'Set DATABASE_URL environment variable'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  
  if (!passed) {
    console.log(`   Fix: ${fix}\n`);
    allPassed = false;
  }
});

console.log('\n' + (allPassed ? '🎉 All deployment checks passed!' : '⚠️  Some checks failed. Please fix the issues above.'));

if (allPassed) {
  console.log('\nYour app is ready for deployment! 🚀');
  console.log('The deployment will run: npm run build && npm run start');
}