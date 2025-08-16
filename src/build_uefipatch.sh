#!/bin/bash
# to be run in docker, exit if not in docker
if [ ! -f /.dockerenv ]; then
  echo "This script must be run inside a Docker container."
  exit 1
fi

cd /src/UEFITool/UEFIPatch

#terrible hack to make it build.
mkdir -p /opt/qt5-wasm/src/plugins/platforms/wasm/
# tee /opt/qt5-wasm/src/plugins/platforms/wasm/wasm_shell.html > /dev/null <<'EOF'
# <!doctype html>
# <html>
# <head><meta charset="utf-8"><title>@APPNAME@</title></head>
# <body>
#   <h1>@APPNAME@</h1>
#   <!-- qmake will replace @APPNAME@ with your app name -->
#   <script src="@APPNAME@.js"></script>
# </body>
# </html>
# EOF

# tee /opt/qt5-wasm/src/plugins/platforms/wasm/qtloader.js > /dev/null <<'EOF'
# // minimal stub qtloader.js (satisfies qmake's copy)
# console.log('qtloader stub');
# EOF
# tee /opt/qt5-wasm/src/plugins/platforms/wasm/qtlogo.svg > /dev/null <<'EOF'
# <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
#   <rect width="100%" height="100%" fill="#ddd"/>
#   <text x="50%" y="50%" alignment-baseline="middle" text-anchor="middle" font-size="18">@</text>
# </svg>
# EOF

touch /opt/qt5-wasm/src/plugins/platforms/wasm/wasm_shell.html
touch /opt/qt5-wasm/src/plugins/platforms/wasm/qtloader.js
touch /opt/qt5-wasm/src/plugins/platforms/wasm/qtlogo.svg

/opt/qt5-wasm/bin/qmake
make -j$(nproc)