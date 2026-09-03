#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

source "$ENV_FILE"

if [ -z "$DEPLOY_DEST" ]; then
    echo "Error: DEPLOY_DEST is not set in .env"
    exit 1
fi

rsync -av --delete "$ROOT_DIR/dist/" "$DEPLOY_DEST/"
echo "Deploy complete: $ROOT_DIR/dist -> $DEPLOY_DEST"
