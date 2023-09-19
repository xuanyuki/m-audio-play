import {Options} from 'intro.js/src/option'

type IThemeList={
  name?:string,
  color:string,
  select:string,
  useAutoColor:boolean
}[]

// 主题列表
export const themeList:IThemeList=[{
  name: 'theme-default',
  color: '#e5ff00',
  select: '#00ff4c',
  useAutoColor: true
}, {
  name: 'theme-light',
  color: '#000',
  select: '#fff',
  useAutoColor: false
}, {
  name: 'theme-dark',
  color: '#fff',
  select: '#000',
  useAutoColor: false
}]


// 指引配置
export const introOptions: Partial<Options>={
  nextLabel:'下一步',
  prevLabel:'上一步',
  skipLabel:'跳过',
  doneLabel:'完成',
  exitOnOverlayClick:false,
  disableInteraction:true,
  overlayOpacity:0.9,
  showStepNumbers: false,
  showBullets: false,
  hidePrev: true,
  hideNext: false,
  steps:[
    {
      element:'#control',
      intro:'这里是主控面板，可以控制歌曲的播放状态以及重播',
    },{
      element:'#toollist',
      intro:'这里是工具列表，可以进行一些“小”操作',
      position: 'top'
    },{
      element:'#theme',
      intro:'这里可以切换歌词色彩主题',
      position:'top'

    },{
      element:'#textcolor',
      intro:'这里可以开关歌词色彩自适应',
      position:'top'
    },{
      element:'#mode',
      intro:'这里用以切换播放模式',
      position:'top'
    }
  ]
}