import {
  Collapse,
  Modal,
  Tooltip,
} from "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/+esm";

function clearConfig() {
  localStorage.clear();
}

function loadConfig() {
  const config = document.getElementById("config");
  const resolution = localStorage.getItem("resolution");
  if (resolution) {
    config.resolution.options[resolution].selected = true;
  }
  config.filter.value = localStorage.getItem("filter");
  document.getElementById("clientId").value = localStorage.getItem("clientId");
  document.getElementById("serverAddress").value = localStorage
    .getItem("serverAddress");
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("overview") == 0) {
    document.getElementById("overview").hidden = true;
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function deleteThumbnails() {
  while (outputElement.firstChild) {
    outputElement.removeChild(outputElement.lastChild);
  }
}

function downloadThumbnails() {
  for (let i = 0; i < outputElement.children.length; i++) {
    const a = document.createElement("a");
    a.download = i + ".jpg";
    a.href = outputElement.children[i].shadowRoot.querySelector("img").src;
    outputElement.appendChild(a);
    a.click();
    outputElement.removeChild(a);
  }
}

function uploadDropbox() {
  const query = parseQueryString(location.hash);
  const clientId = document.getElementById("clientId").value;
  if (clientId != "" && query && query.accessToken) {
    const dbx = new Dropbox.Dropbox({
      fetch: fetch,
      accessToken: query.access_token,
    });
    for (let i = 0; i < outputElement.children.length; i++) {
      const path = "/" + i + ".jpg";
      const base64 =
        outputElement.children[i].shadowRoot.querySelector("img").src;
      dbx.filesUpload({ path: path, contents: base64ToArrayBuffer(base64) })
        .then(() => {
        }).catch((err) => {
          console.log(err);
          alert(err.error.error_summary);
        });
    }
  } else {
    const e = document.getElementById("dropboxAlert");
    e.hidden = false;
    e.scrollIntoView();
  }
}

// https://stackoverflow.com/questions/40998274/
function base64ToArrayBuffer(base64) {
  base64 = base64.slice(base64.indexOf("base64,") + 7);
  const binaryString = globalThis.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64toJpg(base64) {
  const bin = atob(base64.replace(/^.*,/, ""));
  const buffer = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i);
  }
  return new Blob([buffer.buffer], { type: "image/jpeg" });
}

function uploadServer() {
  const serverAddress = document.getElementById("serverAddress").value;
  const formData = new FormData();
  if (serverAddress != "") {
    for (let i = 0; i < outputElement.children.length; i++) {
      let base64 =
        outputElement.children[i].shadowRoot.querySelector("img").src;
      console.log(base64);
      base64 = base64.slice(base64.indexOf("base64,") + 7);
      console.log(base64);
      formData.append("files", base64toJpg(base64), i + ".jpg");
    }
    fetch(serverAddress, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    }).then(() => {
    }).catch((err) => {
      console.log(err);
      alert(err);
    });
  } else {
    const e = document.getElementById("serverAlert");
    e.hidden = false;
    e.scrollIntoView();
  }
}

