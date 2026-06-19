export default defineAppConfig({
  pages: [
    'pages/select/index',
    'pages/tune/index',
    'pages/play/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#FF6B35',
    navigationBarTitleText: '家人听书',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF8F0'
  },
  tabBar: {
    color: '#888888',
    selectedColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/select/index',
        text: '选文'
      },
      {
        pagePath: 'pages/tune/index',
        text: '调声'
      },
      {
        pagePath: 'pages/play/index',
        text: '播放'
      }
    ]
  }
})
