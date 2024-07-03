import {
  Carousel,
  Offcanvas,
  Popover,
  Tooltip,
} from "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/+esm";
import glfx from "https://cdn.jsdelivr.net/npm/glfx@0.0.4/+esm";

function loadConfig() {
  configPanel.serverAddress.value = localStorage.getItem("serverAddress");
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
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

function initLangSelect() {
  const langSelect = document.getElementById("lang");
  langSelect.onchange = () => {
    const lang = langSelect.options[langSelect.selectedIndex].value;
    location.href = `/photo-scanner/${lang}/`;
  };
}

function initTooltip() {
  for (const node of document.querySelectorAll('[data-bs-toggle="tooltip"]')) {
    const tooltip = new Tooltip(node);
    node.addEventListener("touchstart", () => tooltip.show());
    node.addEventListener("touchend", () => tooltip.hide());
    node.addEventListener("click", () => {
      if (!tooltip.tip) return;
      tooltip.tip.classList.add("d-none");
      tooltip.hide();
      tooltip.tip.classList.remove("d-none");
    });
  }
}

async function getOpenCVPath() {
  const simdSupport = await wasmFeatureDetect.simd();
  const threadsSupport = self.crossOriginIsolated &&
    await wasmFeatureDetect.threads();
  if (simdSupport && threadsSupport) {
    return "/photo-scanner/opencv/threaded-simd/opencv_js.js";
  } else if (simdSupport) {
    return "/photo-scanner/opencv/simd/opencv_js.js";
  } else if (threadsSupport) {
    return "/photo-scanner/opencv/threads/opencv_js.js";
  } else {
    return "/photo-scanner/opencv/wasm/opencv_js.js";
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    script.src = url;
    document.body.appendChild(script);
  });
}

class ImageBox extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById("img-box")
      .content.cloneNode(true);
    template.querySelector("img").onclick = (event) => {
      loadPanel.hide();
      filterPanel.setCanvas(event.target);
      filterPanel.show();
      editCarousel.show();
      editCarousel.carousel.to(1);
    };
    template.querySelector(".delete").onclick = () => this.remove();
    this.attachShadow({ mode: "open" }).appendChild(template);
  }
}
customElements.define("img-box", ImageBox);

class Draggable {
  x = 0;
  y = 0;
  tx = 0;
  ty = 0;
  cx = 0;
  cy = 0;

  constructor(target, checkConstraints) {
    this.target = target;
    this.checkConstraints = checkConstraints;
    this.on();
  }

  on() {
    const target = this.target;
    target.draggable = false;
    target.addEventListener("pointerdown", (event) => {
      this.handleDownEvent(event);
    });
    target.addEventListener("pointermove", (event) => {
      this.handleMoveEvent(event);
    });
  }

  off() {
    const target = this.target;
    target.removeEventListener("pointerdown", (event) => {
      handleDownEvent(event);
    });
    target.removeEventListener("pointermove", (event) => {
      handleMoveEvent(event);
    });
  }

  handleDownEvent(event) {
    const { clientX, clientY } = event;
    const target = this.target;
    const transform = target.style.transform;
    const matrix = transform
      ? transform.slice(7, -1).split(",").map(Number)
      : [1, 0, 0, 1, 0, 0];
    this.tx = matrix[4];
    this.ty = matrix[5];
    this.x = clientX;
    this.y = clientY;
    const rect = target.getBoundingClientRect();
    this.cx = rect.left + rect.width / 2 - clientX;
    this.cy = rect.top + rect.height / 2 - clientY;
    target.setPointerCapture(event.pointerId);
  }

  handleMoveEvent(event) {
    if (!event.buttons) return;
    const target = this.target;
    if (this.checkConstraints) {
      const { x, y } = this.checkConstraints(this, event);
      const tx = x - this.x + this.tx;
      const ty = y - this.y + this.ty;
      const matrix = new DOMMatrix([1, 0, 0, 1, tx, ty]);
      target.style.transform = matrix.toString();
    } else {
      const tx = event.clientX - this.x + this.tx;
      const ty = event.clientY - this.y + this.ty;
      const matrix = new DOMMatrix([1, 0, 0, 1, tx, ty]);
      target.style.transform = matrix.toString();
    }
    target.dispatchEvent(new Event("dragend"));
  }
}

class Panel {
  constructor(panel) {
    this.panel = panel;
  }

  show() {
    this.panel.classList.remove("d-none");
  }

  hide() {
    this.panel.classList.add("d-none");
  }

  getActualRect(canvas) {
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    const naturalWidth = canvas.width;
    const naturalHeight = canvas.height;
    const aspectRatio = naturalWidth / naturalHeight;
    let width, height, top, left, right, bottom;
    if (canvasWidth / canvasHeight > aspectRatio) {
      width = canvasHeight * aspectRatio;
      height = canvasHeight;
      top = 0;
      left = (canvasWidth - width) / 2;
      right = left + width;
      bottom = canvasHeight;
    } else {
      width = canvasWidth;
      height = canvasWidth / aspectRatio;
      top = (canvasHeight - height) / 2;
      left = 0;
      right = canvasWidth;
      bottom = top + height;
    }
    return { width, height, top, left, right, bottom };
  }
}

