import * as types from "../types/index";
/**
 * 解析url参数
 */
export const getUrlParams: (url: string) => object = (url) => {
  const _url = url.slice(1, url.length);
  // 创建空对象存储参数
  let obj: { [key: string]: string | number | undefined } = {};
  // 再通过 & 将每一个参数单独分割出来
  let paramsArr = _url.split("&");
  for (let i = 0, len = paramsArr.length; i < len; i++) {
    // 再通过 = 将每一个参数分割为 key:value 的形式
    let arr: string[] = paramsArr[i].split("=");
    obj[arr[0]] = arr[1];
  }
  return obj;
};

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