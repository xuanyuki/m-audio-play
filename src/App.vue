<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref,
  watch,
  watchEffect,
} from "vue";
import { ElMessage } from "element-plus";
import { themeList, introOptions } from "./config";
import { lrcToList, timeToString, throttle, systemConfig } from "./utils/util";
import { ISystemEvent } from './types'
import {
  Play,
  PauseOne,
  ReplayMusic,
  Theme,
  Translation,
  Text,
  PlayOnce,
  PlayCycle,
  ShuffleOne,
  Help,
  SwitchThemes,
  SettingConfig
} from "@icon-park/vue-next";

import introJs from "intro.js";
import * as types from "./types/index";
import * as apis from "./api";

import "element-plus/theme-chalk/el-message.css";
import "element-plus/theme-chalk/el-badge.css";
import "intro.js/introjs.css";
import 'intro.js/themes/introjs-modern.css'

// dom
const audio = ref<HTMLAudioElement>();
const titleBox = ref<HTMLDivElement>();
const title = ref<HTMLDivElement>();
const lrcList = ref<HTMLDivElement[]>([]);

// 加载
const loading = ref<boolean>(true);
// 加载文本
const loadingTips = ref<string>("数据加载中..");
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
  // 主题
  theme: "theme-default",
  // 自适应歌词文字颜色
  autoColor: "difference",
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
  lrcTransformY: "translateY(-8px)",
  // 页面宽度
  clientWidth: 0,
  // 进度条百分比
  progressPercent: "0%",
  // 播放模式
  mode: "random" as types.playMode,
  // 当前使用的主题
  themeIndex: 0,
  // 指示进度条是否被拖动
  isMoveProgress: false,
  // 指示封面样式
  cover: 'round',
  // 打开设置
  showSet: false,
  // 网页标题是否使用歌词
  titleIsLrc: true,
  // 保存设置
  saveConfig: false
});

// 播放器展示数据
const playerInfo = reactive({
  currectTime: "00:00",
  allTime: "00:00",
});

// 标题宽度参数
const titleParam = reactive({
  titleBoxWidth: "",
  titleWidth: "",
});
// 判断标题是否溢出
const isOverflow = ref(false);
// 计算css样式（标题移动距离）
const titleMove = computed(
  () =>
    `translateX(calc(-${titleParam.titleWidth} + ${titleParam.titleBoxWidth} - 32px))`
);
// 计算标题滚动动画时间
const titleAnimationTime = computed(() => {
  const titleBoxWidth = Number(titleParam.titleBoxWidth.slice(0, -2));
  const titleWidth = Number(titleParam.titleWidth.slice(0, -2));
  const moveWidth = titleWidth - titleBoxWidth;
  return `${Math.floor(Math.log(0.7 * moveWidth + 1))}s`;
});

