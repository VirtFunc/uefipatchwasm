# Qt for wasm Docker build environment

This directory contains a `Dockerfile` to create a Docker image for building UEFIPatch 0.28.0 for wasm.

## simple build

Just run 
```bash
cd src
./fullbuild.sh
```

## (alternative) Building the Docker image

To build the Docker image, run the following:

```bash
cd src
docker build --network host -t qt-wasm-builder .
```

This process will take a while as it downloads and compiles both Emscripten and Qt.

## Running the container + build (omit /src/build_uefipatch.sh for a shell)

```bash
docker run -it --rm -v $(pwd):/src qt-wasm-builder /src/build_uefipatch.sh

## Reset / Delete the build environment

Fast commands to completely remove and rebuild the Docker image:

```bash
# 1. Remove any containers based on the image (if any)
docker ps -a --filter ancestor=qt-wasm-builder
docker rm -f $(docker ps -aq --filter ancestor=qt-wasm-builder) 2>/dev/null

# 2. Remove the image itself
docker rmi qt-wasm-builder

# (Optional) 3. Prune dangling build cache layers
docker builder prune -f

# 4. Rebuild clean (no cache)
docker build --no-cache --network host -t qt-wasm-builder .
```

Minimal reset (just force a clean rebuild without deleting other images):

```bash
docker build --no-cache --network host -t qt-wasm-builder .
```