function findApprox(src) {
  const dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  // 2値化
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
  cv.adaptiveThreshold(
    dst,
    dst,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    99,
    0,
  );
  // 輪郭抽出して最大面積の領域を処理対象に
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(
    dst,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE,
  );
  dst.delete();
  let maxPos = 0;
  let maxSize = 0;
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const size = cv.contourArea(cnt, false);
    if (maxSize < size) {
      maxSize = size;
      maxPos = i;
    }
    cnt.delete();
  }
  // 直線近似
  const cnt = contours.get(maxPos);
  contours.delete();
  const poly = new cv.MatVector();
  const approx = new cv.Mat();
  // 大解像度に対応しやすい
  cv.approxPolyDP(cnt, approx, 0.05 * cv.arcLength(cnt, true), true);
  // cv.approxPolyDP(cnt, approx, 10, true);
  poly.push_back(approx);
  if (approx.total() == 4) {
    const color = new cv.Scalar(255, 0, 0, 0); // TODO: なぜか 0 になる
    cv.drawContours(src, poly, 0, color, 4, cv.LINE_8, hierarchy, 0);
  }
  hierarchy.delete();
  cnt.delete();
  poly.delete();
  return approx;
}

function affineImage(imageData, filterStatus) {
  // https://qiita.com/otolab/items/0247b59378ac9717c654
  const src = cv.matFromImageData(imageData);
  const approx = findApprox(src);

  // 四角形なら台形変換
  if (approx.total() == 4) {
    const r = approx.data32S.slice(0, 8);
    // const srcM = cv.matFromArray(4, 1, cv.CV_32FC2, sortPoints(r));  // バグあり
    const srcM = cv.matFromArray(4, 1, cv.CV_32FC2, r);
    const [w, h] = calcContourCanvasSize(r, src.rows, src.cols);
    const dsize = new cv.Size(w, h);
    const dstM = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, 0, h, w, h, w, 0]);
    const M = cv.getPerspectiveTransform(srcM, dstM);
    cv.warpPerspective(
      src,
      src,
      M,
      dsize,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(),
    );
    M.delete();
    if (filterStatus == "1") {
      denoiseImage(src);
    } else if (filterStatus == "2") {
      deepDenoiseImage(src);
    }
  }
  const result = new ImageData(
    new Uint8ClampedArray(src.data, src.cols, src.rows),
  );
  approx.delete();
  src.delete();
  return result;
}

function denoiseImage(src) {
  // https://stackoverflow.com/questions/44752240/
  const rgbaPlanes = new cv.MatVector();
  const resultPlanes = new cv.MatVector();
  cv.split(src, rgbaPlanes);
  for (let i = 0; i < 3; i++) {
    const mat = rgbaPlanes.get(i);
    const dst = new cv.Mat();
    const M = cv.Mat.ones(7, 7, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    cv.dilate(
      mat,
      dst,
      M,
      anchor,
      1,
      cv.BORDER_CONSTANT,
      cv.morphologyDefaultBorderValue(),
    );
    cv.medianBlur(dst, dst, 21);
    const color = new cv.Scalar(255, 255, 255, 0);
    const black = new cv.Mat(mat.rows, mat.cols, cv.CV_8UC1, color);
    cv.absdiff(mat, dst, dst);
    cv.subtract(black, dst, mat);
    cv.normalize(mat, mat, alpha = 0, beta = 255, norm_type = cv.NORM_MINMAX);
    resultPlanes.push_back(mat);
    mat.delete();
    M.delete();
    dst.delete();
    black.delete();
  }
  cv.merge(resultPlanes, src);
  rgbaPlanes.delete();
  resultPlanes.delete();
  return src;
}

importScripts("/photo-scanner/js/opencv.js");

self.addEventListener("message", (event) => {
  const d = event.data;
  if (d.type == "affineImage") {
    d.type = "result";
    console.log(d.src);
    d.src = affineImage(d.src, d.denoise); // TODO: なぜか動かない
    postMessage(event.data);
  }
});

// let model;  // wasm だと resizeNearestNeighbour が使えない
// tf.setBackend('wasm').then(function() {
//   tf.loadLayersModel('denoise/model.json')
//     .then(pretrainedModel => {
//       model = pretrainedModel;
//     });
// });
let model;
tf.loadLayersModel("/photo-scanner/denoise/model.json")
  .then((pretrainedModel) => {
    model = pretrainedModel;
  });
function deepDenoiseImage(src) {
  try {
    const dst = new cv.Mat();
    // リサイズしないと WebGL の上限に抵触
    cv.resize(src, dst, new cv.Size(256, 256), 0, 0, cv.INTER_NEAREST);
    const score = tf.tidy(() => {
      const channels = 3;
      // let input = tf.browser.fromPixels(src, channels).expandDims(0)
      cv.cvtColor(dst, dst, cv.COLOR_RGBA2RGB, 0);
      let input = tf.tensor3d(new Uint8Array(dst.data), [
        dst.rows,
        dst.cols,
        channels,
      ])
        .expandDims(0).toFloat();
      input = tf.cast(input, "float32").div(tf.scalar(255));
      const denoised = model.predict(input).mul(tf.scalar(255)).dataSync();
      const arr = new Uint8ClampedArray(dst.rows * dst.cols * 4);
      for (let i = 0; i < denoised.length; i += 3) {
        const j = i * 3 / 4;
        arr[j] = denoised[i]; // R value
        arr[j + 1] = denoised[i + 1]; // G value
        arr[j + 2] = denoised[i + 2]; // B value
        arr[j + 3] = 0; // A value
      }
      const res = new ImageData(arr, 256, 256);
      const m = cv.matFromImageData(res);
      cv.resize(m, m, new cv.Size(src.rows, src.cols), 0, 0, cv.INTER_NEAREST);
      cv.absdiff(src, src, m);
      dst.delete();
      return denoised;
    });
    return score;
  } catch (err) {
    alert(err);
    console.log(err);
  }
}
