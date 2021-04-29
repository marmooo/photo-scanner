base_dir=${HOME}/workspace
emsdk_dir=${base_dir}/emsdk/upstream/emscripten
opencv_dir=${base_dir}/opencv
build_dir=${opencv_dir}/platforms/js

python ${build_dir}/build_js.py ${opencv_dir}/build_wasm_min --build_wasm \
  --clean_build_dir \
  --config ${build_dir}/opencv_js.config_min.py \
  --emscripten_dir ${emsdk_dir}
cp ${opencv_dir}/build_wasm_min/bin/opencv.js src/js

