function clearConfig(){localStorage.clear()}function loadConfig(){const a=document.getElementById("config"),b=localStorage.getItem("resolution");b&&(a.resolution.options[b].selected=!0),a.filter.value=localStorage.getItem("filter"),document.getElementById("clientId").value=localStorage.getItem("clientId"),document.getElementById("serverAddress").value=localStorage.getItem("serverAddress"),localStorage.getItem("darkMode")==1&&(document.body.dataset.theme="dark"),localStorage.getItem("overview")==0&&(document.getElementById("overview").hidden=!0)}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}function deleteThumbnails(){while(outputElement.firstChild)outputElement.removeChild(outputElement.lastChild)}function downloadThumbnails(){for(let b=0;b<outputElement.children.length;b++){const a=document.createElement("a");a.download=b+".jpg",a.href=outputElement.children[b].shadowRoot.querySelector("img").src,outputElement.appendChild(a),a.click(),outputElement.removeChild(a)}}function uploadDropbox(){const a=parseQueryString(window.location.hash),b=document.getElementById("clientId").value;if(b!=""&&a&&a.accessToken){const b=new Dropbox.Dropbox({fetch,accessToken:a.access_token});for(let a=0;a<outputElement.children.length;a++){const c="/"+a+".jpg",d=outputElement.children[a].shadowRoot.querySelector("img").src;b.filesUpload({path:c,contents:base64ToArrayBuffer(d)}).then(function(){}).catch(function(a){console.log(a),alert(a.error.error_summary)})}}else{const a=document.getElementById("dropboxAlert");a.hidden=!1,a.scrollIntoView()}}function base64ToArrayBuffer(a){a=a.slice(a.indexOf("base64,")+7);const d=window.atob(a),b=binary_string.length,c=new Uint8Array(b);for(let a=0;a<b;a++)c[a]=d.charCodeAt(a);return c.buffer}function base64toJpg(c){const a=atob(c.replace(/^.*,/,"")),b=new Uint8Array(a.length);for(let c=0;c<a.length;c++)b[c]=a.charCodeAt(c);return new Blob([b.buffer],{type:"image/jpeg"})}function uploadServer(){const a=document.getElementById("serverAddress").value,b=new FormData;if(a!=""){for(let c=0;c<outputElement.children.length;c++){let a=outputElement.children[c].shadowRoot.querySelector("img").src;console.log(a),a=a.slice(a.indexOf("base64,")+7),console.log(a),b.append("files",base64toJpg(a),c+".jpg")}fetch(a,{method:"POST",body:b,mode:"no-cors"}).then(function(){}).catch(function(a){console.log(a),alert(a)})}else{const a=document.getElementById("serverAlert");a.hidden=!1,a.scrollIntoView()}}function parseQueryString(b){const a=Object.create(null);return typeof b!="string"?a:(b=b.trim().replace(/^(\?|#|&)/,""),!b)?a:(b.split("&").forEach(function(e){const d=e.replace(/\+/g," ").split("=");let b=d.shift(),c=d.length>0?d.join("="):void 0;b=decodeURIComponent(b),c=c===void 0?null:decodeURIComponent(c),a[b]===void 0?a[b]=c:Array.isArray(a[b])?a[b].push(c):a[b]=[a[b],c]}),a)}document.getElementById("reloadApp").addEventListener("click",function(a){a.preventDefault();const b=document.getElementById("clientId").value;location.href=this.dataset.href+"&client_id="+b},!1),customElements.define("img-box",class extends HTMLElement{constructor(){super();const a=document.getElementById("img-box").content.cloneNode(!0);a.querySelector("img").onclick=function(){const a=document.getElementById("previewImage");a.src=this.src,a.className=this.className+" img-fluid",previewModal.show()},a.querySelector(".close").onclick=function(){this.parentNode.parentNode.parentNode.host.remove()},a.querySelector(".rotate").onclick=function(){const b=this.parentNode.parentNode,a=b.querySelector("img"),c=(parseInt(a.dataset.angle)+90)%360;c%180==0?(b.style.width=a.width+"px",b.style.height=a.height+"px"):(b.style.width=a.height+"px",b.style.height=a.width+"px"),a.className="rotate"+c,a.dataset.angle=c},this.attachShadow({mode:"open"}).appendChild(a)}});function initializeEvents(){const b=document.getElementsByClassName("event-close");for(let a=0;a<b.length;a++)b[a].addEventListener("click",function(){document.querySelector(this.dataset.target).hidden=!0});const c=document.getElementsByClassName("event-open");for(let a=0;a<c.length;a++)c[a].addEventListener("click",function(){document.querySelector(this.dataset.target).hidden=!1});const a=document.getElementById("lang");a.onchange=function(){const b=a.options[a.selectedIndex].value;location.href="/photo-scanner/"+b}}initializeEvents();let animationFrame;const snapCanvas=document.getElementById("snapCanvas"),uploadCanvas=document.getElementById("uploadCanvas"),video=document.createElement("video"),videoOptions={video:{facingMode:"environment"}},videoCanvas=document.getElementById("videoCanvas"),videoCanvasContext=videoCanvas.getContext("2d"),loadingMessage=document.getElementById("loadingMessage"),outputElement=document.getElementById("output");navigator.mediaDevices.getUserMedia===void 0&&(navigator.mediaDevices.getUserMedia=function(b){const a=navigator.webkitGetUserMedia||navigator.mozGetUserMedia;return a?new Promise(function(c,d){a.call(navigator,b,c,d)}):Promise.reject(new Error("getUserMedia is not implemented in this browser"))}),cv.then(a=>{document.getElementById("snapshot").onclick=n,document.getElementById("clipboard").onclick=p,document.getElementById("selectImages").onclick=function(){document.getElementById("inputImages").click()};function c(a,b){uploadCanvas.hidden=!0,a.srcObject&&a.srcObject.getVideoTracks().forEach(a=>{a.stop()}),navigator.mediaDevices.getUserMedia(b).then(function(b){videoCanvas.hidden=!1,a.srcObject=b,a.setAttribute("playsinline",!0),a.play(),loadingMessage.textContent="⌛ Loading video...",animationFrame=requestAnimationFrame(g)}).catch(function(a){})}c(video,videoOptions),document.getElementById("facingMode").onclick=function(){videoOptions.video.facingMode=="user"?videoOptions.video.facingMode="environment":videoOptions.video.facingMode="user",c(video,videoOptions)},document.getElementById("inputImages").onchange=function(c){loadingMessage.textContent="⌛ Loading image...",loadingMessage.hidden=!1,cancelAnimationFrame(animationFrame),uploadCanvas.hidden=!1,videoCanvas.hidden=!0;const a=c.target.files;for(let c=0;c<a.length;c++)if(a[c].type.startsWith("image/")){a[c].type.startsWith("image/svg")&&alert("Sorry, SVG is probably not convertible.");const d=new Image;d.onload=function(){uploadCanvas.width=d.width,uploadCanvas.height=d.height,uploadCanvas.getContext("2d").drawImage(d,0,0,uploadCanvas.width,uploadCanvas.height),loadingMessage.hidden=!0,b(uploadCanvas)},d.src=URL.createObjectURL(a[c])}};function g(){if(video.readyState===video.HAVE_ENOUGH_DATA){loadingMessage.hidden=!0,videoCanvas.width=video.videoWidth,videoCanvas.height=video.videoHeight,videoCanvasContext.drawImage(video,0,0,videoCanvas.width,videoCanvas.height);const c=a.imread(videoCanvas),b=new a.Mat;a.resize(c,b,new a.Size(videoCanvas.width/2,videoCanvas.height/2),0,0,a.INTER_NEAREST);const d=f(b);d.total()==4?(a.imshow("videoCanvas",b),document.getElementById("snapshot").style.fill="blue"):document.getElementById("snapshot").style.fill="black",d.delete(),c.delete(),b.delete()}animationFrame=requestAnimationFrame(g)}function r(a){const b=[a[0]+a[1],a[2]+a[3],a[4]+a[5],a[6]+a[7]];let h=b[0],i=b[0],f=0,g=0;for(let a=1;a<4;a++)i<b[a]&&(i=b[a],g=a),h>b[a]&&(h=b[a],f=a);const j=[f,g],c=[0,1,2,3].filter(function(a){return!j.includes(a)});let d,e;return a[c[0]*2]<a[c[1]*2]?(d=c[0],e=c[1]):(d=c[1],e=c[0]),[a[f*2],a[f*2+1],a[d*2],a[d*2+1],a[g*2],a[g*2+1],a[e*2],a[e*2+1]]}function f(d){const b=a.Mat.zeros(d.rows,d.cols,a.CV_8UC3);a.cvtColor(d,b,a.COLOR_RGBA2GRAY,0);const k=(b.rows+b.cols)/8*2+1;a.adaptiveThreshold(b,b,255,a.ADAPTIVE_THRESH_GAUSSIAN_C,a.THRESH_BINARY,k,0);const c=new a.MatVector,g=new a.Mat;a.findContours(b,c,g,a.RETR_EXTERNAL,a.CHAIN_APPROX_SIMPLE),b.delete();let i=0,j=0;for(let b=0;b<c.size();b++){const d=c.get(b),e=a.contourArea(d,!1);j<e&&(j=e,i=b),d.delete()}const h=c.get(i);c.delete();const f=new a.MatVector,e=new a.Mat;if(a.approxPolyDP(h,e,.05*a.arcLength(h,!0),!0),f.push_back(e),e.total()==4){const b=new a.Scalar(255,255,255,0);a.drawContours(d,f,0,b,4,a.LINE_8,g,0)}return g.delete(),h.delete(),f.delete(),e}function k(b,d){const c=f(b);if(c.total()==4){const g=c.data32S.slice(0,8),k=a.matFromArray(4,1,a.CV_32FC2,g),[e,f]=j(g,b.rows,b.cols),l=new a.Size(e,f),m=a.matFromArray(4,1,a.CV_32FC2,[0,0,0,f,e,f,e,0]),h=a.getPerspectiveTransform(k,m);a.warpPerspective(b,b,h,l,a.INTER_LINEAR,a.BORDER_CONSTANT,new a.Scalar),h.delete(),d=="1"?i(b):d=="2"&&q(b)}a.imshow("snapCanvas",b),c.delete()}function j(a,b,c){const d=m();if(d==0){const d=Math.sqrt((a[0]-a[2])**2+(a[1]-a[3])**2),e=Math.sqrt((a[2]-a[4])**2+(a[3]-a[5])**2),f=Math.sqrt((a[4]-a[6])**2+(a[5]-a[7])**2),g=Math.sqrt((a[6]-a[0])**2+(a[7]-a[2])**2),h=e+g,i=d+f;c=Math.round(b/h*i)}else b>c?c=b/d:b=c*d;return[b,c]}function i(b){const c=new a.MatVector,d=new a.MatVector;a.split(b,c);for(let f=0;f<3;f++){const b=c.get(f),e=new a.Mat,g=a.Mat.ones(7,7,a.CV_8U),i=new a.Point(-1,-1);a.dilate(b,e,g,i,1,a.BORDER_CONSTANT,a.morphologyDefaultBorderValue()),a.medianBlur(e,e,21);const j=new a.Scalar(255,255,255,0),h=new a.Mat(b.rows,b.cols,a.CV_8UC1,j);a.absdiff(b,e,e),a.subtract(h,e,b),a.normalize(b,b,alpha=0,beta=255,norm_type=a.NORM_MINMAX),d.push_back(b),b.delete(),g.delete(),e.delete(),h.delete()}return a.merge(d,b),c.delete(),d.delete(),b}let d;tf.loadLayersModel("/photo-scanner/denoise/model.json").then(a=>{d=a});function q(b){try{const c=new a.Mat;a.resize(b,c,new a.Size(256,256),0,0,a.INTER_NEAREST);const e=tf.tidy(()=>{const i=3;a.cvtColor(c,c,a.COLOR_RGBA2RGB,0);let g=tf.tensor3d(new Uint8Array(c.data),[c.rows,c.cols,i]).expandDims(0).toFloat();g=tf.cast(g,"float32").div(tf.scalar(255));const e=d.predict(g).mul(tf.scalar(255)).dataSync(),f=new Uint8ClampedArray(c.rows*c.cols*4);for(let a=0;a<e.length;a+=3){const b=a*3/4;f[b]=e[a],f[b+1]=e[a+1],f[b+2]=e[a+2],f[b+3]=0}const j=new ImageData(f,256,256),h=a.matFromImageData(j);return a.resize(h,h,new a.Size(b.rows,b.cols),0,0,a.INTER_NEAREST),a.absdiff(b,b,h),c.delete(),e});return e}catch(a){alert(a),console.log(a)}}function h(){const c=document.getElementById("config"),d=parseInt(c.resolution.value)*1e3,a=videoCanvas.width/videoCanvas.height,b=Math.sqrt(d/a);return[b*a,b]}function l(){const a=document.getElementById("config");return a.filter.value}function m(){const b=document.getElementById("config");let a=parseFloat(b.ratio.value);return a==-1&&(a=document.getElementById("ratioValue").value),a}function n(){if(video.srcObject){new Audio("camera.mp3").play();const[a,b]=h(),c={video:{facingMode:"environment",width:{min:0,max:a},height:{min:0,max:b},aspectRatio:a/b}};o(video,c)}}function o(a,b){uploadCanvas.hidden=!0,a.srcObject&&a.srcObject.getVideoTracks().forEach(function(a){a.stop()}),navigator.mediaDevices.getUserMedia(b).then(function(b){a.srcObject=b,a.setAttribute("playsinline",!0),a.play(),animationFrame=requestAnimationFrame(e)}).catch(function(a){})}function e(){if(video.readyState===video.HAVE_ENOUGH_DATA){videoCanvas.width=video.videoWidth,videoCanvas.height=video.videoHeight,videoCanvasContext.drawImage(video,0,0,videoCanvas.width,videoCanvas.height),b(videoCanvas),c(video,videoOptions);return}animationFrame=requestAnimationFrame(e)}function p(){try{loadingMessage.textContent="⌛ Loading image...",loadingMessage.hidden=!1,navigator.clipboard.read().then(function(a){for(let c=0;c<a.length;c++){const d=a[c];for(let a=0;a<d.types.length;a++){const c=d.types[a];c.indexOf("image/")!=-1&&(c.startsWith("image/svg")&&alert("Sorry, SVG is probably not convertible."),d.getType(c).then(function(c){cancelAnimationFrame(animationFrame),uploadCanvas.hidden=!1,videoCanvas.hidden=!0;const a=new Image;a.onload=function(){uploadCanvas.width=a.width,uploadCanvas.height=a.height,uploadCanvas.getContext("2d").drawImage(a,0,0,uploadCanvas.width,uploadCanvas.height),loadingMessage.hidden=!0,b(uploadCanvas)},a.src=URL.createObjectURL(c)}))}}})}finally{loadingMessage.hidden=!0}}document.body.onpaste=function(d){loadingMessage.textContent="⌛ Loading image...",loadingMessage.hidden=!1;const a=(d.clipboardData||d.originalEvent.clipboardData).items;let c;for(let b=0;b<a.length;b++)a[b].type.indexOf("image")===0&&(c=a[b].getAsFile());if(c!==null){const a=new FileReader;a.onload=function(c){loadingMessage.hidden=!0,cancelAnimationFrame(animationFrame),uploadCanvas.hidden=!1,videoCanvas.hidden=!0;const a=new Image;a.onload=function(){uploadCanvas.width=a.width,uploadCanvas.height=a.height,uploadCanvas.getContext("2d").drawImage(a,0,0,uploadCanvas.width,uploadCanvas.height),loadingMessage.hidden=!0,b(uploadCanvas)},a.src=c.target.result},a.readAsDataURL(c)}loadingMessage.hidden=!0};function b(e){const b=a.imread(e);k(b,l()),a.imshow("snapCanvas",b),b.delete();const c=document.createElement("img-box"),d=c.shadowRoot.querySelector("img");d.src=snapCanvas.toDataURL("image/jpg"),d.height=150/snapCanvas.width*snapCanvas.height,outputElement.append(c)}}).catch(a=>{alert(a)}),loadConfig();const tooltipTriggerList=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));tooltipTriggerList.map(function(a){return new bootstrap.Tooltip(a)});const previewModal=new bootstrap.Modal(document.getElementById("previewModal"));document.getElementById("config").addEventListener("change",function(){localStorage.setItem("resolution",this.resolution.selectedIndex),localStorage.setItem("filter",this.filter.value),localStorage.setItem("clientId",document.getElementById("clientId").value),localStorage.setItem("serverAddress",document.getElementById("serverAddress").value)}),document.getElementById("overview").addEventListener("click",function(){localStorage.setItem("overview",0)}),document.getElementById("clearConfig").onclick=clearConfig,document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("deleteThumbnails").onclick=deleteThumbnails,document.getElementById("downloadThumbnails").onclick=downloadThumbnails,document.getElementById("uploadDropbox").onclick=uploadDropbox,document.getElementById("uploadServer").onclick=uploadServer