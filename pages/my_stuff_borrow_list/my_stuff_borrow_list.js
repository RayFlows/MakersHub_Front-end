// pages/my_stuff_borrow_list/my_stuff_borrow_list.js
var config = (wx.getStorageSync('config'));
const TOKEN_KEY = 'auth_token';
const utils = require("../../utils/util")

Page({
  data: {
    tab: 0,
    sortText: '默认',
    currentSort: 'default',
    isFolded: true,
    stateTag: ["待审核", "已打回", "借用中", "已归还"],
    stateText: ['#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF'],
    stateColors: {
      0: "#666",
      1: "#E33C64",
      2: "#ffeaa7",
      3: "#00adb5"
    },
    list: [],
    borrowingList: [],
    returnedList: [],
    unpermittedList: [],
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  filterData(dataList) {
    const formattedDataList = dataList.map(item => {
      return {
        ...item,
        formatted_time: utils.formatDateTime(item.created_time)
      };
    });

    const borrowingList = formattedDataList.filter(item => item.state === 2);
    const returnedList = formattedDataList.filter(item => item.state === 3);
    const unpermittedList = formattedDataList.filter(item => item.state === 0 || item.state === 1);

    this.setData({
      list: formattedDataList,
      borrowingList,
      returnedList,
      unpermittedList
    });
  },

  loadData() {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null') {
      wx.showToast({ title: '请先登录', icon: 'none', duration: 2000 });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' });
      }, 2000);
      return;
    }

    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: config.stuff_borrow.view,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        console.log(res.data);
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          if (res.data.data && Array.isArray(res.data.data.records)) {
            const formattedRecords = res.data.data.records.map(item => {
              const startTime = item.start_time;
              const cleanStartTime = startTime.slice(0, 10);
              return {
                ...item,
                start_time: cleanStartTime
              };
            });
            this.filterData(formattedRecords);
          } else {
            wx.showToast({ title: '暂无数据', icon: 'none' });
          }
        } else if (res.statusCode === 401) {
          wx.showToast({ title: '登录已失效，请重新登录', icon: 'none' });
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/login' });
          }, 2000);
        } else {
          wx.showToast({ title: res.data?.message || '数据加载失败', icon: 'error' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      }
    });
  },

  changeItem(e) {
    const index = parseInt(e.currentTarget.dataset.item);
    this.setData({ tab: index });
  },

  onSwiperChange(e) {
    this.setData({ tab: e.detail.current });
  },

  handlerGobackClick() {
    const pages = getCurrentPages();
    if (pages.length >= 2) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/me/me' });
    }
  },

  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  navigateToDetail(e) {
    const sbId = e.currentTarget.dataset.sbId;
    const state = e.currentTarget.dataset.state;
    console.log("sbId",sbId);
    wx.navigateTo({
      url: `/pages/my_stuff_borrow_detail/my_stuff_borrow_detail?sb_id=${sbId}&state=${state}`
    });
  },

  onPullDownRefresh() {
    this.loadData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1500);
  }
});
