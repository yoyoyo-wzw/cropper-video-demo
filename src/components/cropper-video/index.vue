<template>
    <div
        class="cropper-video"
        :style="{ width, height }"
    >
        <div
            class="video-box"
            ref="videoBoxRef"
        >
            <video
                ref="videoPlayer"
                :src="videoInfo.videoUrl"
                controls="true"
                preload="auto"
                class="video-player"
                @timeupdate="onTimeupdate"
            />
            <cropBox
                v-show="file"
                v-bind="_cropBoxOptions"
                @change="cropBoxChange"
            />
        </div>
        <ul class="time-list">
            <li
                v-for="(i, n) in timeList"
                :key="n"
            >
                {{ i }}
            </li>
        </ul>
        <div class="crop-filter">
            <div
                ref="shaft"
                class="timer-shaft"
            >
                <div
                    :style="{
                        width:
                            data.endLeft -
                            data.startLeft -
                            startSlideWidth +
                            'px',
                        left: data.startLeft + startSlideWidth + 'px',
                    }"
                    class="white-shade"
                />
                <div
                    :style="{ width: Math.max(0, data.startLeft) + 'px' }"
                    class="left-shade"
                />
                <div
                    ref="rightShade"
                    :style="{
                        width:
                            Math.max(
                                0,
                                shaftWidth - data.endLeft - endSlideWidth
                            ) + 'px',
                    }"
                    class="right-shade"
                />
                <div
                    ref="start"
                    class="strat-circle circle"
                    :style="{ left: data.startLeft + 'px' }"
                    @mousedown="startFilterMD"
                >
                    <div class="center" />
                </div>
                <div
                    ref="end"
                    class="end-circle circle"
                    :style="{ left: data.endLeft + 'px' }"
                    @mousedown="endFilterMD"
                >
                    <div class="center" />
                </div>
                <!-- v-loading="isStartFrame" -->
                <div class="frame-box">
                    <img
                        v-for="(i, n) in videoFrames"
                        :style="{ width: `calc(100% / ${videoFrames.length})` }"
                        :key="n"
                        :src="i"
                        class="frames"
                        alt
                        @dragstart.prevent
                    />
                </div>
            </div>
        </div>
        <div class="flex">
            <button
                type="success"
                size="small"
                @click="onSplitPlay"
            >
                播放
            </button>
            <button
                :disabled="isStartFrame || isStartSplit"
                type="primary"
                size="small"
                @click="onStartCropper"
            >
                确定裁剪
            </button>
        </div>
    </div>
</template>
<script>
import { getVideoInfo, getNowTime } from '@/utils';
import arrayBufferToBase64 from '@/utils/arrayBufferToBase64';
import initFFmpeg from '@/utils/ffmpeg';
import cropBox from '@/components/crop-box/index.vue'

// 随便获取一个1970年以后的年月日毫秒
const tempTimeM = new Date('1970-01-02').getTime();

