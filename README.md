# AgileFlow

## Deployment

```bash
docker login registry.logickernel.com
```

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile \
  -t registry.logickernel.com/kernel/agileflow:`cat VERSION` \
  --push \
  .
```

Inspect image

```bash
docker buildx imagetools inspect registry.logickernel.com/kernel/agileflow:`cat VERSION`
```