# Vue 3 + Vite + ffmpeg

视频裁剪demo，通过ffmpeg实现页面的视频裁剪功能

vue2(3)皆可使用，组件采用vue的选项式api写法，因此将组件复制到vue2版本的项目中一样可以使用。

## 运行
```
npm install
```
```
npm run dev
```

## 示例

![组件示例](./public//RM//page.jpg)


## 踩坑
- SharedArrayBuffer is not defined

    ![](./public//RM//error11.jpg)

    需要在配置文件``vite.config.js``设置请求头
    ```
    server:{
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        }
    }
    ```

    在`nginx`等代理服务器，也需要对静态资源的访问添加响应头
    ```
    location / {
        root /demo;
        index index.html;
        try_files $uri $uri/ /index.html;
        add_header Cross-Origin-Opener-Policy 'same-origin';
        add_header Cross-Origin-Embedder-Policy 'require-corp';
    }
    ```

- vue2 + webpack3.6

    如果使用的是webpack3.x版本，在导入ffmpeg模块时会报错，需要手动指定``ffmpeg.min.js``和``ffmpeg.core,js``（需要找到node_modules中的``@ffmpeg/ffmpeg-core``模块，将dist文件夹下的文件复制到项目中的静态文件夹中，因为corePath需要使用http协议的链接进行访问）

    ![](./public//RM//error02.jpg)
    ```
    import FFmpeg from '@ffmpeg/ffmpeg/dist/ffmpeg.min.js';
    const { createFFmpeg, fetchFile } = FFmpeg;

    const ffmpeg = createFFmpeg({
        log: false,
        corePath: 'static/js/ffmpeg-core.js'
    });
    ```

    
## 文档

[ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm/tree/master/)

[参考](https://blog.csdn.net/weixin_48888726/article/details/128718817)