export default {
    name: 'CropperVideo',
    components: {
        cropBox
    },
    props: {
        width: { type: String, default: '500px' },
        height: { type: String, default: '500px' },
        spliterStartTime: { type: Number, default: 0 },
        spliterEndTime: { type: Number, default: 0 },
        fileName: { type: String, default: '' },
        file: { type: File, default: null },
        frames: { type: Array, default: () => [] },
        // 裁切区域
        cropBoxOptions: { type: Object, default: () => ({}) }
    },
    data() {
        return {
            shaftWidth: 0,
            startSlideWidth: 0,
            endSlideWidth: 0,
            videoInfo: {
                width: 0,
                height: 0,
                duration: 0,
                ccbl: 1,
                fileName: '',
                file: null,
                videoUrl: '',
                viewWidth: 0, // 可视视频宽
                viewHeight: 0, // 可是视频高
            },
            _cropBoxOptions: {
                containerWidth: 0,
                containerHeight: 0,
                mediaWidth: 0,
                mediaHeight: 0
            },
            cropBoxResult: {},
            data: {
                startMTime: 0, // 裁剪的开始毫秒
                endMTime: 0, // 裁剪的结束毫秒
                startLeft: 0, // 开始按钮距离左侧距离
                endLeft: 0, // 结束按钮距离左侧距离
                roal: 0, // 毫秒/px(1px===的毫秒数)
            },
            timeList: ['00:00:00.0'], // 时间轴显示时间数组
            isStartFrame: false,
            videoFrames: [],
            isStartSplit: false,
        };
    },
    watch: {
        file() {
            this.updateFile();
        },
    },
    computed: {
        videoViewRadio() {
            const { width, viewWidth } = this.videoInfo;
            return width / viewWidth;
        },
    },
    methods: {
        initCropArea() {
            const { clientWidth, clientHeight } = this.$refs.videoBoxRef;
            this._cropBoxOptions = {
                ...this.cropBoxOptions,
                containerWidth: clientWidth,
                containerHeight: clientHeight
            }
        },
        async updateFile() {
            if (!this.file) return;
            this.removeData();
            let { url: videoUrl, ccbl, ..._videoInfo } = await getVideoInfo(
                this.file
            );
            
            const { clientWidth, clientHeight } = this.$refs.videoBoxRef;
            let videoViewWidth, videoViewHeight;
            if (ccbl > 1) {
                videoViewWidth = clientWidth;
                videoViewHeight = clientWidth / ccbl;
            } else {
                videoViewWidth = clientHeight * ccbl;
                videoViewHeight = clientHeight;
            }

            this.videoInfo = {
                ..._videoInfo,
                fileName: this.fileName,
                file: this.file,
                videoUrl,
                viewWidth: videoViewWidth,
                viewHeight: videoViewHeight
            };
            this._cropBoxOptions.mediaWidth = videoViewWidth;
            this._cropBoxOptions.mediaHeight = videoViewHeight

            this.updateSlideBar();

            if (this.frames.length) {
                this.videoFrames = this.videoInfo.frames;
            } else {
                this.getVideoFrames();
            }
        },
        cropBoxChange (val) {
            this.cropBoxResult = val;
        },
        updateSlideBar() {
            const { duration } = this.videoInfo;
            // console.log('duration:', duration);
            const durationM = duration * 1000;

            this.data.roal = durationM / this.shaftWidth;
            // 开始毫秒数
            let startM = this.spliterStartTime;
            // 结束毫秒数
            let endM = this.spliterEndTime || durationM;
            // console.log(startM, endM);
            // 设置滑块的开始结束位置
            const startSlideBarRef = this.$refs.start;
            const endSlideBarRef = this.$refs.end;
            startSlideBarRef.style.left =
                startM / this.data.roal - this.startSlideWidth + 'px';
            endSlideBarRef.style.left = endM / this.data.roal + 'px';

            this.data.startLeft = startSlideBarRef.offsetLeft;
            this.data.endLeft = endSlideBarRef.offsetLeft;
            this.timeList = [getNowTime(tempTimeM)];
            let paragraph = durationM / 5;
            for (let i = 1; i < 6; i++) {
                this.timeList.push(getNowTime(tempTimeM + paragraph * i));
            }
            // console.log('paragraph:', this.timeList);
            Object.assign(this.data, {
                startMTime: startM,
                endMTime: endM,
            });
            this.changeSplitTime();
        },
        onTimeupdate() {
            const videoDom = this.$refs.videoPlayer;
            const { currentTime, paused } = videoDom;
            if (paused) return;
            const { endMTime } = this.data;
            // 超过裁剪结束时间则暂停播放
            if (currentTime > endMTime / 1000) {
                videoDom.currentTime = endMTime / 1000;
                videoDom.pause();
            }
        },
        // 设置播放点
        playByMSeconds(num = 0) {
            // console.log(num, this.$refs.videoPlayer);
            if (!this.$refs.videoPlayer) return;
            this.$refs.videoPlayer.currentTime = num / 1000;
        },
        // 起始按钮
        startFilterMD(e) {
            this.$refs.videoPlayer.pause();
            let odiv = e.currentTarget; // 获取目标父元素
            // 算出鼠标相对元素的位置
            let relWidth = e.clientX - odiv.offsetLeft;

            const { endLeft, roal } = this.data;
            document.onmousemove = (e) => {
                // 用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
                let move = e.clientX - relWidth;

                // 移动当前元素
                // let lastLeft = move + originOffsetLeft;
                if (move < -this.startSlideWidth) {
                    move = -this.startSlideWidth;
                } else if (move > endLeft - Math.ceil(1000 / roal)) {
                    // 裁剪时间的间隔最小为1000毫秒
                    move = endLeft - Math.ceil(1000 / roal);
                }
                odiv.style.left = move + 'px';
                this.data.startMTime = roal * (move + this.startSlideWidth);
                this.data.startLeft = move;
                this.playByMSeconds(this.data.startMTime);
            };
            document.onmouseup = (e) => {
                document.onmousemove = null;
                document.onmouseup = null;
                this.changeSplitTime();
            };
        },
        // 结束按钮
        endFilterMD(e) {
            this.$refs.videoPlayer.pause();
            let odiv = e.currentTarget; // 获取目标父元素
            // 算出鼠标相对元素的位置
            let relWidth = e.clientX - odiv.offsetLeft;

            const { startLeft, roal } = this.data;
            document.onmousemove = (e) => {
                // 用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
                let move = e.clientX - relWidth;

                if (move < startLeft + Math.ceil(1000 / roal)) {
                    move = startLeft + Math.ceil(1000 / roal);
                } else if (move > this.shaftWidth) {
                    move = this.shaftWidth;
                }
                odiv.style.left = move + 'px';

                this.data.endMTime = roal * move;
                this.data.endLeft = move;

                this.playByMSeconds(this.data.endMTime);
            };
            document.onmouseup = (e) => {
                document.onmousemove = null;
                document.onmouseup = null;
                this.changeSplitTime();
            };
        },
        // 传出起止时间
        changeSplitTime() {
            let arr = [this.data.startMTime, this.data.endMTime];
            this.$emit('queryTime', arr);
        },
        // 播放裁剪的起止时间
        onSplitPlay() {
            const videoDom = this.$refs.videoPlayer;
            const { startMTime } = this.data;
            videoDom.currentTime = startMTime / 1000;
            videoDom.play();
        },
        // 开始裁剪
        async onStartCropper() {
            const { startMTime, endMTime } = this.data;
            let { fileName } = this.videoInfo;
            const { width, height,x, y } = this.cropBoxResult
            this.$emit('cropper', [startMTime, endMTime]);
            // const loading = this.$loading({
            //     lock: true,
            //     text: 'Loading',
            //     spinner: 'el-icon-loading',
            //     background: 'rgba(0, 0, 0, 0.7)'
            // });
            this.isStartSplit = true;
            const { ffmpeg } = await initFFmpeg();
            const output1 = 'output1.mp4';
            const output2 = 'output2.mp4';
            // 截取视频片段
            await ffmpeg.run(
                '-ss',
                `${startMTime / 1000}`,
                '-to',
                `${endMTime / 1000}`,
                '-i',
                fileName,
                '-vcodec',
                'copy',
                '-acodec',
                'copy',
                output1
            );
            // 截取视频区域大小
            await ffmpeg.run(
                '-i',
                output1,
                '-vf',
                `crop=w=${width * this.videoViewRadio}:h=${height * this.videoViewRadio}:x=${x * this.videoViewRadio}:y=${y * this.videoViewRadio}`,
                output2
            );
            let data = ffmpeg.FS('readFile', output2); // 读取缓存
            let blob = new Blob([data.buffer], { type: 'video/mp4' });
            const newUrl = URL.createObjectURL(blob); // 转为Blob URL
            // console.log(blob, newUrl);
            this.$emit('cropperOk', { blob, url: newUrl });
            // loading.close();
            this.isStartSplit = false;
        },
        onCancel() {
            this.$emit('cancel');
        },
        // 上传视频后解析视频帧
        async getVideoFrames() {
            try {
                const { ffmpeg, fetchFile } = await initFFmpeg();
                let { fileName, file, duration } = this.videoInfo;
                ffmpeg.FS('writeFile', fileName, await fetchFile(file));
                // 计算每秒需要抽的帧数
                let step = Math.ceil(20 / duration);
                const allNum = Math.floor(step * duration);
                // console.log('step', step, allNum);
                this.isStartFrame = true;
                await ffmpeg.run(
                    '-i',
                    fileName,
                    '-r',
                    `${step}`,
                    '-ss',
                    '1',
                    '-vframes',
                    `${allNum}`,
                    '-f',
                    'image2',
                    '-s',
                    '88*50',
                    'image-%02d.png'
                );
                // ffmpeg -i 2.mp4 -r 1  -ss 0 -vframes 5 -f image2 -s 352x240 image-%02d.jpeg
                this.isStartFrame = false;
                for (let i = 1; i <= allNum; i++) {
                    const temp = (i + '').padStart(2, '0');
                    this.videoFrames.push(
                        arrayBufferToBase64(
                            ffmpeg.FS('readFile', 'image-' + temp + '.png')
                        )
                    );
                }
                this.$emit('frame', this.videoFrames);
            } catch (err) {
                console.log(err);
            }
        },
        removeData() {
            this.timeList = ['00:00:00.0'];
            this.videoFrames = [];
            this.data = this.$options.data().data;
        },
    },
    mounted() {
        this.initCropArea();

        const shaftRef = this.$refs.shaft;
        this.shaftWidth = shaftRef.clientWidth;

        const startSlideBarRef = this.$refs.start;
        this.startSlideWidth = startSlideBarRef.clientWidth;
        this.data.startLeft = -this.startSlideWidth;

        const endSlideBarRef = this.$refs.end;
        this.endSlideWidth = endSlideBarRef.clientWidth;
        this.data.endLeft = this.shaftWidth;

        this.updateFile();
    },
};
</script>

