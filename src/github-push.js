'use strict';

const https = require('https');

/**
 * Creates a tag via the GitHub API.
 * GitHub requires creating a tag object first, then a reference.
 * @param {string} tagName - The tag name
 * @param {string} message - The tag message
 * @param {string} repository - GitHub repository (e.g., "owner/repo")
 * @param {string} accessToken - GitHub access token
 * @param {string} commitSha - The commit SHA to tag
 * @returns {Promise<Object>} API response
 */
async function createTagViaAPI(tagName, message, repository, accessToken, commitSha) {
  // Step 1: Create an annotated tag object
  const tagObject = await makeRequest({
    method: 'POST',
    path: `/repos/${repository}/git/tags`,
    accessToken,
    body: {
      tag: tagName,
      message: message,
      object: commitSha,
      type: 'commit',
    },
  });
  
  // Step 2: Create a reference pointing to the tag object
  await makeRequest({
    method: 'POST',
    path: `/repos/${repository}/git/refs`,
    accessToken,
    body: {
      ref: `refs/tags/${tagName}`,
      sha: tagObject.sha,
    },
  });
  
  return tagObject;
}

/**
 * Makes an HTTPS request to the GitHub API.
 * @param {{method: string, path: string, accessToken: string, body?: Object}} options
 * @returns {Promise<Object>}
 */
function makeRequest({ method, path, accessToken, body }) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'AgileFlow',
        'Content-Type': 'application/json',
        ...(body && { 'Content-Length': Buffer.byteLength(postData) }),
      },
    };
    
    const MAX_RESPONSE_BYTES = 1024 * 1024; // 1 MB
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        if (data.length + chunk.length > MAX_RESPONSE_BYTES) {
          req.destroy(new Error('GitHub API response exceeded size limit'));
          return;
        }
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          let errorMessage = `GitHub API request failed with status ${res.statusCode}`;
          try {
            const errorData = JSON.parse(data);
            if (errorData.message) {
              errorMessage += `: ${errorData.message}`;
            }
            if (res.statusCode === 401) {
              errorMessage += '\n\nAuthentication failed. The AGILEFLOW_TOKEN is invalid or expired.';
              errorMessage += '\nTo fix this:';
              errorMessage += '\n1. Go to your repository Settings > Secrets and variables > Actions';
              errorMessage += '\n2. Create a secret named AGILEFLOW_TOKEN with a Personal Access Token';
              errorMessage += '\n3. The token needs "contents: write" permission';
            } else if (res.statusCode === 403) {
              errorMessage += '\n\nPermission denied. The AGILEFLOW_TOKEN needs "contents: write" permission.';
              errorMessage += '\nTo fix this:';
              errorMessage += '\n1. Ensure your token has "contents: write" scope';
              errorMessage += '\n2. If using GITHUB_TOKEN, add permissions to your workflow';
            } else if (res.statusCode === 422) {
              errorMessage += '\n\nThe tag may already exist or the reference is invalid.';
            }
          } catch {
            if (data) {
              errorMessage += `\nResponse: ${data}`;
            }
          }
          reject(new Error(errorMessage));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Pushes a tag to GitHub via the API.
 * Requires AGILEFLOW_TOKEN environment variable.
 * Uses GITHUB_REPOSITORY and GITHUB_SHA from GitHub Actions environment.
 * @param {string} tagName - The tag name
 * @param {string} message - The tag message
 * @param {boolean} quiet - If true, suppress success message
 * @returns {Promise<void>}
 */
async function pushTag(tagName, message, remote = 'origin') {
  const accessToken = process.env.AGILEFLOW_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const commitSha = process.env.GITHUB_SHA;
  
  if (!accessToken) {
    throw new Error(
      `AGILEFLOW_TOKEN environment variable is required but not set.\n\n` +
      `To fix this:\n` +
      `1. Create a Personal Access Token with "contents: write" permission\n` +
      `2. Add it as a repository secret named AGILEFLOW_TOKEN\n` +
      `3. In your workflow, add: env: AGILEFLOW_TOKEN: \${{ secrets.AGILEFLOW_TOKEN }}`
    );
  }
  
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY environment variable is not set. Are you running inside GitHub Actions?');
  }
  
  if (!commitSha) {
    throw new Error('GITHUB_SHA environment variable is not set. Are you running inside GitHub Actions?');
  }
  
  await createTagViaAPI(tagName, message || tagName, repository, accessToken, commitSha);
  
  console.log(`Tag ${tagName} created and pushed successfully.`);
}

module.exports = {
  pushTag,
};

