<template>
    <div 
        class="crop-box"
        :style="{
            width: cropAreaInfo.width + 'px',
            height: cropAreaInfo.height + 'px',
            transform: `translate(${cropAreaInfo.translateX}px, ${cropAreaInfo.translateY}px)`
        }"
        @mousedown="areaMousedown"
    >
        <span class="crop-line line-w" :ref="cropDragRef" data-target="t"></span>
        <span class="crop-line line-a" :ref="cropDragRef" data-target="l"></span>
        <span class="crop-line line-s" :ref="cropDragRef" data-target="b"></span>
        <span class="crop-line line-d" :ref="cropDragRef" data-target="r"></span>
        <span class="crop-point point1" :ref="cropDragRef" data-target="l,t"></span>
        <span class="crop-point point2" :ref="cropDragRef" data-target="t"></span>
        <span class="crop-point point3" :ref="cropDragRef" data-target="r,t"></span>
        <span class="crop-point point4" :ref="cropDragRef" data-target="l"></span>
        <span class="crop-point point5" :ref="cropDragRef" data-target="r"></span>
        <span class="crop-point point6" :ref="cropDragRef" data-target="l,b"></span>
        <span class="crop-point point7" :ref="cropDragRef" data-target="b"></span>
        <span class="crop-point point8" :ref="cropDragRef" data-target="r,b"></span>
    </div>
</template>

<script>

