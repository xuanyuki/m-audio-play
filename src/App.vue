<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getUrlParams, lrcToList } from "./utils/util";
import * as types from "./types/index";
import * as apis from "./api";

import "element-plus/theme-chalk/el-message.css";

// audio dom
const audio = ref<HTMLAudioElement>();

// 获取id
const params = ref<{ id?: string; [key: string]: any }>(
  getUrlParams(location.search)
);
// 加载
const loading = ref<boolean>(false);
// 加载文本
const loadingTips = ref<string>("");
// 音乐参数
const musicData = ref<types.IMusicData>();
// 歌词列表
const lrc = ref<any[]>([]);

// 获取音乐参数
const getMusic = async () => {
  try {
    loading.value = true;
    loadingTips.value = "数据加载中...";
    const res = await apis.getMusic(params.value.id!);
    const { state } = res.data;
    if (state === "warning") {
      const { message } = res.data;
      return ElMessage.warning({
        message,
      });
    } else if (state === "error") {
      const { message } = res.data;
      return ElMessage.error({
        message,
      });
    } else {
      const { data } = res;
      musicData.value = data;
      lrc.value = lrcToList(musicData.value!.lrc).ms;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const { id } = params.value;
  if (!id) {
    return ElMessage.error({
      message: "无效参数",
    });
  }
  getMusic();
});
</script>

<template>
  <ret
    class="container"
    v-loading="loading"
    :element-loading-text="loadingTips"
  >
    <div class="title"></div>
    <div class="cover"></div>
    <div class="progress"></div>
    <div class="control"></div>
    <div class="lrc"></div>
    <audio ref="audio" :src="musicData?.url" preload="auto" autoplay></audio>
  </ret>
</template>

<style scoped lang="scss">
.container {
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  box-sizing: border-box;
  padding: 3%;
  position: relative;
}
</style>
