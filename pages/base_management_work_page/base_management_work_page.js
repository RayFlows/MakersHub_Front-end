const token = wx.getStorageSync('auth_token');
var config = (wx.getStorageSync('config'));
const TOKEN_KEY = "auth_token";
Page({
  data: {
    level: 2 // 默认权限级别，需根据接口动态更新
  },

  onLoad() {
    this.fetchUserRole();
  },

  handlerGobackClick() {
    const pages = getCurrentPages();
    if (pages.length >= 2) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
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

  // 新增跳转函数：跳转到借物申请审核页面
  navigate3() {
    wx.navigateTo({
      url: '/pages/stuff_borrow_permit_list/stuff_borrow_permit_list'
    });
  },

  // 其余按钮保留空函数以避免报错（你可以继续补充）
  navigate1() {},
  navigate2() {},
  navigate4() {
    wx.navigateTo({
      url: '/pages/site_borrow_permit_list/site_borrow_permit_list'
    });
  }
});
