# Version
#   OpenCV 4.5.4
#   Emscripten SDK 2.0.31
base_dir=${HOME}/workspace
emsdk_dir=${base_dir}/emsdk
opencv_dir=${base_dir}/opencv
build_dir=${opencv_dir}/platforms/js

source ${emsdk_dir}/emsdk_env.sh
python ${build_dir}/build_js.py ${opencv_dir}/build_wasm --build_wasm \
  --clean_build_dir \
  --config opencv_js.config_min.py \
  --opencv_dir ${opencv_dir} \
  --emscripten_dir ${emsdk_dir}/upstream/emscripten
cp ${opencv_dir}/build_wasm/bin/opencv.js src/js

