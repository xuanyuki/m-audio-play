// @ts-nocheck

// 音乐数据格式
export declare interface IMusicData {
  author: string;
  lrc: string;
  pic: string;
  songid: string | number;
  title: string;
  url: string;
  [key: string]: any;
}

// 歌词数据格式
export declare interface ILRC {
  ti: string;
  ar: string;
  al: string;
  by: string;
  offset: number;
  ms: any[];
  [key: string]: any;
}

// 播放模式
export declare type playMode = 'default' | 'loop' | 'random'

// 系统设置
export declare type ISystemSet = {
  title: string,
  event?: ISystemEvent,
  target: string,
  action?: string | number | boolean,
  inactive?: string | number | boolean,
  activeText?: string,
  inactiveText?: string
}[]

// 系统设置事件类型
export declare type ISystemEvent = string | ((context: {
  playerConfig: {
    [key: string]: any
  },
  lrc: any[],
  musicData: IMusicData
}) => any) | undefined
