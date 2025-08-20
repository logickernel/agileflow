# AgileFlow

# GitLab CI

```yml
agileflow:
  image: registry.logickernel.com/kernel/agileflow:0.6.4
  script:
    - agileflow gitlab-ci
  only:
    - /^release\/[0-9]+\.[0-9]+$/
```

