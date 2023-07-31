// 精准到毫秒
function getNowTime (val) {
    const date = new Date(val);
    const hour = (date.getHours() - 8) < 10 ? '0' + (date.getHours() - 8) : date.getHours() - 8;
    const minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    const second = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    const milliSeconds = date.getMilliseconds(); // 毫秒
    const currentTime = hour + ':' + minute + ':' + second + '.' + milliSeconds;
    // console.log(currentTime, val)
    return currentTime;
}

const getVideoInfo = async (files) => {
    if (!files) return false;
    const url = URL.createObjectURL(files);
    // console.log(url);
    const doms = document.createElement('video');
    doms.src = url;
    doms.style.display = 'none';
    document.body.appendChild(doms);
    const res = await _getVideoInfo(doms);
    document.body.removeChild(doms);
    return {
        url,
        ...res
    };
};
const _getVideoInfo = (doms) => {
    // 由于loadedmetadata 是异步代码所以需要promise进行封装转换为同步代码执行
    return new Promise(resolve => {
        doms.addEventListener('loadedmetadata', e => {
            // console.log(gcd)
            let obj = {
                width: doms.videoWidth, // 尺寸宽 --- 分辨率
                height: doms.videoHeight, // 尺寸高
                duration: Number(e.target.duration.toFixed(2)), // 视频时长 1表示一秒
                ccbl: e.target.videoWidth / e.target.videoHeight // 尺寸比例
            };
            resolve(obj);
        });
    });
};

export {getNowTime, getVideoInfo};
