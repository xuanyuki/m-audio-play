import { ref } from "vue";
import * as types from "../types";

/**
 * 将秒转为时间 格式00:00
 */
export const timeToString: (time: number) => string = (time: number = 0) => {
  if (time < 0) {
    return "00:00";
  }
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${formattedMinutes}:${formattedSeconds}`;
};

/**
 * 解析歌词
 */
export function lrcToList(text: string) {
  let oLRC: types.ILRC = {
    ti: "",
    ar: "",
    al: "",
    by: "",
    offset: 0,
    ms: [],
  };
  const list = text?.split("\n").filter((val) => val.trim() !== "");
  list?.forEach((i) => {
    const t = i.substring(i.indexOf("[") + 1, i.indexOf("]"));
    const s = t.split(":");
    if (isNaN(parseInt(s[0]))) {
      for (const j in oLRC) {
        if (j != "ms" && j == s[0].toLocaleLowerCase()) {
          oLRC[j] = s[1];
        }
      }
    } else {
      const arr = i.match(/\[(\d+:.+?)\]/g);
      let start = 0;
      for (let k in arr) {
        start += arr[k as any].length;
      }
      const content = i.substring(start);
      for (let k in arr) {
        let tt = arr[k as any].substring(1, arr[k as any].length - 1);
        let ss = tt.split(":");
        if (content.trim().length !== 0) {
          const ms = {
            t: (parseFloat(ss[0]) * 60 + parseFloat(s[1])).toFixed(3),
            c: content,
          };
          oLRC.ms.push(ms);
        }
      }
    }
  });
  oLRC.ms.sort((a, b) => a.t - b.t);
  return oLRC;
}

// 节流
export function throttle(fn: Function, interval: number = 50) {
  //该变量用于记录上一次函数的执行事件
  let lastTime = 0;

  const _throttle: (args: any) => void = function (...args) {
    // 获取当前时间
    const nowTime = new Date().getTime();

    // cd剩余时间
    const remainTime = nowTime - lastTime;
    // 如果剩余时间大于间隔时间，也就是说可以再次执行函数
    if (remainTime - interval >= 0) {
      // @ts-ignore
      fn.apply(this, args);
      // 将上一次函数执行的时间设置为nowTime，这样下次才能重新进入cd
      lastTime = nowTime;
    }
  };
  // 返回_throttle函数
  return _throttle;
}

// 系统设置列表
export const systemConfig = ref<types.ISystemSet>([
  {
    title: "保存设置",
    target: "saveConfig",
  },
  {
    title: "自动歌词颜色",
    target: "autoColor",
    action: "difference",
    inactive: "default",
  },
  {
    title: "封面样式",
    target: "cover",
    action: "square",
    inactive: "round",
    activeText: "方形",
    inactiveText: "圆形",
  },
  {
    title: "网页标题",
    target: "titleIsLrc",
    activeText: "歌词",
    inactiveText: "歌名",
    event(context) {
      const { playerConfig, lrc, musicData } = context;
      if (playerConfig.titleIsLrc && lrc.length > 0) {
        document.title = lrc[playerConfig.lrcIndex].c;
      } else {
        document.title = `${musicData.title} -- ${musicData.author}`;
      }
    },
  },
]);
