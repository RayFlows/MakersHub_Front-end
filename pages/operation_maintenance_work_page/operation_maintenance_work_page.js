// pages/operation_maintenance_work_page/operation_maintenance_work_page.js
Page({
  data: {
    level: 2 // 默认权限级别，需根据接口动态更新
  },
  
  onLoad() {
    // 这里模拟从后端获取权限级别
    this.fetchUserLevel()
  },

  handlerGobackClick() {
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