// 设置歌词到指定位置
function lrcMove() {
  const index = lrc.value.findIndex(
    (item) => Number(item.t) > playerConfig.currentTime
  );
  if (index === -1) {
    if (playerConfig.currentTime > Number(lrc.value[0].t)) {
      playerConfig.lrcIndex = lrc.value.length - 1;
    } else {
      playerConfig.lrcIndex = 0;
    }
  } else {
    playerConfig.lrcIndex = index;
  }
}

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
    playerConfig.lrcIndex = 0;
    playerConfig.reAnimation = true;
    setTimeout(() => {
      playerConfig.reAnimation = false;
      playerConfig.play = true;
    }, 200);
  },
  // 点击进度条设置播放位置
  setProgress(e: PointerEvent) {
    let position = parseFloat(
      (e.offsetX / (e.currentTarget as HTMLDivElement).offsetWidth).toFixed(4)
    );
    if (position < 0) position = 0;
    else if (position > 1) position = 1;
    const time = Math.floor(playerConfig.allTime * position);
    audio.value!.currentTime = time;
    lrcMove();
  },

  // 切换歌词颜色自适应
  checkoutColorMode() {
    if (themeList[playerConfig.themeIndex].useAutoColor) {
      playerConfig.autoColor =
        playerConfig.autoColor === "difference" ? "default" : "difference";
      ElMessage({
        type: "info",
        message:
          playerConfig.autoColor === "difference"
            ? "启用歌词颜色自适应"
            : "取消歌词颜色自适应",
        grouping: true,
      });
    } else {
      ElMessage.warning("当前主题不支持自适应颜色切换");
    }
  },
  // 切换主题
  checkoutTheme() {
    if (playerConfig.themeIndex === themeList.length - 1) {
      playerConfig.themeIndex = 0;
    } else {
      playerConfig.themeIndex++;
    }
    if (!themeList[playerConfig.themeIndex].useAutoColor) {
      playerConfig.autoColor = "default";
    }
  },
  // 切换播放模式
  checkoutMode() {
    switch (playerConfig.mode) {
      case "default":
        playerConfig.mode = "loop";
        ElMessage({
          message: "播放模式切换为 循环播放",
          type: "info",
          grouping: true,
        });
        break;
      case "loop":
        playerConfig.mode = "random";
        ElMessage({
          message: "播放模式切换为 随机播放",
          type: "info",
          grouping: true,
        });
        break;
      case "random":
        playerConfig.mode = "default";
        ElMessage({
          message: "播放模式切换为 默认",
          type: "info",
          grouping: true,
        });
        break;
    }
  },
  // 帮助
  help() {
    introJs().setOptions(introOptions).start()
  },
  // 开始拖动进度条
  handleProgressStart(e: TouchEvent) {
    playerConfig.isMoveProgress = true
    const moveX = Math.floor(e.targetTouches[0].clientX) - 53
    let position = parseFloat(
      (moveX / (e.currentTarget as HTMLDivElement).offsetWidth).toFixed(4)
    )
    if (position < 0) position = 0;
    else if (position > 1) position = 1;
    const time = Math.floor(playerConfig.allTime * position);
    audio.value!.currentTime = time;
    lrcMove();
  },
  // 结束拖动
  handleProgressEnd() {
    playerConfig.isMoveProgress = false
  },
  // 进度条拖动
  progressMove: throttle((e: TouchEvent) => {
    const moveX = Math.floor(e.targetTouches[0].clientX) - 53
    let position = parseFloat(
      (moveX / (e.currentTarget as HTMLDivElement).offsetWidth).toFixed(4)
    )
    if (position < 0) position = 0;
    else if (position > 1) position = 1;
    const time = Math.floor(playerConfig.allTime * position);
    audio.value!.currentTime = time;
    lrcMove();
  }),
  // 切换封面
  checkoutCover() {
    switch (playerConfig.cover) {
      case 'round':
        playerConfig.cover = 'square'
        break;
      case 'square':
        playerConfig.cover = 'round'
        break;
    }
  },
  switchChange(event: ISystemEvent) {
    if (event) {
      if (typeof event === 'string') {
        (playerEvents as any)[event]()
      } else {
        event({ playerConfig, lrc: lrc.value, musicData: musicData.value })
      }
    }
  }
});

let watchSaveChange: any = null

