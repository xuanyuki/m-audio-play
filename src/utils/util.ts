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
