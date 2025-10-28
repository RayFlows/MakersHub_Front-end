// pages/FieldApply/FieldApply.js
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const utils = require("../../utils/util");

Page({
  data: {
    tab: 0,
    sortText: '默认',
    currentSort: 'default',
    isFolded: true,
    stateTag: ["待审核", "已打回", "已通过", "已归还", "已取消"], // 添加“已取消”
    stateText: ['#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF'],
    stateColors: {
      0: "#666", // 待审核
      1: "#E33C64", // 已打回
      2: "#ffeaa7", // 已通过
      3: "#00adb5", // 已归还
      4: "#999999" // 已取消（新增）
    },
    list: [],
    unreviewedList: [],
    approvedList: [],
    rejectedList: [],
    returnedList: [],
    cancelledList: [], // 新增取消列表
    mockData: {
      code: 200,
      message: "successfully get application list",
      data: {
        total: 4,
        list: [
          {
            apply_id: "LB1749636004000",
            state: 2,
            created_time: "2024-01-14T10:10:10Z",
            site: "二基楼B101",
            number: 1
          },
          {
            apply_id: "LB1749636006000",
            state: 0,
            created_time: "2024-02-14T10:10:12Z",
            site: "二基楼B208+",
            number: 2
          },
          {
            apply_id: "LB1749636007000",
            state: 3,
            created_time: "2024-03-14T10:10:12Z",
            site: "二基楼B102",
            number: 3
          },
          {
            apply_id: "LB1749636008000",
            state: 1,
            created_time: "2024-04-14T10:10:12Z",
            site: "二基楼B209",
            number: 1
          }
        ]
      }
    }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData(); // 每次页面显示时刷新数据
  },

  onReady() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('refreshList', (data) => {
      console.log('收到刷新事件：', data);
      this.loadData(); // 收到事件后刷新数据
    });
  },

  filterData(dataList) {
    const formattedDataList = dataList.map(item => ({
      ...item,
      formatted_time: utils.formatDateTime(new Date(item.created_time))
    }));

    const unreviewedList = formattedDataList.filter(item => item.state === 0);
    const rejectedList = formattedDataList.filter(item => item.state === 1);
    const approvedList = formattedDataList.filter(item => item.state === 2);
    const returnedList = formattedDataList.filter(item => item.state === 3);
    const cancelledList = formattedDataList.filter(item => item.state === 4); // 新增取消分类

    this.setData({
      list: formattedDataList,
      unreviewedList,
      approvedList,
      rejectedList,
      returnedList,
      cancelledList
    });
    console.log("list: ", this.data.list);
    console.log("unreviewedList: ", this.data.unreviewedList);
    console.log("approvedList: ", this.data.approvedList);
    console.log("rejectedList: ", this.data.rejectedList);
    console.log("returnedList: ", this.data.returnedList);
    console.log("cancelledList: ", this.data.cancelledList);
  },

  loadData() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: config.sites_borrow.view_all,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // 添加 Content-Type
      },
      success: (res) => {
        wx.hideLoading();
        console.log("apiData", JSON.stringify(res.data.data, null, 2));
        if (res.data && res.data.code === 200 && res.data.data && Array.isArray(res.data.data.list)) {
          this.filterData(res.data.data.list);
        } else {
          wx.showToast({
            title: res.data.message || '数据加载失败',
            icon: 'error'
          });
          console.error('后端返回异常：', res);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'error' });
        console.error('wx.request 调用失败：', err);
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
    wx.showModal({
      title: '你点击了返回',
      content: '是否确认返回',
      success: (e) => {
        if (e.confirm) {
          const pages = getCurrentPages();
          if (pages.length >= 2) {
            wx.navigateBack({ delta: 1 });
          } else {
            wx.reLaunch({ url: '/pages/index/index' });
          }
        }
      }
    });
  },

  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  navigateToDetail(e) {
    const applyId = e.currentTarget.dataset.applyId;
    const state = e.currentTarget.dataset.state;
    console.log("applyId", applyId);
    console.log("state", state);
    wx.navigateTo({
      url: `/pages/site_borrow_permit/site_borrow_permit?apply_id=${applyId}&state=${state}`
    });
  }
});
