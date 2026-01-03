const {
  processVersionInfo,
} = require('./utils');


async function main(branch = 'main') {
  try {
    console.log('Starting AgileFlow versioning process...');

    // Process version info (includes validation and tag fetching)
    const { previousVersion, nextVersion, commits, changelog } = await processVersionInfo(branch);
    
    console.log(`Previous version: ${previousVersion || 'none found'}`);
    console.log(`Next version: ${nextVersion}`);
    console.log(`Found ${commits.length} commits since latest version`);
    console.log(`\nChangelog:\n${changelog}`); 

  } catch (err) {
    console.error('\nError during AgileFlow versioning:', err.message);
    if (err && err.status) {
      process.exit(err.status);
    }
    process.exit(1);
  }
}

// Export main function when required as a module
module.exports = main;
