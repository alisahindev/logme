#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * This script helps with linking the logme package to local projects
 * It handles building, packing, and installing the package
 */

// Get absolute path to this directory
const pkgDir = __dirname;

// Get the package name and version
const packageJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
const { name, version } = packageJson;

console.log(`\n📦 Installing ${name}@${version} locally...\n`);

// Step 1: Build the package
console.log('🔨 Building package...');
execSync('npm run build', { stdio: 'inherit', cwd: pkgDir });

// Step 2: Create a tarball
console.log('\n📄 Creating package tarball...');
const tarballOutput = execSync('npm pack', { encoding: 'utf8', cwd: pkgDir }).trim();
const tarballFile = path.join(pkgDir, tarballOutput);

console.log(`✅ Created tarball: ${tarballOutput}`);

// Step 3: Provide instructions for installation
console.log('\n🔗 To install in another project, run one of these commands:');
console.log('\nUsing npm:');
console.log(`\tnpm install --save ${tarballFile}`);
console.log('\nUsing yarn:');
console.log(`\tyarn add ${tarballFile}`);

console.log('\n🔄 Or to create a symlink (for development):');
console.log('\nUsing npm:');
console.log(`\tcd ${pkgDir} && npm link`);
console.log(`\tcd /path/to/your/project && npm link ${name}`);
console.log('\nUsing yarn:');
console.log(`\tcd ${pkgDir} && yarn link`);
console.log(`\tcd /path/to/your/project && yarn link ${name}`);

console.log('\n✨ Done! Happy logging! ✨\n'); 