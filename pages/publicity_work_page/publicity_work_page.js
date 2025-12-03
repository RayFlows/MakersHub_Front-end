// index.js
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const app = getApp();

Page({
  data: {
    level: 2, // 默认权限级别，需根据接口动态更新
    icons: {}
  },
  
  onLoad() {
    this.fetchUserRole();
    console.log("[Publicity Work Page] 获取本页图标资源")
    this.loadIcons();
  },

  loadIcons: function () {
    // 获取该页面的公共资源
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
        icons: {
          whiteArrow: resources.whiteArrow, // 白色右箭头
          blackArrow: resources.blackArrow, // 黑色箭头
          ticket: resources.ticket, // 宣传发布icon
          arrange: resources.arrange, // 学年工作安排icon
          history: resources.history, // 我的秀米链接icon
          checklist: resources.checklist, // 我的任务icon
          whiteTask: resources.whiteTask, // 发布任务icon
          inspect: resources.inspect, // 秀米链接审核icon
          whiteCat: resources.whiteCat // 底部猫咪
        }
      })
    }
  },

  fetchUserRole() {
    wx.request({
      url: config.users.profile,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'content-type': 'application/json'
      },
      success: (res) => {
        this.setData({ level: res.data.data.role });
      },
      fail: () => {
        wx.showToast({ title: '获取权限失败' });
      }
    });
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

    // 导航方法
    navigateToActivitySubmit() {
      wx.navigateTo({ url: '/pages/activity_submit/activity_submit' }) // 活动宣传发布
    },
    navigateToSchedule() {
      wx.navigateTo({ url: '/pages/schedule/schedule' }) // 学年工作安排
    },
    navigateToMyXiumiLink() {
      wx.navigateTo({ url: '/pages/my_xiumi_link/my_xiumi_link' }) 
    },
    navigateToXiumiLinkPermit() {
      wx.navigateTo({ url: '/pages/xiumi_link_permit/xiumi_link_permit' }) 
    },
    navigateToMyTask() {
      wx.navigateTo({ url: '/pages/my_task/my_task' }) // 我的任务
    },
    navigateToTaskManagement() {
      wx.navigateTo({ url: '/pages/task_management/task_management' }) // 任务管理
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

