# Agileflow

```bash
    # Instructions for GitLab and GitHub
    echo "Instructions:"
    echo
    echo "1. GitLab Deploy Key Setup:"
    echo "   - Navigate to your project: Settings > Repository > Deploy Keys."
    echo "   - Click 'Add deploy key'."
    echo "   - Paste the public key (shown above) into the 'Key' field."
    echo "   - Check 'Write access allowed'."
    echo "   - Click 'Add key'."
    echo
    echo "2. GitHub Deploy Key Setup:"
    echo "   - Navigate to your repository: Settings > Deploy keys."
    echo "   - Click 'Add deploy key'."
    echo "   - Paste the public key (shown above) into the 'Key' field."
    echo "   - Check 'Allow write access'."
    echo "   - Click 'Add key'."
    echo
    echo "3. Setting up the Private Key as a CI/CD Variable:"
    echo
    echo "   For GitLab CI/CD:"
    echo "   - Go to Settings > CI/CD > Variables."
    echo "   - Click 'Add variable'."
    echo "   - Set the 'Key' as 'DEPLOY_KEY_FILE'."
    echo "   - Paste the private key (shown above) in the 'Value' field."
    echo "   - Mark 'Protected' and 'Masked' (if applicable) options."
    echo "   - Set 'Variable type' to 'File'."
    echo
    echo "   For GitHub Actions:"
    echo "   - Go to Settings > Secrets and variables > Actions > New repository secret."
    echo "   - Click 'New repository secret'."
    echo "   - Set the 'Name' as 'DEPLOY_KEY_BASE64'."
    echo "   - Paste the base64-encoded private key (shown above) in the 'Secret' field."
    echo "   - Click 'Add secret'."
    echo
    echo "Ensure that the GitLab CI/CD job or GitHub Actions workflow uses these variables correctly."
    echo "In GitLab, the variable will be available as a file, while in GitHub, you'll need to decode it using base64."
```