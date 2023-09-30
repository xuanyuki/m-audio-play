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
export declare type ISystemSet={
  title:string,
  event?:string|function,
  target:string,
  action?:string|number|boolean,
  inactive?:string|number|boolean,
  activeText?:string,
  inactiveText?:string
}[]