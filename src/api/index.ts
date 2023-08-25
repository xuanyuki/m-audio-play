import { get } from "./axios";

// 获取音乐信息
export const getMusic = (id: string) => get("/getMusic", { id });
