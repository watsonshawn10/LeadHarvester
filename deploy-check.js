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
    name: 'Error handling implemented',
    check: () => {
      const serverCode = fs.readFileSync('server/index.ts', 'utf8');
      return serverCode.includes('try {') && serverCode.includes('catch');
    },
    fix: 'Add error handling to server startup'
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