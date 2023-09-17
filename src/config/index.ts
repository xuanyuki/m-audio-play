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