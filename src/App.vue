<script setup>
import { ref, reactive, watch } from 'vue'
import cropperVideo from './components/cropper-video/index.vue'

const cropperVideoData = reactive({
  file: null,
  fileName: ''
})
const cropperOkData = ref({});

const changeFile = (e) => {
  const file = e.target.files[0]
  cropperVideoData.file = file;
  cropperVideoData.fileName = file.name
}
const cropperOk = (data) => {
    // const { blob, url } = data;
    // blob：用于上传文件，提交服务器
    // url：本地临时存储地址，用于本地预览

    // let formData = new FormData();
    // formData.append('file', blob, 'splitFile.mp4');
    
    cropperOkData.value = data;
}
</script>

<template>
  <div>
    <input type="file" accept="video/*" @change="changeFile" style="marginBottom: 30px">
    <cropperVideo 
      v-bind="cropperVideoData" 
      @cropperOk="cropperOk"
    ></cropperVideo>
    <video
        v-if="cropperOkData.url"
        :src="cropperOkData.url"
        controls
        width="300"
        height="300"
    />
  </div>
</template>

<style scoped>
</style>
