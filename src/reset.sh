#!/bin/bash
docker ps -a --filter ancestor=qt-wasm-builder
docker rm -f $(docker ps -aq --filter ancestor=qt-wasm-builder) 2>/dev/null

docker rmi qt-wasm-builder

docker builder prune -f

docker build --no-cache -t qt-wasm-builder .