class LoadPanel extends Panel {
  constructor(panel) {
    super(panel);

    panel.querySelector(".clipboard").onclick = (event) => {
      this.loadClipboardImage(event);
    };
    panel.querySelector(".selectImage").onclick = () => {
      panel.querySelector(".inputImage").click();
    };
    panel.querySelector(".executeCamera").onclick = () => this.executeCamera();
    panel.querySelector(".inputImage").onchange = (event) => {
      this.loadInputImage(event);
    };
    document.body.onpaste = (event) => {
      if (!this.panel.classList.contains("d-none")) {
        this.loadClipboardImage(event);
      }
    };
  }

  show() {
    super.show();
    document.body.scrollIntoView({ behavior: "instant" });
  }

  executeCamera() {
    this.hide();
    cameraPanel.show();
    cameraPanel.executeVideo();
  }

  handleImageOnloadEvent = (event) => {
    const img = event.currentTarget;
    const { naturalWidth, naturalHeight } = img;
    cropPanel.canvas.width = naturalWidth;
    cropPanel.canvas.height = naturalHeight;
    cropPanel.canvasContext.drawImage(img, 0, 0);
    filterPanel.canvas.width = naturalWidth;
    filterPanel.canvas.height = naturalHeight;

    cropPanel.setCropPivotsPosition();
    const src = cv.imread(cropPanel.canvas);
    const rect = cameraPanel.findRect(src, cropPanel.canvas);
    src.delete();
    cropPanel.drawSvgRect(rect);
  };

  loadImage(url) {
    cameraPanel.stopCamera();
    cameraPanel.hide();
    loadPanel.hide();
    editCarousel.show();
    editCarousel.carousel.to(0);
    cropPanel.show();
    const img = new Image();
    img.onload = (event) => this.handleImageOnloadEvent(event);
    img.src = url;
  }

  loadInputImage(event) {
    const file = event.currentTarget.files[0];
    loadFile(file);
    event.currentTarget.value = "";
  }

  loadFile(file) {
    if (!file.type.startsWith("image/")) return;
    if (file.type === "image/svg+xml") {
      alert("SVG is not supported.");
      return;
    }
    const url = URL.createObjectURL(file);
    this.loadImage(url);
  }

