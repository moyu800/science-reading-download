let config = {
  interval: 1000,
  filenameFront: '',
  filenameBack: '',
  errMax: 5,
}; //在此修改配置
let href = document.location.href;
let urlArr = href.split('/');
const imageRegExp = /\/image\/(\d+)\//;
const currentPage = imageRegExp.exec(href);
if (currentPage) {
  console.log('当前页面url检测正常');
} else {
  console.error('当前页面url检测异常');
}
let div = document.createElement('div');
div.innerHTML = `
	<div  style="
		position: absolute;
	    z-index: 99;
	    left: 0;
	    top: 0;
	    height: 600px;
	    overflow-y: scroll;
	    background-color: white;
	    max-width: 60%;">
		<input type="number" id="page-start" value="${currentPage[1]}">-<input type="number" id="page-end">
		<button onclick="getPage()">获取页面</button>
		<button onclick="downloadPage()">下载文件</button>
		<input type="checkbox" id="auto"/>自动模式
		<br/>
		<span id="size"></span>
		<br/><img id="image"  alt="" src="${href}"/>
	</div>
`;
document.body.appendChild(div);
let start = document.getElementById('page-start');
let end = document.getElementById('page-end');
let img = document.getElementById('image');
let auto = document.getElementById('auto');
let size = document.getElementById('size');
let error = 0;

img.onload = () => {
  size.innerHTML = img.offsetWidth + '*' + img.offsetHeight;
};

function getPage() {
  let page = start.value;
  let url = href.replace(imageRegExp, `/image/${page}/`);
  let xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function () {
    if (this.status === 200) {
      let type = this.getResponseHeader('Content-Type');
      if (type.indexOf('json') !== -1) {
        console.log('加载第', page, '页', '过快，稍后重试', type);
        error++;
        if (error >= config.errMax) {
          console.error('加载第', page, '页', '重试次数超限，终止运行');
        } else {
          setTimeout(getPage, config.interval * 5);
        }
      } else {
        error = 0;
        let blob = this.response;
        window.URL.revokeObjectURL(img.src);
        img.src = window.URL.createObjectURL(blob);
        console.log('加载第', page, '页', '成功', type);
        if (auto.checked) {
          setTimeout(downloadPage, config.interval);
        }
      }
    } else if (this.status === 500) {
      console.log('加载第', page, '页', '等待一段时间后重试', 500);
      error++;
      if (error >= config.errMax) {
        console.error('加载第', page, '页', '重试次数超限，终止运行');
      } else {
        setTimeout(getPage, config.interval * 20);
      }
    } else {
      console.log('加载第', page, '页', this.status);
    }
  };
  xhr.open('GET', url);
  xhr.send();
}

function downloadPage() {
  let save_link = document.createElement('a');
  save_link.href = img.src;
  save_link.download = config.filenameFront + start.value + config.filenameBack + '.png';
  save_link.click();
  let endPage = parseInt(end.value) ? parseInt(end.value) : 0;
  if (auto.checked && parseInt(start.value) >= endPage) {
    console.info('遍历完毕');
  } else {
    start.value = parseInt(start.value) + 1;
    if (auto.checked) {
      setTimeout(getPage, config.interval);
    }
  }
}
