import { get } from "./axios";

// 获取音乐信息
export const getMusic = (data: {
  id?: number | string,
  name?: string,
  random?: any
}) => get("/getMusic", data);
