# This build script is designed to be used with the following build script.
#   https://github.com/marmooo/mini-web-apps/blob/main/opencv/embindgen.py
# It has the ability to cache builds and minimize output.
# You can use it by replacing the original script below.
#   ${opencv_dir}/modules/js/generator/embindgen.py
# You can also build wasm without my build script, but reconfigure cmake_options.
base_dir=${HOME}/workspace
emsdk_dir=${base_dir}/emsdk  # 3.1.74
opencv_dir=${base_dir}/opencv  # 4.11.0
opencv_contrib_dir=${base_dir}/opencv_contrib  # 4.11.0
build_py=${opencv_dir}/platforms/js/build_js.py
build_wasm_dir=${opencv_dir}/build_wasm
build_simd_dir=${opencv_dir}/build_simd
build_threads_dir=${opencv_dir}/build_threads
build_threaded_simd_dir=${opencv_dir}/build_threaded-simd
options="\
  --build_wasm \
  --cmake_option="-DBUILD_ZLIB=OFF" \
  --cmake_option="-DBUILD_opencv_calib3d=ON" \
  --cmake_option="-DBUILD_opencv_dnn=ON" \
  --cmake_option="-DBUILD_opencv_features2d=ON" \
  --cmake_option="-DBUILD_opencv_flann=ON" \
  --cmake_option="-DBUILD_opencv_imgcodecs=ON" \
  --cmake_option="-DBUILD_opencv_photo=ON" \
  --cmake_option="-DBUILD_opencv_video=ON" \
  --cmake_option="-DBUILD_opencv_xphoto=ON" \
  --cmake_option="-DBUILD_opencv_ximgproc=ON" \
  --cmake_option="-DBUILD_EXAMPLES=OFF" \
  --cmake_option="-DOPENCV_EXTRA_MODULES_PATH=${opencv_contrib_dir}/modules" \
  --config whitelist.json \
  --disable_single_file \
  --opencv_dir ${opencv_dir} \
  --emscripten_dir ${emsdk_dir}/upstream/emscripten"

source ${emsdk_dir}/emsdk_env.sh

rm -rf ${build_wasm_dir}/bin/*
python ${build_py} ${build_wasm_dir} ${options}
cp ${build_wasm_dir}/bin/* src/opencv/wasm/

rm -rf ${build_simd_dir}/bin/*
python ${build_py} ${build_simd_dir} ${options} --simd
cp ${build_simd_dir}/bin/* src/opencv/simd/

rm -rf ${build_threads_dir}/bin/*
python ${build_py} ${build_threads_dir} ${options} --threads
cp ${build_threads_dir}/bin/* src/opencv/threads/

rm -rf ${build_threaded_simd_dir}/bin/*
python ${build_py} ${build_threaded_simd_dir} ${options} --simd --threads
cp ${build_threaded_simd_dir}/bin/* src/opencv/threaded-simd/
