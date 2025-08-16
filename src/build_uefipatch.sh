#!/bin/bash
# to be run in docker, exit if not in docker
if [ ! -f /.dockerenv ]; then
  echo "This script must be run inside a Docker container."
  echo "Please use ./build.sh or see other uses in the README"
  exit 1
fi

cd /src/UEFITool/UEFIPatch

#terrible hack to make it build. 
#unfortunately Qt unconditionally requires these files and theres no easy way to disable this behavior
#you could modify the .prf files, but thats not very clean.
mkdir -p /opt/qt5-wasm/src/plugins/platforms/wasm/
touch /opt/qt5-wasm/src/plugins/platforms/wasm/wasm_shell.html
touch /opt/qt5-wasm/src/plugins/platforms/wasm/qtloader.js
touch /opt/qt5-wasm/src/plugins/platforms/wasm/qtlogo.svg

/opt/qt5-wasm/bin/qmake
make -j$(nproc)