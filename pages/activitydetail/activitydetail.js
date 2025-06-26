const token = wx.getStorageSync('auth_token');
const API_BASE = "http://146.56.227.73:8000";

// 导入外部utils工具函数
const utils = require('../../utils/util')

Page({
  data: {
    apiData: {
      event_id: '',
      event_name: '',
      poster: '/images/activitydetail/api.jpg',
      description: '',
      participant: '',
      location: '',
      link: '',
      start_time: '',
      end_time: '',
      registration_deadline: ''
    }
  },

  onLoad(options) {
    const event_id = options.event_id;
    this.fetchActivityDetail(event_id);
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

  fetchActivityDetail(event_id) {
    wx.showLoading({
      title: '加载中...'
    });
    
    wx.request({
      url: `${API_BASE}/events/details/${event_id}`,  // 正确的路径格式
      method: "GET",
      header: {
        'Authorization': `Bearer ${token}`,
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          console.log("获取数据成功：", res.data.data);
          const data = res.data.data;
          
          // 格式化日期时间
          data.start_time = utils.formatDateTime(data.start_time);
          data.end_time = utils.formatDateTime(data.end_time);
          data.registration_deadline = utils.formatDateTime(data.registration_deadline);
          
          // 不需要修改poster路径，直接使用后端返回的完整URL
          this.setData({ apiData: data });
        } else {
          wx.showToast({
            title: res.data.message || "获取活动详情失败",
            icon: "none"
          });
        }
      },
      fail: (err) => {
        console.error("请求失败：", err);
        wx.showToast({
          title: "请求失败",
          icon: "error"
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },


  copyLink() {
    wx.setClipboardData({
      data: this.data.apiData.link,
      success() {
        wx.showToast({
          title: "复制成功",
          icon: "success"
        });
      }
    });
  }
});
