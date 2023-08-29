<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { getUrlParams, lrcToList, timeToString } from "./utils/util";
import { Play, PauseOne, ReplayMusic } from "@icon-park/vue-next";
import * as types from "./types/index";
import * as apis from "./api";

import "element-plus/theme-chalk/el-message.css";

// audio dom
const audio = ref<HTMLAudioElement>();

const lrcList = ref<HTMLDivElement[]>();

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
  lrcTransformY: "translateY(-10px)",
  // 歌词字体控制
  lrcFontSize: "16px",
  lrcSelectFontSize: "20px",
  // 页面宽度
  clientWidth: 0,
  // 进度条百分比
  progressPercent: "0%",
});

// 播放器展示数据
const playerInfo = reactive({
  currectTime: "00:00",
  allTime: "00:00",
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
  // 点击进度条设置播放位置
  setProgress(e: PointerEvent) {
    let position = parseFloat(
      (e.clientX / (e.currentTarget as HTMLDivElement).offsetWidth).toFixed(4)
    );
    if (position < 0) position = 0;
    else if (position > 1) position = 1;
    const time = Math.floor(playerConfig.allTime * position);
    playerConfig.play = false;
    audio.value!.currentTime = time;
    playerConfig.play = true;
  },
});

// 播放器原生事件
const audioEvents = reactive({
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
    playerInfo.currectTime = timeToString(Math.ceil(playerConfig.currentTime));
    const percent =
      parseFloat((playerConfig.currentTime / playerConfig.allTime).toFixed(2)) *
      100;
    if (percent >= 100) playerConfig.progressPercent = 100 + "%";
    else if (percent <= 0 || playerConfig.allTime === 0)
      playerConfig.progressPercent = 0 + "%";
    else playerConfig.progressPercent = percent + "%";
  },
  // 音乐加载完成获取总时间
  durationchange(e: Event) {
    playerConfig.allTime = parseFloat(
      (e.target as HTMLAudioElement).duration.toFixed(2)
    );
    playerInfo.allTime = timeToString(Math.ceil(playerConfig.allTime));
  },
});

// 监听控制字段
watchEffect(() => {
  // 监听播放
  try {
    if (playerConfig.play) {
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
    } else if (!playerConfig.play) {
      coverAction.value = "paused";
      if (audio.value?.paused) return;
      audio.value?.pause();
    }
  } catch {}
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

    // 计算歌词文字大小
    const lrcSelectFontSize =
      (playerConfig.clientWidth / 100) * 3 > 16
        ? (playerConfig.clientWidth / 100) * 3.5
        : 20;
    playerConfig.lrcTransformY = `translateY(calc(${
      (lrcSelectFontSize / 2) * -1
    }px - ${
      (document.querySelector(".LRC.select") as HTMLDivElement).offsetTop
    }px))`;
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

// 设置歌词文字大小
const setLrcFontSize = () => {
  const clientWidth = document.body.clientWidth;
  playerConfig.clientWidth = clientWidth;

  // 设置当前歌词文字大小
  const lrcSelectFontSize =
    (clientWidth / 100) * 3 > 16 ? (clientWidth / 100) * 3.5 : 18;
  playerConfig.lrcSelectFontSize = lrcSelectFontSize + "px";
  // 设置歌词默认文字大小
  const lrcFontSize =
    (clientWidth / 100) * 3 > 16 ? (clientWidth / 100) * 3 : 16;
  playerConfig.lrcFontSize = lrcFontSize + "px";
};

onMounted(() => {
  const { id } = params.value;
  if (!id) {
    return ElMessage.error({
      message: "无效参数",
    });
  }
  getMusic();
  setLrcFontSize();
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
        <div class="progress">
          <div class="progressBox" @click="playerEvents.setProgress">
            <div class="progressActive"></div>
          </div>
          <div class="progressTime">
            {{ playerInfo.currectTime }}/{{ playerInfo.allTime }}
          </div>
        </div>
        <!-- 歌词 -->
        <div class="lrc">
          <div class="lrcLine"></div>
          <div class="lrcBox">
            <div
              class="lrcItem LRC"
              :class="{ select: playerConfig.lrcIndex === index }"
              v-for="(l, index) in lrc"
              :key="index"
              :data-time="l.t"
              :data-index="index"
              ref="lrcList"
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
      .progress {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 1rem auto 0 auto;
        width: 93%;

        .progressBox {
          flex-grow: 1;
          border: 1px solid#c4c4c4;
          background-color: #aaaaaa;
          border-radius: 5px;
          overflow: hidden;
          height: 5px;
          z-index: 1;
          margin-right: 1rem;

          .progressActive {
            background: linear-gradient(
              to right,
              rgb(208, 255, 147),
              rgb(251, 255, 0),
              rgb(252, 206, 1),
              rgb(252, 164, 1)
            );
            border-radius: 5px;
            z-index: 1;
            height: 5px;
            width: v-bind("playerConfig.progressPercent");
          }
        }
        .progressTime {
          color: rgb(255, 255, 255);
          mix-blend-mode: difference;
          z-index: 1;
        }
      }

      .lrc {
        height: 30vw;
        font-size: v-bind("playerConfig.lrcFontSize");
        margin: 2rem 1rem 0 1rem;
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
          transition: transform 0.05s linear;
          width: 100%;
          position: absolute;
          top: 50%;
          margin: 0 auto;

          .lrcItem {
            text-align: center;
            color: #e5ff00;
            transition: font-size 0.1s linear;

            &.select {
              font-size: v-bind("playerConfig.lrcSelectFontSize");
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