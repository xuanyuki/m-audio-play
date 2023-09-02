import axios from "axios";
import { ElMessage } from "element-plus";

export const baseUrl = "https://node.xianyuy.cc/api";

// 30秒中断请求
axios.defaults.timeout = 30000;

// 拦截发送请求
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// 拦截返回结果
axios.interceptors.response.use(
  // 2xx 范围内的状态码都会触发该函数。
  (res) => {
    return res;
  },
  // 超出 2xx 范围的状态码都会触发该函数。
  (err) => {
    const { message, response, config } = err;
    let msg = message ? message : "请求服务器失败！";
    if (response) {
      const { data } = err.response;
      if (data) {
        if (data.msg) {
          msg = data.msg;
        }
      }
    }
    config.showMsg && ElMessage.error(msg);
    err.message = msg;
    return Promise.reject(err);
  }
);

/**
 * request封装
 */
export const fetchData: (
  method: string,
  url: string,
  data: { [key: string]: any },
  config?: { showMsg?: boolean; [key: string]: any }
) => Promise<any> = (method, url, data = {}, config = { showMsg: true }) => {
  return new Promise((resolve, reject) => {
    let request;
    if (method === "get" || method === "delete") {
      request = axios[method](baseUrl + url, { params: data, ...config });
    } else {
      request = (axios as any)[method](baseUrl + url, data, { ...config });
    }
    request
      .then((res: any) => {
        resolve(res);
      })
      .catch((e: any) => {
        reject(e);
      });
  });
};

export const get = function (
  url: string,
  params: { [key: string]: any },
  config?: { [key: string]: any }
) {
  return fetchData("get", url, params, config);
};

export const post = function (url: string, data: { [key: string]: any }) {
  return fetchData("post", url, data);
};