// https://github.com/dropbox/dropbox-sdk-js/blob/master/examples/javascript/utils.js
function parseQueryString(str) {
  const ret = Object.create(null);

  if (typeof str !== "string") {
    return ret;
  }

  str = str.trim().replace(/^(\?|#|&)/, "");

  if (!str) {
    return ret;
  }

  str.split("&").forEach((param) => {
    const parts = param.replace(/\+/g, " ").split("=");
    // Firefox (pre 40) decodes `%3D` to `=`
    // https://github.com/sindresorhus/query-string/pull/37
    let key = parts.shift();
    let val = parts.length > 0 ? parts.join("=") : undefined;

    key = decodeURIComponent(key);

    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = val === undefined ? null : decodeURIComponent(val);

    if (ret[key] === undefined) {
      ret[key] = val;
    } else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }
  });

  return ret;
}

document.getElementById("reloadApp").addEventListener("click", (event) => {
  e.preventDefault();
  const baseUrl = event.currentTarget.dataset.href;
  const clientId = document.getElementById("clientId").value;
  location.href = baseUrl + "&client_id=" + clientId;
});

class ImageBox extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById("img-box")
      .content.cloneNode(true);
    template.querySelector("img").onclick = (event) => {
      const img = document.getElementById("previewImage");
      img.src = event.currentTarget.src;
      img.width = event.target.naturalWidth;
      img.height = event.target.naturalHeight;
      previewModal.show();
    };
    template.querySelector(".close").onclick = (event) => {
      event.currentTarget.parentNode.parentNode.parentNode.host.remove();
    };
    template.querySelector(".rotate").onclick = (event) => {
      // https://stackoverflow.com/questions/16794310/rotate-image-with-javascript
      const root = event.currentTarget.parentNode.parentNode;
      const img = root.querySelector("img");
      const angle = (parseInt(img.dataset.angle) + 90) % 360;
      if (angle % 180 == 0) {
        root.style.width = img.width + "px";
        root.style.height = img.height + "px";
      } else {
        root.style.width = img.height + "px";
        root.style.height = img.width + "px";
      }
      img.className = "rotate" + angle;
      img.dataset.angle = angle;
    };
    this.attachShadow({ mode: "open" }).appendChild(template);
  }
}
customElements.define("img-box", ImageBox);

function initializeEvents() {
  const closeButtons = document.getElementsByClassName("event-close");
  for (let i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener("click", (event) => {
      const target = event.currentTarget.getAttribute("data-bs-target");
      document.querySelector(target).hidden = true;
    });
  }
  const openButtons = document.getElementsByClassName("event-open");
  for (let i = 0; i < openButtons.length; i++) {
    openButtons[i].addEventListener("click", (event) => {
      const target = event.currentTarget.getAttribute("data-bs-target");
      document.querySelector(target).hidden = false;
    });
  }
  const langSelect = document.getElementById("lang");
  langSelect.onchange = () => {
    const lang = langSelect.options[langSelect.selectedIndex].value;
    location.href = "/photo-scanner/" + lang;
  };
}
initializeEvents();

let animationFrame;
let lastAnimated = 0;
const snapCanvas = document.getElementById("snapCanvas");
const uploadCanvas = document.getElementById("uploadCanvas");
const video = document.createElement("video");
const videoOptions = { video: { facingMode: "environment" } };
const videoCanvas = document.getElementById("videoCanvas");
const videoCanvasContext = videoCanvas.getContext("2d");
const loadingMessage = document.getElementById("loadingMessage");
const outputElement = document.getElementById("output");

// const worker = new Worker('/photo-scanner/worker.js');
// worker.addEventListener('message', (event) => {
//   if (event.data.type == 'result') {
//     const src = cv.matFromImageData(event.data.src);
//     cv.imshow('snapCanvas', src);
//     src.delete();
//     const thumbnail = document.createElement('img-box');
//     const img = thumbnail.shadowRoot.querySelector('img');
//     img.src = snapCanvas.toDataURL('image/jpg');  // webp だとダウンロード時に困る
//     img.height = 150 / snapCanvas.width * snapCanvas.height;
//     outputElement.append(thumbnail);
//   }
// });

