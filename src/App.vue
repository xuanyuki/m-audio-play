<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { getUrlParams, lrcToList } from "./utils/util";
import { Play, PauseOne, ReplayMusic } from "@icon-park/vue-next";
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
  reAnimation: false,
  // 当前播放时间
  currentTime: 0,
  // 总时间
  allTime: 0,
  // 展示的歌词下标
  lrcIndex: 0,
  // 控制歌词滚动
  lrcTransformY: "translateY(calc(12.7vw))",
});

// 播放器事件
const playerEvents = reactive({
  // 控制播放|暂停
  c_play() {
    playerConfig.play = !playerConfig.play;
  },
  // 重播
  c_replay() {
    if (!audio.value?.paused) {
      playerConfig.play = false;
    }
    audio.value!.currentTime = 0;
    playerConfig.reAnimation = true;
    setTimeout(() => (playerConfig.reAnimation = false), 100);
  },
});

// 播放器原生事件
const audioEvents = reactive({
  // 当音乐缓存到可以播放时触发
  canplaythrough() {
    playerConfig.play = true;
  },
  // 当音乐播放完毕触发
  ended() {
    playerConfig.reAnimation = true;
    playerConfig.play = false;
  },
  // 音乐播放时获取播放时间
  timeupdate(e: Event) {
    playerConfig.currentTime = parseFloat(
      (e.target as HTMLAudioElement).currentTime.toFixed(2)
    );
  },
  // 音乐加载完成获取总时间
  durationchange(e: Event) {
    playerConfig.allTime = parseFloat(
      (e.target as HTMLAudioElement).duration.toFixed(2)
    );
  },
});

// 监听控制字段
watchEffect(() => {
  // 监听播放
  if (playerConfig.play) {
    try {
      audio.value?.play();
      // 当音乐没有正确播放则不进行操作
      if (audio.value?.paused) {
        playerConfig.play = false;
        return;
      }
      coverAction.value = "running";
      if (playerConfig.reAnimation) {
        playerConfig.reAnimation = false;
      }
    } catch {}
  } else {
    coverAction.value = "paused";
    audio.value?.pause();
  }
});

// 监听当前播放时间
watch(
  () => playerConfig.currentTime,
  (nv) => {
    // 控制当前展示的歌词下标
    if (lrc.value.length < 2) return;
    let index = 0;
    for (let i = 0; i < lrc.value.length - 1; i++) {
      if (Number(lrc.value[i].t) > nv) {
        index = 0;
      } else if (Number(lrc.value[i + 1].t) < nv) {
        index = lrc.value.length - 1;
      } else if (
        Number(lrc.value[i].t) < nv &&
        Number(lrc.value[i + 1].t) >= nv
      ) {
        index = i;
        break;
      }
    }
    playerConfig.lrcIndex = index;
    playerConfig.lrcTransformY = `translateY(calc(12.7vw - ${index * 4.3}vw))`;
    const lrcItemDom: HTMLDivElement = document.querySelector(".LRC.select")!;
  }
);

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
  <div
    class="container"
    v-loading="loading"
    :element-loading-text="loadingTips"
  >
    <div class="playerBackground">
      <div class="player">
        <!-- 标题 -->
        <div class="title">
          {{ musicData.title || "无歌名" }} --
          {{ musicData.author || "无歌手" }}
        </div>
        <!-- 封面 -->
        <div
          class="cover"
          :class="{
            image: musicData.pic.length > 0,
            reAnimation: playerConfig.reAnimation,
          }"
        ></div>
        <!-- 控制按钮 -->
        <div class="control">
          <play
            theme="outline"
            size="50"
            fill="#fff"
            v-if="!playerConfig.play"
            @click="playerEvents.c_play"
          />
          <pause-one
            theme="outline"
            size="50"
            fill="#fff"
            v-else
            @click="playerEvents.c_play"
          />
          <replay-music
            theme="outline"
            size="50"
            fill="#fff"
            @click="playerEvents.c_replay"
          />
        </div>
        <!-- 进度条 -->
        <div class="progress"></div>
        <!-- 歌词 -->
        <div class="lrc">
          <div class="lrcLine"></div>
          <div class="lrcBox">
            <div
              class="lrcItem LRC"
              :class="{ select: playerConfig.lrcIndex === index }"
              :ref="playerConfig.lrcIndex === index ? 'lrcItem' : undefined"
              v-for="(l, index) in lrc"
              :key="index"
              :id="l.t"
            >
              {{ l.c }}
            </div>
            <div class="lrcItem select" v-show="lrc.length == 0">暂无歌词</div>
          </div>
        </div>
      </div>
    </div>

    <audio
      ref="audio"
      :src="musicData.url"
      preload="auto"
      @canplaythrough="audioEvents.canplaythrough"
      @ended="audioEvents.ended"
      @timeupdate="audioEvents.timeupdate"
      @durationchange="audioEvents.durationchange"
    ></audio>
  </div>
</template>

<style scoped lang="scss">
.container {
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  box-sizing: border-box;
  overflow: hidden;

  .playerBackground {
    max-height: calc(100%);
    height: calc(100%);
    background-image: v-bind("coverImage");
    overflow: hidden;
    position: relative;
    background-repeat: no-repeat;
    background-size: cover;

    &::before {
      position: absolute;
      width: 100%;
      height: 100%;
      inset: 0;
      content: "";
      backdrop-filter: blur(20px);
    }

    .player {
      max-height: calc(100% - 2rem);
      height: calc(100% - 2rem);
      border-radius: 0.5rem;

      .title {
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
        height: 3rem;
        line-height: 3rem;
        color: #fff;
        mix-blend-mode: difference;
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
        border: 1px solid rgb(105, 105, 105);
        box-sizing: border-box;

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
        position: relative;
        mix-blend-mode: difference;
      }

      .lrc {
        height: 30vw;
        font-size: 3vw;
        margin-top: 2rem;
        overflow: hidden;
        mix-blend-mode: difference;
        position: relative;

        .lrcLine {
          position: absolute;
          box-sizing: border-box;
          border-top: 1px solid black;
          top: 50%;
          left: 0;
          width: 100%;
          height: 1px;
        }

        .lrcBox {
          transform: v-bind("playerConfig.lrcTransformY");
          transition: transform 0.15s linear;

          .lrcItem {
            text-align: center;
            color: #e5ff00;
            transition: font-size 0.1s linear;

            &.select {
              font-size: 3.5vw;
              color: #00ff4c;
            }
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
