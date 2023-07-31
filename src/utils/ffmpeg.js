import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const ffmpeg = createFFmpeg({log: false,});
// console.log('ffmpeg', ffmpeg, ffmpeg.isLoaded());
ffmpeg.load()

function initFFmpeg () {
    return new Promise(async (resolve, reject) => {
        const res = { ffmpeg, fetchFile };
        if (ffmpeg.isLoaded()) {
            resolve(res);
        } else {
            ffmpeg.load(() => {
                resolve(res);
            }).catch(err => {
                reject(err);
                console.log('ffmpeg error', err);
            });
        }
    });
}

export default initFFmpeg;
