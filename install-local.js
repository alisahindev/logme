/* eslint-disable */
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
try {
  execSync('npm run build', { stdio: 'inherit', cwd: pkgDir });
} catch (err) {
  console.error('❌ Build failed. Fix build errors and try again.');
  process.exit(1);
}

// Step 2: Create a tarball without triggering prepare scripts
console.log('\n📄 Creating package tarball...');
try {
  // Temporarily move package.json to avoid prepare script
  const tempPackageJsonPath = path.join(pkgDir, '_package.json');
  const packageJsonPath = path.join(pkgDir, 'package.json');
  
  // Read and modify package.json to remove prepare script
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const originalScripts = {...pkg.scripts};
  
  if (pkg.scripts && pkg.scripts.prepare) {
    console.log('  • Temporarily disabling prepare script');
    delete pkg.scripts.prepare;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  }
  
  // Create the tarball
  const tarballOutput = execSync('npm pack', { encoding: 'utf8', cwd: pkgDir }).trim();
  const tarballFile = path.join(pkgDir, tarballOutput);
  
  // Restore original package.json
  pkg.scripts = originalScripts;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  
  console.log(`✅ Created tarball: ${tarballOutput}`);
  
  // Step 3: Provide instructions for installation
  console.log('\n🔗 To install in another project, run one of these commands:');
  console.log('\nUsing npm:');
  console.log(`\tnpm install --save "${tarballFile}"`);
  console.log('\nUsing yarn:');
  console.log(`\tyarn add "${tarballFile}"`);
  
} catch (err) {
  console.error('❌ Failed to create package tarball:', err.message);
  process.exit(1);
}

console.log('\n🔄 Or to create a symlink (for development):');
console.log('\nUsing npm:');
console.log(`\t# In this package directory`);
console.log(`\tnpm link`);
console.log(`\t# In your project directory`);
console.log(`\tnpm link ${name}`);
console.log('\nUsing yarn:');
console.log(`\t# In this package directory`);
console.log(`\tyarn link`);
console.log(`\t# In your project directory`);
console.log(`\tyarn link ${name}`);

console.log('\n✨ Done! Happy logging! ✨\n'); 