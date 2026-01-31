# Maintainerr + Plex Docker Development Environment

This directory contains a Docker Compose setup for testing Maintainerr. It can build Maintainerr from **any branch** and connect to your existing Plex server.

## Quick Start

```bash
cd docker-dev

# Start with default branch
docker compose up -d

# Or build from a specific branch
BRANCH=main docker compose up -d --build

# Build from a fork
REPO=https://github.com/yourfork/Maintainerr.git BRANCH=my-feature docker compose up -d --build
```

## Access Points

| Service     | URL                   | Description        |
| ----------- | --------------------- | ------------------ |
| Maintainerr | http://localhost:6246 | Maintainerr web UI |

## Configuration

### Configure Maintainerr with Plex

1. Open http://localhost:6246
2. Complete initial setup if prompted
3. Go to **Settings** → **Media Server**
4. Select **Plex** as the media server type
5. Enter your Plex server connection details:
   - **URL**: Your Plex server URL
   - **Token**: Your Plex authentication token
6. Click **Test Connection** then **Save**

## Testing Different Branches

### Build from a specific branch

```bash
# Rebuild with a different branch
BRANCH=develop docker compose up -d --build

# Force rebuild without cache
BRANCH=my-feature docker compose build --no-cache
docker compose up -d
```

### Build from a fork

```bash
REPO=https://github.com/yourfork/Maintainerr.git BRANCH=my-fixes docker compose up -d --build
```

### Compare branches

```bash
# Terminal 1: Run main branch on port 6246
BRANCH=main docker compose -p maintainerr-main up -d

# Terminal 2: Run feature branch on port 6247
# (modify docker-compose.yml ports first)
BRANCH=my-feature docker compose -p maintainerr-feature up -d
```

## Directory Structure

After running, the following directories are created:

```
docker-dev/
├── docker-compose.yml      # Main compose configuration
├── Dockerfile.dev          # Builds Maintainerr from any branch
├── README.md               # This file
├── start.sh                # Container startup script
└── maintainerr-data/       # Persistent data (auto-created)
    ├── logs/               # Application logs
    └── maintainerr.db      # SQLite database
```

## Persistent Data

All Maintainerr data is stored in `./maintainerr-data/` which is mounted as `/opt/data` inside the container. This includes:

- SQLite database
- Application logs
- Configuration

To completely reset Maintainerr:

```bash
docker compose down -v
rm -rf maintainerr-data/
docker compose up -d
```

## Troubleshooting

### Viewing Logs

```bash
# All services
docker compose logs -f

# Just Maintainerr
docker compose logs -f maintainerr
```

### Rebuilding from Scratch

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Connection Issues

If Maintainerr can't connect to your Plex server:

1. Verify your Plex server is accessible from the Docker container
2. Check if you need to use host networking: `network_mode: host` in docker-compose.yml
3. Verify your Plex token is correct

### Port Conflicts

If port 6246 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "6247:6246"  # Use 6247 instead
```

## Advanced Usage

### Custom Environment Variables

Edit `docker-compose.yml` to add environment variables:

```yaml
environment:
  - DEBUG=true
  - LOG_LEVEL=debug
```

### Accessing the Container

```bash
docker compose exec maintainerr sh
```

### Using Host Networking

If you need to access services on your host machine, use host networking:

```yaml
maintainerr:
  network_mode: host
  # Remove the 'ports' section when using host networking
```

## Clean Up

```bash
# Stop containers and remove volumes
docker compose down -v

# Also remove built images
docker compose down -v --rmi all
```
