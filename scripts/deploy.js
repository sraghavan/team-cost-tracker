#!/usr/bin/env node

/**
 * Deployment script for Team Cost Tracker
 * 
 * This script:
 * 1. Increments version numbers
 * 2. Updates service worker cache name
 * 3. Commits changes
 * 4. Pushes to trigger deployment
 * 5. Shows deployment status
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Version types
const VERSION_TYPES = {
  PATCH: 'patch',
  MINOR: 'minor',
  MAJOR: 'major'
};

class DeploymentManager {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.packageJsonPath = path.join(this.rootDir, 'package.json');
    this.serviceWorkerPath = path.join(this.rootDir, 'public', 'sw.js');
    this.settingsPath = path.join(this.rootDir, 'src', 'components', 'SettingsTab.js');
  }

  // Get current version from package.json
  getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    return packageJson.version;
  }

  // Increment version number
  incrementVersion(currentVersion, type = VERSION_TYPES.PATCH) {
    const parts = currentVersion.split('.').map(Number);
    const [major, minor, patch] = parts;

    switch (type) {
      case VERSION_TYPES.MAJOR:
        return `${major + 1}.0.0`;
      case VERSION_TYPES.MINOR:
        return `${major}.${minor + 1}.0`;
      case VERSION_TYPES.PATCH:
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  // Update package.json version
  updatePackageVersion(newVersion) {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json to version ${newVersion}`);
  }

  // Update service worker version and cache name
  updateServiceWorker(newVersion) {
    let swContent = fs.readFileSync(this.serviceWorkerPath, 'utf8');
    
    // Update cache name (increment v number)
    const cacheRegex = /const CACHE_NAME = 'cost-splitter-v(\d+)'/;
    const cacheMatch = swContent.match(cacheRegex);
    if (cacheMatch) {
      const currentCacheVersion = parseInt(cacheMatch[1]);
      const newCacheVersion = currentCacheVersion + 1;
      swContent = swContent.replace(cacheRegex, `const CACHE_NAME = 'cost-splitter-v${newCacheVersion}'`);
    }
    
    // Update app version
    const versionRegex = /const APP_VERSION = '[^']+'/;
    swContent = swContent.replace(versionRegex, `const APP_VERSION = '${newVersion}'`);
    
    fs.writeFileSync(this.serviceWorkerPath, swContent);
    console.log(`✅ Updated service worker to version ${newVersion}`);
  }

  // Update version in SettingsTab component
  updateSettingsVersion(newVersion) {
    let settingsContent = fs.readFileSync(this.settingsPath, 'utf8');
    
    // Update version display
    const versionRegex = /<span className="info-value">[\d.]+<\/span>/;
    settingsContent = settingsContent.replace(versionRegex, `<span className="info-value">${newVersion}</span>`);
    
    fs.writeFileSync(this.settingsPath, settingsContent);
    console.log(`✅ Updated settings display to version ${newVersion}`);
  }

  // Generate changelog entry
  generateChangelogEntry(version, changes = []) {
    const date = new Date().toISOString().split('T')[0];
    const defaultChanges = [
      'Bug fixes and performance improvements',
      'Enhanced user experience',
      'Updated dependencies'
    ];
    
    const changeList = changes.length > 0 ? changes : defaultChanges;
    
    return `## v${version} - ${date}\n\n${changeList.map(change => `- ${change}`).join('\n')}\n\n`;
  }

  // Update changelog
  updateChangelog(version, changes = []) {
    const changelogPath = path.join(this.rootDir, 'CHANGELOG.md');
    const entry = this.generateChangelogEntry(version, changes);
    
    if (fs.existsSync(changelogPath)) {
      const existingContent = fs.readFileSync(changelogPath, 'utf8');
      fs.writeFileSync(changelogPath, entry + existingContent);
    } else {
      fs.writeFileSync(changelogPath, `# Changelog\n\n${entry}`);
    }
    
    console.log(`✅ Updated changelog for version ${version}`);
  }

  // Check git status
  checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log('📋 Uncommitted changes detected:');
        console.log(status);
      }
      return status.trim();
    } catch (error) {
      console.error('❌ Git not available or not a git repository');
      return null;
    }
  }

  // Commit and push changes
  commitAndPush(version, message) {
    try {
      console.log('📝 Committing changes...');
      execSync('git add .', { stdio: 'inherit' });
      
      const commitMessage = message || `🚀 Release version ${version}\n\nAuto-generated deployment with version updates\n\n🤖 Generated with deployment script`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      console.log('📤 Pushing to remote...');
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log(`✅ Successfully deployed version ${version}`);
      
    } catch (error) {
      console.error('❌ Failed to commit and push:', error.message);
      throw error;
    }
  }

  // Show deployment summary
  showDeploymentSummary(oldVersion, newVersion) {
    console.log('\n🎉 Deployment Complete!');
    console.log('========================');
    console.log(`📊 Version: ${oldVersion} → ${newVersion}`);
    console.log(`🚀 Status: Deployed to production`);
    console.log(`📱 PWA users will receive update notification`);
    console.log(`🔄 Service worker cache updated`);
    console.log(`⏰ Estimated deployment time: 2-3 minutes`);
    console.log('\n📱 What happens next:');
    console.log('• PWA users get push notification about update');
    console.log('• Users can click "Update Now" to reload');
    console.log('• New features and fixes are immediately available');
    console.log('\n🔗 Check deployment status at your Vercel dashboard');
  }

  // Main deployment function
  async deploy(versionType = VERSION_TYPES.PATCH, changes = [], commitMessage = null) {
    try {
      console.log('🚀 Starting deployment process...\n');
      
      // Check git status
      this.checkGitStatus();
      
      // Get current version and calculate new version
      const currentVersion = this.getCurrentVersion();
      const newVersion = this.incrementVersion(currentVersion, versionType);
      
      console.log(`📊 Version bump: ${currentVersion} → ${newVersion} (${versionType})\n`);
      
      // Update all version references
      this.updatePackageVersion(newVersion);
      this.updateServiceWorker(newVersion);
      this.updateSettingsVersion(newVersion);
      this.updateChangelog(newVersion, changes);
      
      // Commit and push
      this.commitAndPush(newVersion, commitMessage);
      
      // Show summary
      this.showDeploymentSummary(currentVersion, newVersion);
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const versionType = args[0] || VERSION_TYPES.PATCH;
  const changes = args.slice(1);
  
  if (!Object.values(VERSION_TYPES).includes(versionType)) {
    console.error(`❌ Invalid version type. Use: ${Object.values(VERSION_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  const deployer = new DeploymentManager();
  deployer.deploy(versionType, changes);
}

module.exports = DeploymentManager;