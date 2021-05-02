# Setup
#   https://qiita.com/wjs_fxf/items/92b582ab3baf28528e4c
# Version
#   OpenCV 4.5.2
#   Emscripten SDK 1.40.1
base_dir=${HOME}/workspace
emsdk_dir=${base_dir}/emsdk
opencv_dir=${base_dir}/opencv
build_dir=${opencv_dir}/platforms/js

source ${emsdk_dir}/emsdk_env.sh
emcmake python ${build_dir}/build_js.py ${opencv_dir}/build_wasm --build_wasm \
  --clean_build_dir \
  --config opencv_js.config_min.py \
  --opencv_dir ${opencv_dir} \
  --emscripten_dir ${emsdk_dir}/upstream/emscripten
cp ${opencv_dir}/build_wasm/bin/opencv.js src/js

