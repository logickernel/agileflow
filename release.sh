echo "Building and pushing image to registry.logickernel.com/kernel/agileflow:`cat VERSION`"

docker login registry.logickernel.com
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile \
  -t registry.logickernel.com/kernel/agileflow:`cat VERSION` \
  --push \
  .