  async loadClipboardImage() {
    try {
      const items = await navigator.clipboard.read();
      const item = items[0];
      for (const type of item.types) {
        if (type === "image/svg+xml") {
          alert("SVG is not supported.");
        } else if (type.startsWith("image/")) {
          const file = await item.getType(type);
          const url = URL.createObjectURL(file);
          this.loadImage(url);
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}

class CameraPanel extends Panel {
  stream;
  animationFrame;
  defaultWidth;
  defaultHeight;
  lastAnimated = 0;

  constructor(panel) {
    super(panel);
    this.panelContainer = panel.querySelector(".panelContainer");
    const video = document.createElement("video");
    video.addEventListener("play", () => {
      this.loadingMessage.classList.add("d-none");
    });
    this.video = video;
    this.videoOptions = {
      audio: false,
      video: { facingMode: "environment" },
    };
    this.canvas = panel.querySelector("canvas");
    this.canvasContext = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.canvasContainer = this.canvas.parentNode;
    this.loadingMessage = panel.querySelector(".loadingMessage");
    panel.querySelector(".moveTop").onclick = () => this.moveLoadPanel();
    panel.querySelector(".toggleFacingMode").onclick = () =>
      this.toggleFacingMode();
    panel.querySelector(".snapshot").onclick = () => this.snapshot();
    const resolution = panel.querySelector(".resolution");
    const resolutionRange = document.createElement("input");
    resolutionRange.type = "range";
    resolutionRange.min = 1;
    resolutionRange.max = 10;
    resolutionRange.value = 5;
    resolutionRange.dataset.value = 5;
    resolutionRange.className = "resolutionRange form-range";
    resolutionRange.onchange = async () => {
      if (!this.stream) return;
      this.setResolution();
      await this.initVideo();
    };
    this.resolutionRange = resolutionRange;
    this.resolutionPopover = new Popover(resolution, {
      trigger: "click",
      placement: "top",
      html: true,
      content: resolutionRange,
      customClass: "resolutionPopover",
    });
  }

  show() {
    super.show();
    this.panelContainer.scrollIntoView({ behavior: "instant" });
  }

  hideResolutionPopover() {
    const popover = this.resolutionPopover;
    if (popover.tip) {
      popover.tip.classList.add("d-none");
      popover.hide();
      popover.tip.classList.remove("d-none");
    }
  }

  moveLoadPanel() {
    this.hideResolutionPopover();
    this.stopCamera();
    this.hide();
    loadPanel.show();
  }

  setResolution() {
    const [width, height] = this.getIdealResolution();
    const aspectRatio = width / height;
    const videoOptions = this.videoOptions.video;
    videoOptions.width = { ideal: width };
    videoOptions.height = { ideal: height };
    videoOptions.aspectRatio = { exact: aspectRatio };
  }

  getIdealResolution() {
    const value = Number(this.resolutionRange.value);
    const defaultValue = Number(this.resolutionRange.dataset.value);
    const factor = Math.sqrt(2) ** (value - defaultValue);
    return [this.defaultWidth * factor, this.defaultHeight * factor];
  }

  toggleFacingMode() {
    this.hideResolutionPopover();
    const video = this.videoOptions.video;
    if (video.facingMode == "user") {
      video.facingMode = "environment";
    } else {
      video.facingMode = "user";
    }
    this.executeVideo();
  }

  stopCamera() {
    if (!this.stream) return;
    this.stream.getVideoTracks().forEach((track) => {
      track.stop();
    });
    this.stream = null;
  }

  initVideoOptions(settings) {
    const { width, height, aspectRatio } = settings;
    const videoOptions = this.videoOptions.video;
    const isPortrait = globalThis.innerHeight > globalThis.innerWidth;
    const isIOS = CSS.supports("-webkit-touch-callout: default");
    const [idealWidth, idealHeight, exactAspectRatio] = isPortrait && !isIOS
      ? [height, width, 1 / aspectRatio]
      : [width, height, aspectRatio];
    videoOptions.width = { ideal: idealWidth };
    videoOptions.height = { ideal: idealHeight };
    videoOptions.aspectRatio = { exact: exactAspectRatio };
    if (!this.defaultWidth) {
      this.defaultWidth = width;
      this.defaultHeight = height;
    }
    this.canvas.width = idealWidth;
    this.canvas.height = idealHeight;
  }

  async initVideo() {
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia(
        this.videoOptions,
      );
    }
    const track = this.stream.getVideoTracks()[0];
    await track.applyConstraints(this.videoOptions.video);
    const settings = track.getSettings();
    this.initVideoOptions(settings);
    await track.applyConstraints(this.videoOptions.video);
  }

  async executeVideo() {
    this.stopCamera();
    this.loadingMessage.classList.remove("d-none");
    await this.initVideo();
    const video = this.video;
    video.srcObject = this.stream;
    // https://qiita.com/tinymouse/items/8b82f3578e167627d209
    // https://stackoverflow.com/questions/53483975/
    video.autoPlay = true;
    video.muted = true;
    video.playsInline = true;
    video.play();
    this.animationFrame = requestAnimationFrame(this.tickVideo);
  }

  // drawCanvasRect() {
  //   const src = cv.imread(this.canvas);
  //   const rect = this.findRect(src, this.canvas);
  //   // const color = new cv.Scalar(255, 255, 255, 255); // RGBA
  //   const color = new cv.Scalar(
  //     Math.round(Math.random() * 255),
  //     Math.round(Math.random() * 255),
  //     Math.round(Math.random() * 255),
  //     255,
  //   );
  //   for (let i = 0; i < 4; i++) {
  //     cv.line(src, rect[i], rect[(i + 1) % 4], color, 1, cv.LINE_AA);
  //   }
  //   cv.imshow(this.canvas, src);
  //   src.delete();
  // }

  tickVideo = () => {
    const fps = 30;
    const t = Date.now();
    if (this.lastAnimated + 1000 / fps < t) {
      this.lastAnimated = t;
      const video = this.video;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        this.canvasContext.drawImage(video, 0, 0);
        // this.drawCanvasRect();
      }
    }
    this.animationFrame = requestAnimationFrame(this.tickVideo);
  };

  snapshot() {
    this.hideResolutionPopover();
    if (!this.stream) return;
    new Audio("/photo-scanner/camera.mp3").play();
    this.hide();
    editCarousel.show();
    cropPanel.canvas.width = this.video.videoWidth;
    cropPanel.canvas.height = this.video.videoHeight;
    cropPanel.show();
    cropPanel.canvasContext.drawImage(this.canvas, 0, 0);
    cropPanel.setCropPivotsPosition();
    const src = cv.imread(cropPanel.canvas);
    const rect = this.findRect(src, cropPanel.canvas);
    src.delete();
    cropPanel.drawSvgRect(rect);
    this.stopCamera();
  }

  fixRect(rect, src, canvas) {
    const { cols, rows } = src;
    rect.forEach((vertice) => {
      if (vertice.x < 0) vertice.x = 0;
      if (cols < vertice.x) vertice.x = cols;
      if (vertice.y < 0) vertice.y = 0;
      if (rows < vertice.y) vertice.y = rows;
    });
    const actualRect = this.getActualRect(canvas);
    const scale = actualRect.width / src.cols;
    rect.forEach((vertice) => {
      vertice.x *= scale;
      vertice.y *= scale;
    });
    return rect;
  }

  findRect(src, canvas) {
    const dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    // blockSize = 5% width
    // Small areas are not important, however 10% is too strong.
    const blockSize = Math.round(dst.rows / 40) * 2 + 1;
    cv.adaptiveThreshold(
      dst,
      dst,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      blockSize,
      5,
    );
    // Large areas cannot be acquired without weak denoising.
    // However, strong denoising causes the area to become excessively large.
    cv.medianBlur(dst, dst, 9);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      dst,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_TC89_L1,
    );
    dst.delete();

    let firstPos = 0;
    let secondPos = 0;
    let firstSize = 0;
    let secondSize;
    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const size = cv.contourArea(cnt, false);
      if (firstSize < size) {
        secondSize = size;
        secondPos = firstPos;
        firstSize = size;
        firstPos = i;
      } else if (secondSize < size && size < firstSize) {
        secondSize = size;
        secondPos = i;
      }
      cnt.delete();
    }
    const cnt = contours.get(secondPos);
    const rect = cv.minAreaRect(cnt);
    const vertices = cv.RotatedRect.points(rect);

    contours.delete();
    hierarchy.delete();
    cnt.delete();
    return this.fixRect(vertices, src, canvas);
  }
}

