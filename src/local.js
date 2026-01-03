const { processVersionInfo } = require('./utils');

async function main(branch = 'main') {
  try {
    const { previousVersion, nextVersion, commits, changelog } = await processVersionInfo(branch);
    
    console.log(`Previous version: ${previousVersion || 'none'}`);
    console.log(`Next version: ${nextVersion}`);
    console.log(`Commits since latest version: ${commits.length}`);
    console.log(`\nChangelog:\n${changelog}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(err.status || 1);
  }
}

module.exports = main;