<style scoped lang="less">
.cropper-video {
    display: flex;
    flex-direction: column;
    user-select: none;
    .video-box {
        flex: 1;
        overflow: hidden;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        background-color: #ccc;
        position: relative;
        .video-player {
            width: 100%;
            max-height: 100%;
        }
        
    }
    .time-list {
        width: 100%;
        height: 20px;
        color: #c0c0c0;
        font-size: 0.12rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        // display: none;
        margin-bottom: 10px;
    }

    .crop-filter {
        height: 60px;
        width: 100%;
        padding: 0 6px;
        box-sizing: border-box;
        display: flex;
        align-items: center;

        .timer-shaft {
            width: 100%;
            height: 100%;
            position: relative;

            .circle {
                width: 6px;
                position: absolute;
                top: -5%;
                height: 110%;
                background-color: hotpink;
                cursor: e-resize;
                display: flex;
                align-items: center;
                justify-content: center;

                .center {
                    width: 0.02rem;
                    height: 0.15rem;
                    background-color: #d8d8d8;
                }
            }

            .strat-circle {
                left: 0;
                border-radius: 1px 0 0 1px;
            }

            .end-circle {
                left: 0;
                border-radius: 0 1px 1px 0;
            }

            .white-shade {
                position: absolute;
                top: -5%;
                height: 110%;
                width: 100%;
                background-color: transparent;
                border: 4px solid hotpink;
                box-sizing: border-box;
                border-left: 0;
                border-right: 0;
            }

            .left-shade,
            .right-shade {
                position: absolute;
                top: -5%;
                height: 110%;
                background: rgba(0, 0, 0, 0.6);
            }
            .left-shade {
                left: 0;
            }

            .right-shade {
                right: 0;
            }

            .frame-box {
                height: 100%;
            }
        }
    }
    > .flex {
        justify-content: flex-end;
        margin-top: 20px;
    }
    .frames {
        user-select: none;
        height: 100%;
        object-fit: cover;
        // &:hover {
        //   object-fit: contain;
        //   width: 100px !important;
        //   position: absolute;
        //   top: -60px;
        //   // height: 100% !important;
        // }
    }
}
</style>