class CropPanel extends LoadPanel {
  initialPoints;
  updatedPoints;
  actualRect;

  constructor(panel) {
    super(panel);
    this.panelContainer = panel.querySelector(".panelContainer");
    this.canvas = panel.querySelector("canvas");
    this.canvasContext = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.canvasContainer = this.canvas.parentNode;
    this.cropPivots = panel.querySelector(".cropPivots");
    this.circles = [...this.cropPivots.getElementsByTagName("circle")];
    this.polygon = this.cropPivots.querySelector("polygon");

    this.addTransformPolygonEvents();
    this.addDraggablePivotsEvents();
    panel.querySelector(".moveTop").onclick = () => this.moveLoadPanel();
    panel.querySelector(".perspectiveProjection").onclick = () => {
      const canvas = this.perspectiveProjection();
      filterPanel.setCanvas(canvas);
      filterPanel.show();
      editCarousel.carousel.to(1);
    };
  }

  show() {
    super.show();
    this.panelContainer.scrollIntoView({ behavior: "instant" });
  }

  moveLoadPanel() {
    this.hide();
    editCarousel.hide();
    loadPanel.show();
  }

  setCropPivotsPosition() {
    const actualRect = this.getActualRect(this.canvas);
    this.actualRect = actualRect;
    const cropPivots = this.cropPivots;
    cropPivots.setAttribute("width", actualRect.width);
    cropPivots.setAttribute("height", actualRect.height);
    cropPivots.style.top = `${actualRect.top}px`;
    cropPivots.style.left = `${actualRect.left}px`;
  }

  resizeCropPivots() {
    const cropPivots = this.cropPivots;
    const actualRect = this.getActualRect(this.canvas);
    if (actualRect.width === 0) return;
    cropPivots.style.top = actualRect.top;
    cropPivots.style.left = actualRect.left;
    const prevWidth = Number(cropPivots.getAttribute("width"));
    const scale = actualRect.width / prevWidth;
    if (scale === 1) return;
    cropPivots.setAttribute("width", actualRect.width);
    cropPivots.setAttribute("height", actualRect.height);
    this.initialPoints = this.initialPoints.map((p) => p * scale);
    this.updatedPoints = this.updatedPoints.map((p) => p * scale);
    this.polygon.setAttribute("points", this.updatedPoints.join(" "));
    this.circles.forEach((circle, i) => {
      const cx = this.initialPoints[i * 2];
      const cy = this.initialPoints[i * 2 + 1];
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      const tx = this.updatedPoints[i * 2] - cx;
      const ty = this.updatedPoints[i * 2 + 1] - cy;
      const matrix = [1, 0, 0, 1, tx, ty];
      circle.style.transform = new DOMMatrix(matrix).toString();
    });
  }

  addTransformPolygonEvents() {
    for (let i = 0; i < this.circles.length; i++) {
      this.circles[i].addEventListener("dragend", () => {
        const pos1 = 2 * i;
        const pos2 = pos1 + 1;
        const transform = this.circles[i].style.transform;
        const matrix = transform
          ? transform.slice(7, -1).split(",").map(Number)
          : [1, 0, 0, 1, 0, 0];
        const [tx, ty] = matrix.slice(4);
        this.updatedPoints[pos1] = this.initialPoints[pos1] + tx;
        this.updatedPoints[pos2] = this.initialPoints[pos2] + ty;
        this.polygon.setAttribute("points", this.updatedPoints.join(" "));
      });
    }
  }

  addDraggablePivotsEvents() {
    for (let i = 0; i < this.circles.length; i++) {
      new Draggable(this.circles[i], this.checkConstraints);
    }
  }