if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = (constraints) => {
    const getUserMedia = navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;
    if (!getUserMedia) {
      return Promise.reject(
        new Error("getUserMedia is not implemented in this browser"),
      );
    }
    return new Promise((resolve, reject) => {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

cv.then((cv) => {
  document.getElementById("snapshot").onclick = snapshot;
  document.getElementById("clipboard").onclick = clipboardToThumbnail;
  document.getElementById("selectImages").onclick = () => {
    document.getElementById("inputImages").click();
  };

  function syncVideo(video, options) {
    uploadCanvas.hidden = true;
    if (video.srcObject) {
      video.srcObject.getVideoTracks().forEach((camera) => {
        camera.stop();
      });
    }
    navigator.mediaDevices.getUserMedia(options).then((stream) => {
      videoCanvas.hidden = false;
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      loadingMessage.textContent = "⌛ Loading video...";
      animationFrame = requestAnimationFrame(tickVideo);
    }).catch((_err) => {
      // alert(err.message);
    });
  }
  syncVideo(video, videoOptions);

  document.getElementById("facingMode").onclick = () => {
    if (videoOptions.video.facingMode == "user") {
      videoOptions.video.facingMode = "environment";
    } else {
      videoOptions.video.facingMode = "user";
    }
    syncVideo(video, videoOptions);
  };

  document.getElementById("inputImages").onchange = (event) => {
    loadingMessage.hidden = false;
    loadingMessage.textContent = "⌛ Loading image...";
    cancelAnimationFrame(animationFrame);
    uploadCanvas.hidden = false;
    videoCanvas.hidden = true;
    const files = event.currentTarget.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) {
        if (files[i].type.startsWith("image/svg")) {
          alert("Sorry, SVG is probably not convertible.");
        }
        const url = URL.createObjectURL(files[i]);
        loadImage(uploadCanvas, url);
      }
    }
  };

  function drawRect(videoCanvas) {
    const src = cv.imread(videoCanvas);
    const dst = new cv.Mat();
    cv.resize(
      src,
      dst,
      new cv.Size(videoCanvas.width / 2, videoCanvas.height / 2),
      0,
      0,
      cv.INTER_NEAREST,
    ); // リサイズしないと重い
    const approx = findApprox(dst);
    if (approx.total() == 4) {
      cv.imshow("videoCanvas", dst);
      document.getElementById("snapshot").style.fill = "blue";
    } else {
      document.getElementById("snapshot").style.fill = "black";
    }
    approx.delete();
    src.delete();
    dst.delete();
  }

  function tickVideo() {
    const fps = 30;
    const t = Date.now();
    if (lastAnimated + 1000 / fps < t) {
      lastAnimated = t;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingMessage.hidden = true;
        videoCanvas.width = video.videoWidth;
        videoCanvas.height = video.videoHeight;
        videoCanvasContext.drawImage(
          video,
          0,
          0,
          videoCanvas.width,
          videoCanvas.height,
        );
        drawRect(videoCanvas);
      }
    }
    animationFrame = requestAnimationFrame(tickVideo);
  }

  // findContours で抽出される矩形領域の順序を正しい順序に変換 (バグあり)
  function _sortPoints(p) {
    const ps = [p[0] + p[1], p[2] + p[3], p[4] + p[5], p[6] + p[7]];
    let min = ps[0];
    let max = ps[0];
    let minPos = 0;
    let maxPos = 0;
    for (let i = 1; i < 4; i++) {
      if (max < ps[i]) {
        max = ps[i];
        maxPos = i;
      }
      if (min > ps[i]) {
        min = ps[i];
        minPos = i;
      }
    }
    const minmax = [minPos, maxPos];
    const idx = [0, 1, 2, 3].filter((e) => {
      return !minmax.includes(e);
    });
    let second;
    let fourth;
    if (p[idx[0] * 2] < p[idx[1] * 2]) {
      second = idx[0];
      fourth = idx[1];
    } else {
      second = idx[1];
      fourth = idx[0];
    }
    return [
      p[minPos * 2],
      p[minPos * 2 + 1],
      p[second * 2],
      p[second * 2 + 1],
      p[maxPos * 2],
      p[maxPos * 2 + 1],
      p[fourth * 2],
      p[fourth * 2 + 1],
    ];
  }

  function findApprox(src) {
    const dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    // 2値化
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    const blockSize = (dst.rows + dst.cols) / 8 * 2 + 1; // 縦横幅の 1/4
    cv.adaptiveThreshold(
      dst,
      dst,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      blockSize,
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
    cv.approxPolyDP(cnt, approx, 0.05 * cv.arcLength(cnt, true), true); // 全長 5% 精度
    // cv.approxPolyDP(cnt, approx, 10, true);
    poly.push_back(approx);
    if (approx.total() == 4) {
      const color = new cv.Scalar(255, 255, 255, 0); // TODO: なぜか 0 になる
      cv.drawContours(src, poly, 0, color, 4, cv.LINE_8, hierarchy, 0);
    }
    hierarchy.delete();
    cnt.delete();
    poly.delete();
    return approx;
  }

  function affineImage(src, filterStatus) {
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
    cv.imshow("snapCanvas", src);
    approx.delete();
  }

  function calcContourCanvasSize(r, w, h) {
    const ratio = getConfigRatio();
    if (ratio == 0) {
      // 縦横比を算出するのは大変なので頑張らない
      // 一般論として仮定がもう1つないと縦横比は算出できない
      const l12 = Math.sqrt((r[0] - r[2]) ** 2 + (r[1] - r[3]) ** 2);
      const l23 = Math.sqrt((r[2] - r[4]) ** 2 + (r[3] - r[5]) ** 2);
      const l34 = Math.sqrt((r[4] - r[6]) ** 2 + (r[5] - r[7]) ** 2);
      const l41 = Math.sqrt((r[6] - r[0]) ** 2 + (r[7] - r[2]) ** 2);
      const wNew = l23 + l41;
      const hNew = l12 + l34;
      h = Math.round(w / wNew * hNew);
    } else {
      if (w > h) {
        h = w / ratio;
      } else {
        w = h * ratio;
      }
    }
    return [w, h];
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

  // let model;  // wasm だと resizeNearestNeighbour が使えない
  // tf.setBackend('wasm').then(() => {
  //   tf.loadLayersModel('/photo-scanner/denoise/model.json')
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
      cv.resize(src, dst, new cv.Size(256, 256), 0, 0, cv.INTER_NEAREST); // リサイズしないと WebGL の上限に抵触
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
        cv.resize(
          m,
          m,
          new cv.Size(src.rows, src.cols),
          0,
          0,
          cv.INTER_NEAREST,
        );
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

  function calcSnapSize() {
    const config = document.getElementById("config");
    const area = parseInt(config.resolution.value) * 1000;
    const r = videoCanvas.width / videoCanvas.height;
    const w = Math.sqrt(area / r);
    return [w * r, w];
  }

  function getConfigFilterStatus() {
    const config = document.getElementById("config");
    return config.filter.value;
  }

  function getConfigRatio() {
    const config = document.getElementById("config");
    let v = parseFloat(config.ratio.value);
    if (v == -1) {
      v = document.getElementById("ratioValue").value;
    }
    return v;
  }

  function snapshot() {
    if (video.srcObject) {
      new Audio("camera.mp3").play();
      const [w, h] = calcSnapSize();
      const options = {
        video: {
          facingMode: "environment",
          width: { min: 0, max: w },
          height: { min: 0, max: h },
          aspectRatio: w / h,
        },
      };
      syncCapture(video, options);
    }
  }

  function syncCapture(video, options) {
    uploadCanvas.hidden = true;
    if (video.srcObject) {
      video.srcObject.getVideoTracks().forEach((camera) => {
        camera.stop();
      });
    }
    navigator.mediaDevices.getUserMedia(options).then((stream) => {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      animationFrame = requestAnimationFrame(tickCapture);
    }).catch((_err) => {
      // alert(err.message);
    });
  }

  function tickCapture() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      videoCanvas.width = video.videoWidth;
      videoCanvas.height = video.videoHeight;
      videoCanvasContext.drawImage(
        video,
        0,
        0,
        videoCanvas.width,
        videoCanvas.height,
      );
      snapToThumbnail(videoCanvas);
      syncVideo(video, videoOptions);
      return;
    }
    animationFrame = requestAnimationFrame(tickCapture);
  }

  function loadImage(uploadCanvas, url) {
    const img = new Image();
    img.onload = () => {
      loadingMessage.hidden = true;
      uploadCanvas.width = img.naturalWidth;
      uploadCanvas.height = img.naturalHeight;
      uploadCanvas.getContext("2d").drawImage(
        img,
        0,
        0,
        uploadCanvas.width,
        uploadCanvas.height,
      );
      snapToThumbnail(uploadCanvas);
    };
    img.src = url;
  }

  function clipboardToThumbnail() {
    try {
      loadingMessage.textContent = "⌛ Loading image...";
      loadingMessage.hidden = false;
      navigator.clipboard.read().then((images) => {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          for (let j = 0; j < img.types.length; j++) {
            const type = img.types[j];
            if (type.indexOf("image/") != -1) {
              if (type.startsWith("image/svg")) {
                alert("Sorry, SVG is probably not convertible.");
              }
              img.getType(type).then((blob) => {
                cancelAnimationFrame(animationFrame);
                uploadCanvas.hidden = false;
                videoCanvas.hidden = true;
                const url = URL.createObjectURL(blob);
                loadImage(uploadCanvas, url);
              });
            }
          }
        }
      });
    } finally {
      loadingMessage.hidden = true;
    }
  }

  document.body.onpaste = (event) => {
    loadingMessage.textContent = "⌛ Loading image...";
    loadingMessage.hidden = false;
    const items =
      (event.clipboardData || event.originalEvent.clipboardData).items;
    let blob;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) {
        blob = items[i].getAsFile();
      }
    }
    if (blob !== null) {
      const reader = new FileReader();
      reader.onload = (event) => {
        cancelAnimationFrame(animationFrame);
        uploadCanvas.hidden = false;
        videoCanvas.hidden = true;
        const url = event.currentTarget.result;
        loadImage(uploadCanvas, url);
      };
      reader.readAsDataURL(blob);
    }
    loadingMessage.hidden = true;
  };

  function snapToThumbnail(element) {
    const src = cv.imread(element);
    affineImage(src, getConfigFilterStatus());
    cv.imshow("snapCanvas", src);
    src.delete();
    const thumbnail = document.createElement("img-box");
    const img = thumbnail.shadowRoot.querySelector("img");
    img.src = snapCanvas.toDataURL("image/jpg"); // webp だとダウンロード時に困る
    img.height = 150 / snapCanvas.width * snapCanvas.height;
    outputElement.append(thumbnail);

    // let src = element.getContext('2d').getImageData(0, 0, element.width, element.height);
    // let denoise = getConfigFilterStatus();
    // worker.postMessage({type:'affineImage', src:src, denoise:denoise });
  }
}).catch((err) => {
  alert(err);
});

loadConfig();
const tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]'),
);
tooltipTriggerList.map((tooltipTriggerEl) => {
  return new Tooltip(tooltipTriggerEl);
});
const previewModal = new Modal(document.getElementById("previewModal"));
new Collapse(document.getElementById("configToolbar"), { toggle: false });

document.getElementById("config").addEventListener("change", (event) => {
  const name = event.currentTarget.name;
  switch (name) {
    case "resolution":
      localStorage.setItem(name, event.currentTarget.selectedIndex);
      break;
    case "filter":
    case "clientId":
    case "serverAddress":
      localStorage.setItem(name, event.currentTarget.value);
      break;
  }
});
document.getElementById("overview").addEventListener("click", () => {
  localStorage.setItem("overview", 0);
});
document.getElementById("clearConfig").onclick = clearConfig;
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("deleteThumbnails").onclick = deleteThumbnails;
document.getElementById("downloadThumbnails").onclick = downloadThumbnails;
document.getElementById("uploadDropbox").onclick = uploadDropbox;
document.getElementById("uploadServer").onclick = uploadServer;