export default {
    name: 'CropBox',

    props: {
        // 容器：指的是包裹media元素和裁切组件的父元素（div > [media, crop-bx]）
        containerWidth: { type: Number, default: 1000 },    // 容器实际宽
        containerHeight: { type: Number, default: 1000 },   // 容器实际高
        mediaWidth: { type: Number, default: 0 },   // 媒体在页面上实际展示的宽度
        mediaHeight: { type: Number, default: 0 },   // 媒体在页面上实际展示的高度
        width: { type: Number, default: 80 },   // 默认裁切盒子宽
        height: { type: Number, default: 80 },  // 默认裁切盒子高
        position: { type: String, default: 'center' }, // left-top、left-bottom、right-top、right-bottom
        minWidth: { type: Number, default: 20 },    // 允许裁切的最小宽度
        minHeight: { type: Number, default: 20 },   // 允许裁切的最小高度
        centerBox: { type: Boolean, default: true },    // 是否限制在media内拖拽
    },
    data() {
        return {
            cropAreaInfo: {
                width: 0,
                height: 0,
                translateX: 0,
                translateY: 0,
            },
        };
    },
    computed: {
        leftWhite() {
            return (this.containerWidth - this.mediaWidth) / 2
        },
        topWhite() {
            return (this.containerHeight - this.mediaHeight) / 2
        },
    },
    watch: {
        '$props': {
            handler () {
                this.initCropArea();
            },
            deep: true
        },
        'cropAreaInfo': {
            handler(val) {
                this.$emit('change', {
                    width: val.width,
                    height: val.height,
                    x: val.translateX - this.leftWhite,
                    y: val.translateY - this.topWhite
                });
            },
            deep: true
        }
    },

    methods: {
        initCropArea() {
            const [ clientWidth, clientHeight ] = [this.containerWidth, this.containerHeight];
            
            const cropAreaWidth = Math.min(this.mediaWidth, this.width);
            const cropAreaHeight = Math.min(this.mediaHeight, this.height)
            let x, y
            
            switch(this.position) {
                case 'center':
                    x = (clientWidth - cropAreaWidth) / 2
                    y = (clientHeight - cropAreaHeight) / 2
                    break;
                case 'left-top':
                    x = this.leftWhite
                    y = this.topWhite
                    break;
                case 'left-bottom':
                    x = this.leftWhite
                    y = clientHeight - this.topWhite - cropAreaHeight
                    break;
                case 'right-top':
                    x = clientWidth - this.leftWhite - cropAreaWidth
                    y = this.topWhite
                    break;
                case 'right-bottom':
                    x = clientWidth - this.leftWhite - cropAreaWidth
                    y = clientHeight - this.topWhite - cropAreaHeight
                    break;
            }
            this.cropAreaInfo = {
                width: cropAreaWidth,
                height: cropAreaHeight,
                translateX: x,
                translateY: y
            }
        },
        areaMousedown (oldE) {
            oldE.stopPropagation();
            const {
                width: oldWidth, 
                height: oldHeight, 
                translateX: oldTranslateX, 
                translateY: oldTranslateY 
            } = this.cropAreaInfo;
            const { clientX: oldClientX, clientY: oldClientY } = oldE;
            
            document.onmousemove = (newE) => {
                newE.stopPropagation();
                const { clientX, clientY } = newE
                const moveX = clientX - oldClientX
                const moveY = clientY - oldClientY
                // console.log(moveX, moveY)
                let newTranslateX = oldTranslateX + moveX;
                let newTranslateY = oldTranslateY + moveY;

                if (this.centerBox) {
                    newTranslateX = Math.max(newTranslateX, this.leftWhite)
                    newTranslateX = Math.min(newTranslateX, this.leftWhite + this.mediaWidth - oldWidth)
                    newTranslateY = Math.max(newTranslateY, this.topWhite)
                    newTranslateY = Math.min(newTranslateY, this.topWhite + this.mediaHeight - oldHeight)
                }

                this.cropAreaInfo.translateX = newTranslateX
                this.cropAreaInfo.translateY = newTranslateY
            }
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        cropDragRef (dom) {
            const targets = dom.dataset.target.split(',')
            dom.onmousedown = (oldE) => {
                oldE.stopPropagation();
                const { 
                    width: oldWidth, 
                    height: oldHeight, 
                    translateX: oldTranslateX, 
                    translateY: oldTranslateY 
                } = this.cropAreaInfo;
                const { clientX: oldClientX, clientY: oldClientY } = oldE;
                
                document.onmousemove = (newE) => {
                    newE.stopPropagation();
                    const { clientX, clientY } = newE
                    const moveX = clientX - oldClientX
                    const moveY = clientY - oldClientY
                    // console.log(moveX, moveY)
                    targets.forEach(v => {
                        this.updateCropArea({
                            oldWidth,
                            oldHeight,
                            oldTranslateX,
                            oldTranslateY,
                            moveX,
                            moveY,
                            target: v
                        });
                    })
                }
                document.onmouseup = () => {
                    document.onmousemove = null;
                    document.onmouseup = null;
                };
            }
        },
        updateCropArea (data) {
            const leftWhite = (this.containerWidth - this.mediaWidth) / 2;
            const topWhite = (this.containerHeight - this.mediaHeight) / 2;

            const { 
                oldWidth, oldHeight, 
                oldTranslateX, oldTranslateY, 
                moveX, moveY, target 
            } = data;
            let newWidth, newHeight, newTranslateX, newTranslateY;
            switch(target) {
                case 't':
                    newTranslateY = oldTranslateY + moveY;
                    newHeight = oldHeight - moveY;
                    if (this.centerBox) {
                        if (newTranslateY <= topWhite) {
                            newTranslateY = topWhite
                            newHeight = oldHeight + oldTranslateY - topWhite
                        } else if (newTranslateY > (oldHeight + oldTranslateY - this.minHeight)){
                            newTranslateY = oldHeight + oldTranslateY - this.minHeight
                            newHeight = this.minHeight
                        }
                    }
                    break;
                case 'r':
                    newWidth = oldWidth + moveX;
                    if (this.centerBox) {
                        newWidth = Math.min(newWidth, this.mediaWidth + leftWhite - oldTranslateX);
                        newWidth = Math.max(newWidth, this.minWidth)
                    }
                    break;
                case 'b':
                    newHeight = oldHeight + moveY;
                    if (this.centerBox) {
                        newHeight = Math.min(newHeight, this.mediaHeight + topWhite - oldTranslateY);
                        newHeight = Math.max(newHeight, this.minHeight)
                    }
                    break;
                case 'l':
                    newWidth = oldWidth - moveX;
                    newTranslateX = oldTranslateX + moveX;
                    
                    if (this.centerBox) {
                        if (newTranslateX <= leftWhite) {
                            newTranslateX = leftWhite
                            newWidth = oldWidth + oldTranslateX - leftWhite
                        } else if (newTranslateX > (oldWidth + oldTranslateX - this.minWidth)){
                            newTranslateX = oldWidth + oldTranslateX - this.minWidth
                            newWidth = this.minWidth
                        }
                    }
                    break;
            }
            if (newWidth !== undefined) this.cropAreaInfo.width = newWidth;
            if (newHeight !== undefined) this.cropAreaInfo.height = newHeight;
            if (newTranslateX !== undefined) this.cropAreaInfo.translateX = newTranslateX;
            if (newTranslateY !== undefined) this.cropAreaInfo.translateY = newTranslateY;
            // 不能覆盖整个对象，因为在四个边角拖拽时会出现只有一个方向有效的bug
            // this.cropAreaInfo = {
            //     width: newWidth ?? oldWidth,
            //     height: newHeight ?? oldHeight,
            //     translateX: newTranslateX ?? oldTranslateX,
            //     translateY: newTranslateY ?? oldTranslateY
            // }
        }
    },
};
</script>

<style lang="less" scoped>
.crop-box {
    position: absolute;
    border: 1px solid #39f;
    cursor: move;
    top: 0;
    left: 0;
    .crop-line {
        position: absolute;
        display: block;
        width: 100%;
        height: 100%;
        opacity: 0.1;
    }
    .line-w {
        top: -3px;
        left: 0;
        height: 5px;
        cursor: n-resize;
    }
    .line-a {
        top: 0;
        left: -3px;
        width: 5px;
        cursor: w-resize;
    }
    .line-s {
        bottom: -3px;
        left: 0;
        height: 5px;
        cursor: s-resize;
    }
    .line-d {
        top: 0;
        right: -3px;
        width: 5px;
        cursor: e-resize;
    }
    .crop-point {
        position: absolute;
        width: 8px;
        height: 8px;
        opacity: 0.75;
        background-color: #39f;
        border-radius: 100%;
    }
    .point1 {
        top: -4px;
        left: -4px;
        cursor: nw-resize;
    }
    .point2 {
        top: -4px;
        left: 50%;
        margin-left: -3px;
        cursor: n-resize;
    }
    .point3 {
        top: -4px;
        right: -4px;
        cursor: ne-resize;
    }
    .point4 {
        top: 50%;
        left: -4px;
        margin-top: -3px;
        cursor: w-resize;
    }
    .point5 {
        top: 50%;
        right: -4px;
        margin-top: -3px;
        cursor: e-resize;
    }
    .point6 {
        bottom: -4px;
        left: -4px;
        cursor: sw-resize;
    }
    .point7 {
        bottom: -4px;
        left: 50%;
        margin-left: -3px;
        cursor: s-resize;
    }
    .point8 {
        bottom: -4px;
        right: -4px;
        cursor: se-resize;
    }
}
</style>