  perspectiveProjection() {
    const canvas = document.createElement("canvas");
    const src = cv.imread(this.canvas);

    const actualRect = this.getActualRect(this.canvas);
    const scale = actualRect.width / this.canvas.width;
    const points = this.updatedPoints.map((p) => p / scale);
    const cvPoints = [
      ...points.slice(0, 4),
      ...points.slice(6, 8),
      ...points.slice(4, 6),
    ];
    const newPoints = [0, 0, src.cols, 0, 0, src.rows, src.cols, src.rows];

    const dst = new cv.Mat();
    const dsize = new cv.Size(src.cols, src.rows);
    const srcM = cv.matFromArray(4, 1, cv.CV_32FC2, cvPoints);
    const dstM = cv.matFromArray(4, 1, cv.CV_32FC2, newPoints);
    const M = cv.getPerspectiveTransform(srcM, dstM);
    cv.warpPerspective(
      src,
      dst,
      M,
      dsize,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(),
    );
    cv.imshow(canvas, dst);
    srcM.delete();
    dstM.delete();
    M.delete();
    src.delete();
    dst.delete();
    return canvas;
  }

  // perspectiveProjection() {
  //   const w = this.canvas.width;
  //   const h = this.canvas.height;
  //   const actualRect = this.getActualRect(this.canvas);
  //   const scale = actualRect.width / w;
  //   const points = this.updatedPoints.map((p) => p / scale);
  //   const newPoints = [0, 0, w, 0, w, h, 0, h]
  //   const canvas = glfx.canvas();
  //   const texture = canvas.texture(this.canvas);
  //   canvas.draw(texture).perspective(points, newPoints).update();
  //   return canvas;
  // }

  drawSvgRect(rect) {
    for (let i = 0; i < this.circles.length; i++) {
      const circle = this.circles[i];
      circle.setAttribute("cx", rect[i].x);
      circle.setAttribute("cy", rect[i].y);
      circle.style.removeProperty("transform");
    }
    const points = rect.map((vertice) => `${vertice.x},${vertice.y}`).join(" ");
    this.polygon.setAttribute("points", points);
    this.polygon.style.removeProperty("transform");
    this.initialPoints = this.polygon.getAttribute("points")
      .split(/[, ]/).map(Number);
    this.updatedPoints = structuredClone(this.initialPoints);
  }

  getIndexValue(points, i) {
    if (points.length <= i) {
      return points[i - points.length];
    } else {
      return points.at(i);
    }
  }

  checkConstraints = (draggable, event) => {
    const { clientX, clientY } = event;
    return this.checkMinMax(draggable, clientX, clientY);
  };

  checkMinMax(draggable, x, y) {
    const rect = this.cropPivots.getBoundingClientRect();
    let { left, top, right, bottom } = rect;
    left -= draggable.cx;
    right -= draggable.cx;
    top -= draggable.cy;
    bottom -= draggable.cy;
    const newX = Math.max(left, Math.min(x, right));
    const newY = Math.max(top, Math.min(y, bottom));
    const isTrusted = newX === x && newY === y;
    return { x: newX, y: newY, isTrusted };
  }
}

class ThumbnailPanel extends Panel {
  constructor(panel) {
    super(panel);
    this.gallery = panel.querySelector(".gallery");
    panel.querySelector(".deleteAll").onclick = () => this.deleteAll();
    panel.querySelector(".download").onclick = () => this.download();
    panel.querySelector(".uploadServer").onclick = () => {
      configPanel.uploadServer();
    };
    panel.querySelector(".showConfig").onclick = () => {
      configPanel.offcanvas.show();
    };
  }

  add(canvas) {
    const thumbnail = document.createElement("img-box");
    const img = thumbnail.shadowRoot.querySelector("img");
    img.src = canvas.toDataURL("image/jpeg");
    img.width = 150;
    img.height = 150 / canvas.width * canvas.height;
    this.gallery.append(thumbnail);
  }

  deleteAll() {
    while (this.gallery.firstChild) {
      this.gallery.removeChild(this.gallery.lastChild);
    }
  }

  download() {
    const gallery = this.gallery;
    for (let i = 0; i < gallery.children.length; i++) {
      const a = document.createElement("a");
      a.download = i + ".jpg";
      a.href = gallery.children[i].shadowRoot.querySelector("img").src;
      gallery.appendChild(a);
      a.click();
      gallery.removeChild(a);
    }
  }
}

