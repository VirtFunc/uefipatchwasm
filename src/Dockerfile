# Use a stable base image
FROM debian:trixie

# Set environment variables to non-interactive
ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies for Qt and Emscripten
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    python-is-python3 \
    python3-setuptools \
    wget \
    xz-utils \
    ca-certificates \
    llvm \
    libxml2 \
    # Qt dependencies
    libfontconfig1-dev \
    libdbus-1-dev \
    libfreetype6-dev \
    libicu-dev \
    libinput-dev \
    libxkbcommon-dev \
    libsqlite3-dev \
    libssl-dev \
    libpng-dev \
    libjpeg-dev \
    libglib2.0-dev \
    # Cleanup
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /opt

# Install Emscripten SDK
ENV EMSDK_VERSION=1.39.8
RUN git clone https://github.com/emscripten-core/emsdk.git && \
    cd emsdk && \
    ./emsdk install ${EMSDK_VERSION} && \
    ./emsdk activate ${EMSDK_VERSION}

# Automatically load emsdk environment for every subsequent RUN
RUN echo 'source /opt/emsdk/emsdk_env.sh >/dev/null 2>&1' > /etc/profile.d/emsdk.sh
SHELL ["/bin/bash","-lc"]

# Set up Qt
ENV QT_VERSION=5.15.15
ENV QT_VERSION_MAJOR_MINOR=5.15
ENV QT_SRC_DIR=/opt/qt-everywhere-src-${QT_VERSION}
ENV QT_WASM_PREFIX=/opt/qt5-wasm

# Download and extract Qt source
RUN wget https://download.qt.io/official_releases/qt/${QT_VERSION_MAJOR_MINOR}/${QT_VERSION}/single/qt-everywhere-opensource-src-${QT_VERSION}.tar.xz && \
    tar xf qt-everywhere-opensource-src-${QT_VERSION}.tar.xz && \
    rm qt-everywhere-opensource-src-${QT_VERSION}.tar.xz

# Build and install Qt for wasm in multiple steps (no need to 'source' each time now)
RUN echo '--- DIAGNOSTICS ---' && echo 'PATH:' && echo $PATH && echo '--- Checking for em++ ---' && which em++ && em++ --version && echo '--- Filesystem check ---' && ls -la /opt/emsdk/upstream/emscripten && echo '--- END DIAGNOSTICS ---'
RUN echo '--- Configuring Qt ---' && cd /opt/qt-everywhere-src-${QT_VERSION} && ./configure -v -opensource -confirm-license \
    -xplatform wasm-emscripten \
    -no-warnings-are-errors \
    -prefix ${QT_WASM_PREFIX} \
    -release \
    -static \
    -no-feature-testlib \
    -no-feature-dbus \
    -no-feature-widgets \
    -no-feature-gui \
    -no-feature-opengl \
    -no-feature-vulkan \
    -no-feature-sql \
    -no-feature-network \
    -no-feature-xml \
    -no-feature-accessibility \
    -no-feature-concurrent \
    -skip qt3d \
    -skip qtactiveqt \
    -skip qtandroidextras \
    -skip qtcanvas3d \
    -skip qtcharts \
    -skip qtconnectivity \
    -skip qtdatavis3d \
    -skip qtdoc \
    -skip qtgamepad \
    -skip qtgraphicaleffects \
    -skip qtimageformats \
    -skip qtlocation \
    -skip qtlottie \
    -skip qtmacextras \
    -skip qtmultimedia \
    -skip qtnetworkauth \
    -skip qtpurchasing \
    -skip qtquickcontrols \
    -skip qtquickcontrols2 \
    -skip qtquicktimeline \
    -skip qtremoteobjects \
    -skip qtscript \
    -skip qtscxml \
    -skip qtsensors \
    -skip qtserialbus \
    -skip qtserialport \
    -skip qtspeech \
    -skip qtsvg \
    -skip qttools \
    -skip qttranslations \
    -skip qtvirtualkeyboard \
    -skip qtwayland \
    -skip qtwebchannel \
    -skip qtwebengine \
    -skip qtwebglplugin \
    -skip qtwebsockets \
    -skip qtwebview \
    -skip qtwinextras \
    -skip qtx11extras \
    -skip qtxmlpatterns
RUN echo '--- Building Qt ---' && cd /opt/qt-everywhere-src-${QT_VERSION} && make -j$(nproc)
RUN echo '--- Installing Qt ---' && cd /opt/qt-everywhere-src-${QT_VERSION} && make install
RUN echo '--- Cleaning up ---' && rm -rf /opt/qt-everywhere-src-${QT_VERSION}

# Set up environment for wasm builds
ENV PATH="/opt/emsdk:/opt/emsdk/upstream/emscripten:${QT_WASM_PREFIX}/bin:${PATH}"
ENV EMSDK_QUIET=1
ENV EM_CONFIG=/opt/emsdk/.emscripten
ENV EM_CACHE=/opt/emsdk/upstream/emscripten/cache
ENV QMAKESPEC=${QT_WASM_PREFIX}/mkspecs/wasm-emscripten

