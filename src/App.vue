<script setup lang="ts">
import { computed, onMounted, reactive, ref, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { getUrlParams, lrcToList } from "./utils/util";
import { Play, PauseOne, ReplayMusic } from "@icon-park/vue-next";
import * as types from "./types/index";
import * as apis from "./api";

import "element-plus/theme-chalk/el-message.css";

// audio dom
const audio = ref<HTMLAudioElement>();

// 获取id
const params = ref<{ id?: string;[key: string]: any }>(
  getUrlParams(location.search)
);
// 加载
const loading = ref<boolean>(false);
// 加载文本
const loadingTips = ref<string>("");
// 音乐参数
const musicData = ref<types.IMusicData>({
  author: "",
  lrc: "",
  pic: "",
  songid: "",
  title: "",
  url: "",
});
// 歌词列表
const lrc = ref<any[]>([]);
// 封面图片
const coverImage = computed(() => {
  return `url(${musicData.value.pic})`;
});
// 控制封面旋转
const coverAction = ref<"paused" | "running">("running");

// 控制播放器字段
const playerConfig = reactive({
  // 控制播放
  play: false,
  // 控制是否给封面挂载动画
  reAnimation: false
});

// 播放器事件
const playerEvents = reactive({
  // 控制播放|暂停
  c_play() {
    playerConfig.play = !playerConfig.play;
  },
  // 重播
  c_replay() {
    audio.value!.currentTime = 0;
    playerConfig.reAnimation = true
    setTimeout(() => playerConfig.reAnimation = false, 100);
  }
});

// 播放器原生事件
const audioEvents = reactive({
  // 当音乐缓存到可以播放时触发
  canplaythrough() {
    playerConfig.play = true
  },
  // 当音乐播放完毕触发
  ended() {
    playerConfig.reAnimation = true
    playerConfig.play = false
  },
})

// 监听控制字段
watchEffect(() => {
  // 监听播放
  if (playerConfig.play) {
    try {
      audio.value?.play()
      // 当音乐没有正确播放则不进行操作
      if (audio.value?.paused) {
        playerConfig.play = false
        return
      }
      coverAction.value = "running";
      if (playerConfig.reAnimation) {
        playerConfig.reAnimation = false
      }
    }
    catch { }
  } else {
    coverAction.value = "paused";
    audio.value?.pause()
  }
});

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
      const { data } = res.data;
      musicData.value = data;
      lrc.value = lrcToList(musicData.value!.lrc).ms;
    }
  } catch (e) {
    console.error(e);

  } finally {
    loading.value = false
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
  <div class="container" v-loading="loading" :element-loading-text="loadingTips">
    <div class="player">
      <div class="title">
        {{ musicData.title || "无歌名" }} --
        {{ musicData.author || "无歌手" }}
      </div>
      <div class="cover" :class="{ image: musicData.pic.length > 0, reAnimation: playerConfig.reAnimation }"></div>
      <div class="progress"></div>
      <div class="control">
        <play theme="filled" size="50" fill="#333" v-if="!playerConfig.play" @click="playerEvents.c_play" />
        <pause-one theme="filled" size="50" fill="#333" v-else @click="playerEvents.c_play" />
        <replay-music theme="filled" size="50" fill="#333" @click="playerEvents.c_replay" />
      </div>
      <div class="lrc">
        <div class="lrcBox">
          <div class="lrcItem" :class="{ select: true }" v-for="(l, index) in lrc" :key="index" :id="l.t">
            {{ l.c }}
          </div>
        </div>
      </div>
    </div>

    <audio ref="audio" :src="musicData.url" preload="auto" @canplaythrough="audioEvents.canplaythrough"
      @ended="audioEvents.ended"></audio>
  </div>
</template>

<style scoped lang="scss">
.container {
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  .player {
    margin: 1rem;
    max-height: calc(100% - 2rem);
    height: calc(100% - 2rem);
    border-radius: 0.5rem;
    background-image: linear-gradient(#befdff 0%, #90f7ec 85%, #32ccbc 100%);

    .title {
      text-align: center;
      font-size: 1.2rem;
      font-weight: bold;
      height: 3rem;
      line-height: 3rem;
    }

    .cover {
      width: 18rem;
      height: 18rem;
      background: black;
      margin: 0 auto;
      animation: cover 3s linear infinite;
      animation-play-state: v-bind("coverAction");
      border-radius: 50%;
      position: relative;
      margin-top: 1rem;

      &.reAnimation {
        animation: none;
      }

      &::before {
        content: "";
        position: absolute;
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background-color: rgba(187, 187, 187, 0.493);
        top: 7rem;
        left: 7rem;
      }

      &::after {
        content: "";
        position: absolute;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background-color: #fff;
        top: 8rem;
        left: 8rem;
      }

      &.image {
        background-image: v-bind("coverImage");
        background-size: cover;
      }
    }

    .control {
      display: flex;
      justify-content: space-evenly;
      margin-top: 1rem;
    }

    .lrc {
      height: 14rem;
      margin-top: 2rem;
      overflow: hidden;

      .lrcBox {
        transform: translateY(7.1rem);

        .lrcItem {
          text-align: center;
          color: #00cf4f;

          &.select {
            font-size: 1.2rem;
            color: #0353e7;
          }
        }
      }
    }
  }
}

@keyframes cover {
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