class FilterPanel extends LoadPanel {
  constructor(panel) {
    super(panel);
    this.panelContainer = panel.querySelector(".panelContainer");
    this.selectedIndex = 0;
    this.glfxCanvas = glfx.canvas();
    this.canvas = panel.querySelector("canvas");
    this.canvasContext = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvasContext = this.offscreenCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.canvasContainer = this.canvas.parentNode;

    panel.querySelector(".moveTop").onclick = () => this.moveLoadPanel();
    panel.querySelector(".executeCamera").onclick = () => this.executeCamera();
    panel.querySelector(".filterSelect").onchange = (event) =>
      this.filterSelect(event);
    panel.querySelector(".backToCrop").onclick = () => this.backToCrop();
    panel.querySelector(".rotate").onclick = () => this.rotate();
    panel.querySelector(".saveToAlbum").onclick = () => this.saveToAlbum();
    this.addGlfxEvents(panel);
    this.addAspectRatioEvents(panel);
  }

  show() {
    super.show();
    this.panelContainer.scrollIntoView({ behavior: "instant" }); // TODO: Carousel
  }

  moveLoadPanel() {
    this.hide();
    editCarousel.hide();
    editCarousel.carousel.to(0);
    loadPanel.show();
  }

  executeCamera() {
    this.hide();
    editCarousel.hide();
    editCarousel.carousel.to(0);
    cameraPanel.show();
    cameraPanel.executeVideo();
  }

  filterSelect(event) {
    this.texture.loadContentsOf(this.glfxCanvas.update());
    const options = event.target.options;
    const selectedIndex = options.selectedIndex;
    const prevClass = options[this.selectedIndex].value;
    const currClass = options[selectedIndex].value;
    this.panel.querySelector(`.${prevClass}`).classList.add("d-none");
    this.panel.querySelector(`.${currClass}`).classList.remove("d-none");
    this.selectedIndex = selectedIndex;
  }

  addAspectRatioEvents(panel) {
    const radioInputs = panel.querySelectorAll("input[type=radio]");
    const manualRadioInput = radioInputs[radioInputs.length - 1];
    radioInputs.forEach((input) => {
      input.onclick = () => {
        if (input.checked == "true") return;
        input.checked = true;
        this.setAspectRatio(Number(input.value));
      };
    });
    panel.querySelector(".aspectRatioValue").onchange = (event) => {
      manualRadioInput.checked = true;
      const value = Number(event.currentTarget.value);
      if (value) this.setAspectRatio(value);
    };
  }

  addGlfxEvents(panel) {
    this.filtering = false;
    this.binarizationBlocksizeRange = panel.querySelector(
      ".binarizationBlocksizeRange",
    );
    this.binarizationCRange = panel.querySelector(".binarizationCRange");
    this.brightnessRange = panel.querySelector(".brightnessRange");
    this.contrastRange = panel.querySelector(".contrastRange");
    this.hueRange = panel.querySelector(".hueRange");
    this.saturationRange = panel.querySelector(".saturationRange");
    this.vibranceRange = panel.querySelector(".vibranceRange");
    this.denoiseRange = panel.querySelector(".denoiseRange");
    this.unsharpMaskRadiusRange = panel.querySelector(
      ".unsharpMaskRadiusRange",
    );
    this.unsharpMaskStrengthRange = panel.querySelector(
      ".unsharpMaskStrengthRange",
    );
    this.sepiaRange = panel.querySelector(".sepiaRange");

    this.binarizationBlocksizeRange.oninput = () => this.binarization();
    this.binarizationBlocksizeRange.onchange = () => this.binarization();
    this.binarizationCRange.oninput = () => this.binarization();
    this.binarizationCRange.onchange = () => this.binarization();
    this.brightnessRange.oninput = () => this.brightnessContrast();
    this.brightnessRange.onchange = () => this.brightnessContrast();
    this.contrastRange.oninput = () => this.brightnessContrast();
    this.contrastRange.onchange = () => this.brightnessContrast();
    this.hueRange.oninput = () => this.hueSaturation();
    this.hueRange.onchange = () => this.hueSaturation();
    this.saturationRange.oninput = () => this.hueSaturation();
    this.saturationRange.onchange = () => this.hueSaturation();
    this.vibranceRange.oninput = () => this.vibrance();
    this.vibranceRange.onchange = () => this.vibrance();
    this.denoiseRange.oninput = () => this.denoise();
    this.denoiseRange.onchange = () => this.denoise();
    this.unsharpMaskRadiusRange.oninput = () => this.unsharpMask();
    this.unsharpMaskRadiusRange.onchange = () => this.unsharpMask();
    this.unsharpMaskStrengthRange.oninput = () => this.unsharpMask();
    this.unsharpMaskStrengthRange.onchange = () => this.unsharpMask();
    this.sepiaRange.oninput = () => this.sepia();
    this.sepiaRange.onchange = () => this.sepia();

    panel.querySelector(".binarizationBlocksizeReset").onclick = () => {
      this.binarizationBlocksizeRange.value =
        this.binarizationBlocksizeRange.dataset.value;
      this.binarization();
    };
    panel.querySelector(".binarizationCReset").onclick = () => {
      this.binarizationCRange.value = this.binarizationCRange.dataset.value;
      this.binarization();
    };
    panel.querySelector(".brightnessReset").onclick = () => {
      this.brightnessRange.value = this.brightnessRange.dataset.value;
      this.brightnessContrast();
    };
    panel.querySelector(".contrastReset").onclick = () => {
      this.contrastRange.value = this.contrastRange.dataset.value;
      this.brightnessContrast();
    };
    panel.querySelector(".hueReset").onclick = () => {
      this.hueRange.value = this.hueRange.dataset.value;
      this.hueSaturation();
    };
    panel.querySelector(".saturationReset").onclick = () => {
      this.saturationRange.value = this.saturationRange.dataset.value;
      this.hueSaturation();
    };
    panel.querySelector(".vibranceReset").onclick = () => {
      this.vibranceRange.value = this.vibranceRange.dataset.value;
      this.vibrance();
    };
    panel.querySelector(".denoiseReset").onclick = () => {
      this.denoiseRange.value = this.denoiseRange.dataset.value;
      this.denoise();
    };
    panel.querySelector(".unsharpMaskRadiusReset").onclick = () => {
      this.unsharpMaskRadiusRange.value =
        this.unsharpMaskRadiusRange.dataset.value;
      this.unsharpMask();
    };
    panel.querySelector(".unsharpMaskStrengthReset").onclick = () => {
      this.unsharpMaskStrengthRange.value =
        this.unsharpMaskStrengthRange.dataset.value;
      this.unsharpMask();
    };
    panel.querySelector(".sepiaReset").onclick = () => {
      this.sepiaRange.value = this.sepiaRange.dataset.value;
      this.sepia();
    };
  }

