// pages/project_work_page/project_work_page.js
const app = getApp();

Page({
  data: {
    level: 2, // 默认权限级别，需根据接口动态更新
    icons: {}
  },
  
  onLoad() {
    console.log("[Project Work Page] 获取页面图标资源");
    this.loadIcons();

    // 这里模拟从后端获取权限级别
    this.fetchUserLevel()
  },

  loadIcons() {
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
      icons: {
        grayTask: resources.grayTask,
        pencilNote: resources.pencilNote,
        inspect: resources.inspect,
        blackArrow: resources.blackArrow,
        whiteArrow: resources.whiteArrow,
        whiteCat: resources.whiteCat
      }
      })
    }
  },

  handlerGobackClick() {
    wx.showModal({
      title: '你点击了返回',
      content: '是否确认放回',
      success: e => {
        if (e.confirm) {
          const pages = getCurrentPages();
          if (pages.length >= 2) {
            wx.navigateBack({
              delta: 1
            });
          } else {
            wx.reLaunch({
              url: '/pages/index/index'
            });
          }
        }
      }
    });
  },
  handlerGohomeClick() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 示例：获取用户权限
  fetchUserLevel() {
    // 发起网络请求
    wx.request({
      url: 'https://api.example.com/user/info',
      success: (res) => {
        this.setData({ level: res.data.level })
      },
      fail: () => {
        wx.showToast({ title: '获取权限失败' })
      }
    })
  }
})