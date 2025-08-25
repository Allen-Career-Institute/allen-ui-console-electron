#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * This script validates that all required environment variables are set
 * before the build process starts.
 */

const requiredEnvVars = [
  'NODE_ENV',
  'ASTRA_ELECTRON_SENTRY_DSN',
  'ASTRA_ELECTRON_SENTRY_ENDPOINT',
];

const optionalEnvVars = ['STAGE_URL', 'PROD_URL', 'CUSTOM_URL', 'DEV_URL'];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;
const missingVars = [];
const setVars = [];

// Check required environment variables
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    setVars.push(envVar);
    console.log(`✅ ${envVar}: ${process.env[envVar]}`);
  } else {
    missingVars.push(envVar);
    console.log(`❌ ${envVar}: NOT SET`);
    hasErrors = true;
  }
});

// Check optional environment variables
optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`⚠️  ${envVar}: ${process.env[envVar]} (optional)`);
  } else {
    console.log(`ℹ️  ${envVar}: NOT SET (optional, using default)`);
  }
});

console.log('\n📊 Summary:');
console.log(`- Total required variables: ${requiredEnvVars.length}`);
console.log(`- Variables set: ${setVars.length}`);
console.log(`- Variables missing: ${missingVars.length}`);

if (hasErrors) {
  console.log(
    '\n❌ Build cannot proceed. Missing required environment variables:'
  );
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log(
    '\n💡 Make sure these variables are set in your GitHub Actions secrets or environment.'
  );
  process.exit(1);
} else {
  console.log(
    '\n✅ All required environment variables are set. Build can proceed.'
  );
  process.exit(0);
}
