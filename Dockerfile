FROM node:20-alpine

RUN apk add --no-cache git openssh-client

WORKDIR /workspace

# Install CLI and scripts into PATH so sub-require works
COPY scripts/ /usr/local/bin/
RUN chmod +x /usr/local/bin/agileflow

ENV PATH="/usr/local/bin:${PATH}"

# Default command shows help; CLI dispatches to subcommands
CMD ["agileflow", "--help"]