  drawOffscreenCanvas(image, width, height) {
    const canvas = this.offscreenCanvas;
    canvas.width = width;
    canvas.height = height;
    this.offscreenCanvasContext.drawImage(
      image,
      0,
      0,
      width,
      height,
    );
  }

  setAspectRatio(aspectRatio) {
    const { width, height } = this.canvas;
    const currAspectRatio = width / height;
    let tmpWidth, tmpHeight;
    if (aspectRatio === 0) {
      tmpWidth = width;
      tmpHeight = height;
    } else if (currAspectRatio < aspectRatio) {
      tmpWidth = height * aspectRatio;
      tmpHeight = height;
    } else {
      tmpWidth = width;
      tmpHeight = width / aspectRatio;
    }
    this.drawOffscreenCanvas(this.canvas, tmpWidth, tmpHeight);
    this.texture = this.glfxCanvas.texture(this.offscreenCanvas);
    this.glfxCanvas.draw(this.texture).update();
  }

  binarization() {
    const blockSize = Number(this.binarizationBlocksizeRange.value);
    if (blockSize === Number(this.binarizationBlocksizeRange.min)) {
      this.glfxCanvas.draw(this.texture).update();
    } else {
      const C = Number(this.binarizationCRange.value);
      const { width, height } = this.glfxCanvas;
      this.drawOffscreenCanvas(this.canvas, width, height);
      const src = cv.imread(this.offscreenCanvas);
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
      cv.adaptiveThreshold(
        src,
        src,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        blockSize * 2 + 1,
        C,
      );
      cv.imshow(this.offscreenCanvas, src);
      src.delete();
      const texture = this.glfxCanvas.texture(this.offscreenCanvas);
      this.glfxCanvas.draw(texture).update();
    }
  }

  brightnessContrast() {
    if (this.filtering) return;
    this.filtering = true;
    const brightness = Number(this.brightnessRange.value);
    const contrast = Number(this.contrastRange.value);
    this.glfxCanvas.draw(this.texture)
      .brightnessContrast(brightness, contrast).update();
    this.filtering = false;
  }

  hueSaturation() {
    if (this.filtering) return;
    this.filtering = true;
    const hue = Number(this.hueRange.value);
    const saturation = Number(this.saturationRange.value);
    this.glfxCanvas.draw(this.texture)
      .hueSaturation(hue, saturation).update();
    this.filtering = false;
  }

  vibrance() {
    if (this.filtering) return;
    this.filtering = true;
    const value = Number(this.vibranceRange.value);
    this.glfxCanvas.draw(this.texture)
      .vibrance(value).update();
    this.filtering = false;
  }

  denoise() {
    if (this.filtering) return;
    this.filtering = true;
    const value = Number(this.denoiseRange.value);
    if (value === Number(this.denoiseRange.max)) {
      this.glfxCanvas.draw(this.texture).update();
    } else {
      this.glfxCanvas.draw(this.texture)
        .denoise(value).update();
    }
    this.filtering = false;
  }

  unsharpMask() {
    if (this.filtering) return;
    this.filtering = true;
    const radius = Number(this.unsharpMaskRadiusRange.value);
    const strength = Number(this.unsharpMaskStrengthRange.value);
    this.glfxCanvas.draw(this.texture)
      .unsharpMask(radius, strength).update();
    this.filtering = false;
  }

