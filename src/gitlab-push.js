'use strict';

const https = require('https');

/**
 * Creates a tag via the GitLab API.
 * @param {string} tagName - The tag name
 * @param {string} message - The tag message
 * @param {string} projectPath - GitLab project path (e.g., "group/project")
 * @param {string} serverHost - GitLab server hostname
 * @param {string} accessToken - GitLab access token
 * @param {string} ref - Git ref to tag (branch name or commit SHA)
 * @returns {Promise<Object>} API response
 */
function createTagViaAPI(tagName, message, projectPath, serverHost, accessToken, ref) {
  return new Promise((resolve, reject) => {
    const projectId = encodeURIComponent(projectPath);
    
    const postData = JSON.stringify({
      tag_name: tagName,
      ref: ref,
      message: message,
    });
    
    const options = {
      hostname: serverHost,
      port: 443,
      path: `/api/v4/projects/${projectId}/repository/tags`,
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': accessToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          let errorMessage = `GitLab API request failed with status ${res.statusCode}`;
          try {
            const errorData = JSON.parse(data);
            if (errorData.message) {
              errorMessage += `: ${JSON.stringify(errorData.message)}`;
            }
            if (res.statusCode === 401) {
              errorMessage += '\n\nAuthentication failed. The AGILEFLOW_TOKEN is invalid or expired.';
              errorMessage += '\nTo fix this:';
              errorMessage += '\n1. Go to your project Settings > Access Tokens';
              errorMessage += '\n2. Check the expiration date of your AgileFlow Bot token';
              errorMessage += '\n3. If expired, create a new token or extend the existing one';
            } else if (res.statusCode === 403) {
              errorMessage += '\n\nPermission denied. The AGILEFLOW_TOKEN needs "api" scope and maintainer role.';
              errorMessage += '\nTo fix this:';
              errorMessage += '\n1. Go to your project Settings > Access Tokens';
              errorMessage += '\n2. Ensure your AgileFlow Bot token has "api" scope and maintainer role';
              errorMessage += '\n3. If permissions are insufficient, create a new token with proper permissions';
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
    
    req.write(postData);
    req.end();
  });
}

/**
 * Pushes a tag to GitLab via the API.
 * Requires AGILEFLOW_TOKEN environment variable.
 * Uses CI_SERVER_HOST and CI_PROJECT_PATH from GitLab CI environment.
 * @param {string} tagName - The tag name
 * @param {string} message - The tag message
 * @returns {Promise<void>}
 */
async function pushTag(tagName, message) {
  const accessToken = process.env.AGILEFLOW_TOKEN;
  const serverHost = process.env.CI_SERVER_HOST;
  const projectPath = process.env.CI_PROJECT_PATH;
  const commitSha = process.env.CI_COMMIT_SHA;
  
  if (!accessToken) {
    const projectUrl = serverHost && projectPath ? `https://${serverHost}/${projectPath}` : 'your-project';
    const projectTokenUrl = `${projectUrl}/-/settings/access_tokens`;
    const cicdUrl = `${projectUrl}/-/settings/ci_cd#js-cicd-variables-settings`;
    
    throw new Error(
      `AGILEFLOW_TOKEN environment variable is required but not set.\n\n` +
      `To fix this:\n` +
      `1. Create a project access token: ${projectTokenUrl}\n` +
      `   - Name: AgileFlow Bot\n` +
      `   - Role: maintainer\n` +
      `   - Scopes: api\n` +
      `2. Add it as a CI/CD variable: ${cicdUrl}\n` +
      `   - Variable key: AGILEFLOW_TOKEN\n` +
      `   - Protect variable: Yes (recommended)`
    );
  }
  
  if (!serverHost) {
    throw new Error('CI_SERVER_HOST environment variable is not set. Are you running inside GitLab CI?');
  }
  
  if (!projectPath) {
    throw new Error('CI_PROJECT_PATH environment variable is not set. Are you running inside GitLab CI?');
  }
  
  if (!commitSha) {
    throw new Error('CI_COMMIT_SHA environment variable is not set. Are you running inside GitLab CI?');
  }
  
  await createTagViaAPI(tagName, message || tagName, projectPath, serverHost, accessToken, commitSha);
}

module.exports = {
  pushTag,
};