// 播放器原生事件
const audioEvents = reactive({
  // 当音乐播放完毕触发
  ended() {
    playerConfig.reAnimation = true;
    playerConfig.play = false;
    switch (playerConfig.mode) {
      // 循环模式
      case "loop":
        playerEvents.c_replay();
        playerConfig.lrcIndex = 0;
        break;
      // 随机模式
      case "random":
        getMusic();
        playerConfig.lrcIndex = 0;
        playerEvents.c_replay();
        break;
      default:
        ElMessage.warning('无效模式')
        break;
    }
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
  error() {
    if (!musicData.value.src) return;
    loading.value = false;
    ElMessage({
      type: "error",
      message: "音乐播放失败",
      grouping: true,
    });
  },
  // 音乐可以播放时触发
  canplay() {
    loading.value = false
  },
  // 音乐缓冲时触发
  waiting() {
    loading.value = true
  }
});

// 监听控制字段
watchEffect(() => {
  // 监听播放
  try {
    if (playerConfig.play) {
      audio.value?.play().then(() => {
        if (audio.value?.paused) {
          playerConfig.play = false;
          return;
        }
        coverAction.value = "running";
        if (playerConfig.reAnimation) {
          playerConfig.reAnimation = false;
        }
      })
    } else if (!playerConfig.play) {
      coverAction.value = "paused";
      if (audio.value?.paused) return;
      audio.value?.pause();
    }
  } catch { }
});

// 监听当前播放时间
watch(
  () => playerConfig.currentTime,
  () => {
    // 控制当前展示的歌词下标
    if (lrc.value.length < 2) {
      // 歌词列表过短则判断为无歌词
      playerConfig.lrcIndex = 0;
      return;
    }
    let index = playerConfig.lrcIndex;
    for (
      let i = 0, j = 1;
      i < lrc.value.length - 1, j < lrc.value.length;
      i++, j++
    ) {
      if (i === 0 && playerConfig.currentTime < lrc.value[i].t) index = 0
      else if (
        playerConfig.currentTime >= lrc.value[i].t &&
        playerConfig.currentTime < lrc.value[j].t
      ) {
        index = i;
        break;
      }
      index = j;
    }
    if (index !== playerConfig.lrcIndex) {
      playerConfig.lrcIndex = index;
    }
  }
);

// 监听歌词下标
watch(
  () => playerConfig.lrcIndex,
  (nv) => {
    let documentTitle = `${musicData.value.title} -- ${musicData.value.author}`
    if (lrc.value.length !== 0 && playerConfig.titleIsLrc) {
      documentTitle = lrc.value[nv].c
    }
    document.title = documentTitle;
    nextTick(() => {
      const lrcSelectDom = lrcList.value.find((item) =>
        item.className.includes("select")
      );
      const moveHeight = `translateY(calc(${((lrcSelectDom ? lrcSelectDom?.offsetHeight : 16) / 2) * -1
        }px - ${lrcSelectDom?.offsetTop}px))`;
      playerConfig.lrcTransformY = moveHeight;
    });
  }
);

// 获取音乐参数
const getMusic = async () => {
  try {
    const res = await apis.getMusic({ random: 1 });
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
      document.title = `${musicData.value.title} -- ${musicData.value.author}`;
      nextTick(() => {
        titleParam.titleBoxWidth = titleBox.value!.offsetWidth + "px";
        titleParam.titleWidth = title.value!.offsetWidth + "px";
        isOverflow.value =
          titleBox.value!.offsetWidth < title.value!.offsetWidth;
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 设置标题logo
watch(
  () => musicData.value.pic,
  () => {
    (document.querySelector("link[rel*='icon']") as HTMLLinkElement).href =
      musicData.value.pic;
  }
);

const progressBox = ref<HTMLDivElement>()

watch(() => playerConfig.saveConfig, (nv) => {
  if (nv) {
    watchSaveChange = watch(() => playerConfig, (nv) => {
      const { saveConfig, autoColor, cover, titleIsLrc } = nv
      localStorage.setItem("config", JSON.stringify({ saveConfig, autoColor, cover, titleIsLrc }))
    }, {
      deep: true,
      immediate: true
    })
  } else {
    watchSaveChange&&watchSaveChange();
    localStorage.removeItem('config')
  }
},{
  immediate:true
})

onMounted(() => {
  getMusic();
  nextTick(() => {
    progressBox.value?.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault()
    })
  })
  audio.value?.pause()
  Object.assign(playerConfig, JSON.parse(localStorage.getItem('config') || '{}'))
});
</script>

<template>
  <div class="container" v-loading="loading" :element-loading-text="loadingTips" :class="playerConfig.theme">
    <div class="playerBackground">
      <div class="player">
        <!-- 标题 -->
        <div class="title_box" :class="{ isOverflow: isOverflow }" ref="titleBox">
          <div class="title" ref="title">
            {{ `${musicData.title} -- ${musicData.author || "暂无数据"}` }}
          </div>
        </div>
        <!-- 封面 -->
        <div class="cover" :class="{
          image: musicData.pic.length > 0,
          reAnimation: playerConfig.reAnimation,
        }" v-if="playerConfig.cover === 'round'"></div>
        <div class="cover square" :class="{
          image: musicData.pic.length > 0,
        }" v-else></div>
        <!-- 主控 -->
        <div class="control" id="control">

          <!-- 播放 -->
          <play theme="outline" size="50" fill="#fff" v-if="!playerConfig.play" @click="playerEvents.c_play" />
          <!-- 暂停 -->
          <pause-one theme="outline" size="50" fill="#fff" v-else @click="playerEvents.c_play" />
          <!-- 重播 -->
          <replay-music theme="outline" size="50" fill="#fff" @click="playerEvents.c_replay" />
        </div>

        <!-- 次要控制 -->
        <div class="control_second" id="toollist">
          <!-- 封面切换 -->
          <div class="checkoutCover" id="checkoutCover" @click="playerEvents.checkoutCover">
            <switch-themes theme="outline" size="20" fill="#fff" />
          </div>
          <!-- 主题 -->
          <div class="theme" id="theme" @click="playerEvents.checkoutTheme">
            <theme theme="outline" size="20" fill="#fff" />
          </div>
          <!-- 文字自适应 -->
          <div class="textcolor" id="textcolor" @click="playerEvents.checkoutColorMode">
            <translation theme="outline" size="20" fill="#fff" v-show="playerConfig.autoColor === 'difference'" />
            <Text theme="outline" size="20" fill="#fff" v-show="playerConfig.autoColor === 'default'" />
          </div>
          <!-- 播放模式 -->
          <div class="play_mode" id="mode" @click="playerEvents.checkoutMode">
            <play-once theme="outline" size="20" fill="#fff" v-show="playerConfig.mode === 'default'" />
            <play-cycle theme="outline" size="20" fill="#fff" v-show="playerConfig.mode === 'loop'" />
            <shuffle-one theme="outline" size="20" fill="#fff" v-show="playerConfig.mode === 'random'" />
          </div>
          <!-- 设置 -->
          <div class="set" id="set" @click="playerConfig.showSet = true">
            <setting-config theme="outline" size="20" fill="#fff" />
          </div>
          <!-- 帮助 -->
          <div class="help" @click="playerEvents.help">
            <help theme="outline" size="20" fill="#fff" />
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress">
          <div class="progressTime">
            {{ playerInfo.currectTime }}
          </div>
          <div class="progressBox" @click="playerEvents.setProgress" @touchstart="playerEvents.handleProgressStart"
            @touchend="playerEvents.handleProgressEnd" @touchmove="playerEvents.progressMove" ref="progressBox">
            <div class="progressActive"></div>
          </div>
          <div class="progressTime">
            {{ playerInfo.allTime }}
          </div>
        </div>


        <!-- 歌词 -->
        <div class="lrc">
          <div class="lrcLine"></div>
          <div class="lrcBox">
            <div class="lrcItem LRC" :class="{
              select: playerConfig.lrcIndex === index,
            }" v-for="(l, index) in lrc" :key="index" :data-time="l.t" :data-index="index" ref="lrcList">
              {{ l.c }}
            </div>
            <div class="lrcItem select" v-show="lrc.length == 0">暂无歌词</div>
          </div>
        </div>

        <!-- 设置 -->
        <ElDialog v-model="playerConfig.showSet" fullscreen title="设置" center>
          <div class="set_form">
            <div class="set_item" v-for="item, index in systemConfig" :key="index">
              <div class="set_text">{{ item.title }}：</div>
              <el-switch v-model="(playerConfig as any)[item.target]" :active-value="item.action || true"
                :inactive-value="item.inactive || false" inline-prompt :active-text="item.activeText"
                :inactive-text="item.inactiveText" @change="playerEvents.switchChange(item.event)" />
            </div>
          </div>
        </ElDialog>
      </div>
      <audio ref="audio" :src="musicData.url" preload="auto" @ended="audioEvents.ended"
        @timeupdate="audioEvents.timeupdate" @durationchange="audioEvents.durationchange" @error="audioEvents.error"
        @waiting="audioEvents.waiting" @canplay="audioEvents.canplay"></audio>

    </div>
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
      display: flex;
      flex-direction: column;

      .title_box {
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
        height: 3rem;
        line-height: 3rem;
        padding-top: 1rem;
        color: #fff;
        mix-blend-mode: difference;

        &.isOverflow {
          margin: 0 16px;
          animation: titleScroll linear infinite reverse;
          animation-duration: v-bind("titleAnimationTime");
        }

        .title {
          white-space: nowrap;
          display: inline-block;
        }
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

        &.square {
          border-radius: 0;
          animation: none;

          &::before {
            display: none;
          }

          &::after {
            display: none;
          }
        }
      }

      .control {
        display: flex;
        justify-content: space-evenly;
        margin-top: 16px;
        align-items: center;
        mix-blend-mode: difference;
      }

      .control_second {
        display: flex;
        justify-content: space-evenly;
        margin-top: 16px;
        align-items: center;
        mix-blend-mode: difference;
      }

      .progress {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;

        .progressBox {
          flex-grow: 1;
          border: 1px solid#c4c4c4;
          background-color: #aaaaaa;
          border-radius: 5px;
          overflow: hidden;
          height: 5px;
          z-index: 1;

          .progressActive {
            background: linear-gradient(to right,
                rgb(208, 255, 147),
                rgb(251, 255, 0),
                rgb(252, 206, 1),
                rgb(252, 164, 1));
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
          text-align: center;
          margin: 0 10px;
          font-size: 12px;
          width: 32px;
        }
      }

      .lrc {
        margin: 14px 12px 0 12px;
        overflow: hidden;
        position: relative;
        flex: 1;
        font-size: 16px;

        .lrcLine {
          position: absolute;
          box-sizing: border-box;
          border-top: 1px solid black;
          top: 50%;
          left: 0;
          width: 100%;
          height: 1px;
          display: none;
        }

        .lrcBox {
          transform: v-bind("playerConfig.lrcTransformY");
          width: 100%;
          position: absolute;
          top: 50%;
          transition: all 0.1s linear;
          margin: 0 auto;
          mix-blend-mode: v-bind("playerConfig.autoColor");

          .lrcItem {
            text-align: center;
            transition: all 0.1s linear;
            font-weight: 100;
            color: v-bind("themeList[playerConfig.themeIndex].color");

            &.select {
              font-weight: 900;
              color: v-bind("themeList[playerConfig.themeIndex].select");
            }
          }
        }
      }
    }
  }
}

.set_form {
  border-top: 2px solid #ccc;
  border-bottom: 2px solid #ccc;

  .set_item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ddd;
    padding: 4px 0;

    &:last-child {
      border: none;
    }

    .set_text {
      font-size: 14px;
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

@keyframes titleScroll {
  0% {
    transform: translateX(0);
  }

  50% {
    transform: v-bind("titleMove");
  }

  100% {
    transform: translateX(0);
  }
}
</style>
