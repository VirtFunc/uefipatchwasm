#!/bin/bash
set -e
# build the build environment
docker build --network host -t qt-wasm-builder .
# build the project
docker run -it --rm -v $(pwd):/src qt-wasm-builder /src/build_uefipatch.sh
# make the output directory
# extract the .wasm, and .js with cp
cp UEFITool/UEFIPatch/output/UEFIPatch.wasm ../
cp UEFITool/UEFIPatch/output/UEFIPatch.js ../