  sepia() {
    if (this.filtering) return;
    this.filtering = true;
    const value = Number(this.sepiaRange.value);
    this.glfxCanvas.draw(this.texture)
      .sepia(value).update();
    this.filtering = false;
  }

  setCanvas(canvas) {
    if (canvas.tagName.toLowerCase() === "img") {
      this.canvas.width = canvas.naturalWidth;
      this.canvas.height = canvas.naturalHeight;
    } else {
      this.canvas.width = canvas.width;
      this.canvas.height = canvas.height;
    }
    this.canvasContext.drawImage(canvas, 0, 0);

    this.texture = this.glfxCanvas.texture(this.canvas);
    this.glfxCanvas.draw(this.texture).update();
    this.glfxCanvas.setAttribute("class", "w-100 h-100 object-fit-contain");
    this.canvas.replaceWith(this.glfxCanvas);
    canvas.setAttribute("class", "w-100 h-100 object-fit-contain");
    // this.canvas = canvas;
  }

  backToCrop() {
    editCarousel.carousel.to(0);
    cropPanel.show();
  }

  rotate() {
    const angle = 90;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const glfxCanvas = this.glfxCanvas;
    const width = glfxCanvas.width;
    const height = glfxCanvas.height;
    const radian = angle * Math.PI / 180;
    // const cosAngle = Math.abs(Math.cos(radian));
    // const sinAngle = Math.abs(Math.sin(radian));
    const cosAngle = Math.cos(radian);
    const sinAngle = Math.sin(radian);
    const rotatedWidth = cosAngle * width + sinAngle * height;
    const rotatedHeight = sinAngle * width + cosAngle * height;
    canvas.width = rotatedWidth;
    canvas.height = rotatedHeight;
    context.translate(rotatedWidth / 2, rotatedHeight / 2);
    context.rotate(radian);
    this.glfxCanvas.update();
    context.drawImage(this.glfxCanvas, -width / 2, -height / 2);
    this.texture = this.glfxCanvas.texture(canvas);
    this.glfxCanvas.draw(this.texture).update();
  }

  saveToAlbum() {
    this.glfxCanvas.update();
    thumbnailPanel.add(this.glfxCanvas);
  }
}

class EditCarousel extends Panel {
  constructor(panel) {
    super(panel);
    this.carousel = new Carousel(panel, { touch: false });
  }
}

class ConfigPanel extends Panel {
  constructor(panel) {
    super(panel);
    this.offcanvas = new Offcanvas(panel);
    this.resolution = panel.querySelector(".resolution");
    this.serverAddress = panel.querySelector(".serverAddress");
    this.serverAddress.onchange = (event) => {
      localStorage.setItem("serverAddress", event.currentTarget.value);
    };
    panel.querySelector(".clearConfig").onclick = (event) =>
      this.clearConfig(event);
  }

  uploadServer() {
    if (this.serverAddress.value != "") {
      const formData = new FormData();
      const gallery = thumbnailPanel.gallery;
      for (let i = 0; i < gallery.children.length; i++) {
        let base64 = gallery.children[i].shadowRoot.querySelector("img").src;
        base64 = base64.slice(base64.indexOf("base64,") + 7);
        formData.append("files", this.base64toJpg(base64), i + ".jpg");
      }
      fetch(this.serverAddress.value, {
        method: "POST",
        body: formData,
        mode: "no-cors",
      }).then(() => {
      }).catch((err) => {
        console.log(err);
        alert(err);
      });
    } else {
      this.offcanvas.show();
    }
  }

  base64toJpg(base64) {
    const bin = atob(base64.replace(/^.*,/, ""));
    const buffer = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    return new Blob([buffer.buffer], { type: "image/jpeg" });
  }

  clearConfig(event) {
    localStorage.clear();
    const node = event.target;
    node.textContent = "✅ Cleared!";
    setTimeout(() => {
      node.textContent = "Clear Settings";
    }, 2000);
  }
}

const configPanel = new ConfigPanel(document.getElementById("configPanel"));
const thumbnailPanel = new ThumbnailPanel(
  document.getElementById("thumbnailPanel"),
);
const editCarousel = new EditCarousel(document.getElementById("editCarousel"));
const filterPanel = new FilterPanel(document.getElementById("filterPanel"));
const loadPanel = new LoadPanel(document.getElementById("loadPanel"));
const cameraPanel = new CameraPanel(document.getElementById("cameraPanel"));
const cropPanel = new CropPanel(document.getElementById("cropPanel"));
loadConfig();
initLangSelect();
initTooltip();
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
globalThis.addEventListener("resize", () => cropPanel.resizeCropPivots());
globalThis.ondragover = (event) => {
  event.preventDefault();
};
globalThis.ondrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  loadPanel.loadFile(file);
};
globalThis.addEventListener("paste", (event) => {
  const item = event.clipboardData.items[0];
  const file = item.getAsFile();
  if (!file) return;
  loadPanel.loadFile(file);
});

await loadScript(await getOpenCVPath());
cv = await cv();
