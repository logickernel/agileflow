# Other CI/CD Platforms

For platforms without a native AgileFlow integration, use the `push` command. It creates an annotated git tag and pushes it to a git remote using standard git commands and your existing credentials.

```bash
agileflow push           # push to origin (default)
agileflow push upstream  # push to a different remote
```

---

## Basic setup

Configure git identity and credentials in your CI environment, then run:

```bash
git config user.name "CI Bot"
git config user.email "ci@example.com"
npx @logickernel/agileflow push
```

Then configure your CI platform to trigger build/deploy pipelines on tag creation.

---

## Examples

### Jenkins

```groovy
pipeline {
  agent any
  stages {
    stage('Version') {
      when { branch 'main' }
      steps {
        sh '''
          git config user.name "Jenkins"
          git config user.email "jenkins@example.com"
          npx @logickernel/agileflow push
        '''
      }
    }
  }
}
```

### Bitbucket Pipelines

```yaml
pipelines:
  branches:
    main:
      - step:
          name: Version
          script:
            - git config user.name "Bitbucket Pipelines"
            - git config user.email "ci@example.com"
            - npx @logickernel/agileflow push
```

### CircleCI

```yaml
jobs:
  version:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Create version tag
          command: |
            git config user.name "CircleCI"
            git config user.email "ci@example.com"
            npx @logickernel/agileflow push

workflows:
  main:
    jobs:
      - version:
          filters:
            branches:
              only: main
```

---

## Requirements

- Git credentials must be configured for push access to the remote
- The CI runner must have network access to the git remote
- Your platform must support triggering pipelines on tag events
