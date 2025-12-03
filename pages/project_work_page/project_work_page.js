// pages/project_work_page/project_work_page.js
const app = getApp();
const { getUserProfile, USER_PROFILE_KEY } = require('../index/index.js');

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

  onTapPermitProject() {
    wx.navigateTo({
      url: '/pages/project_permit_list/project_permit_list',
    })
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
  handlerGohomeClick() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 获取用户权限
  fetchUserLevel() {
    const cachedProfile = getUserProfile();
    this.setData({
      level: cachedProfile.role
    })
  }
})