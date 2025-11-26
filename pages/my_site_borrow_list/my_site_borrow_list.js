// pages/my_site_borrow_list/my_site_borrow_list.js
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const utils = require("../../utils/util");
const app = getApp();

Page({
  data: {
    tab: 0,
    sortText: '默认',
    currentSort: 'default',
    isFolded: true,
    stateTag: ["待审核", "已打回", "借用中", "已归还", "已取消"],
    stateText: ['#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF'],
    stateColors: {
      0: "#666", // 待审核
      1: "#E33C64", // 已打回
      2: "#ffeaa7", // 借用中
      3: "#00adb5", // 已归还
      4: "#999999" // 已取消（新增颜色）
    },
    list: [],
    borrowingList: [],
    returnedList: [],
    unpermittedList: [],
    cancelledList: [],
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
    },
    icons: {}
  },

  onLoad() {
    console.log("[My Site Borrow List] 获取页面图标资源");
    this.loadIcons();
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

  loadIcons() {
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
      icons: {
        whiteCat: resources.whiteCat
      }
      })
    }
  },

  filterData(dataList) {
    const formattedDataList = dataList.map(item => ({
      ...item,
      formatted_time: utils.formatDateTime(new Date(item.created_time))
    }));

    const borrowingList = formattedDataList.filter(item => item.state === 2);
    const returnedList = formattedDataList.filter(item => item.state === 3);
    const unpermittedList = formattedDataList.filter(item => item.state === 0 || item.state === 1);
    const cancelledList = formattedDataList.filter(item => item.state === 4); // 修复：item.state === 4

    this.setData({
      list: formattedDataList,
      borrowingList,
      returnedList,
      unpermittedList,
      cancelledList
    });
    console.log("list: ", this.data.list);
    console.log("borrowingList: ", this.data.borrowingList);
    console.log("returnedList: ", this.data.returnedList);
    console.log("unpermittedList: ", this.data.unpermittedList);
    console.log("cancelledList: ", this.data.cancelledList);
  },

  loadData() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: config.sites_borrow.view,
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
    const item = e.detail.current;
    if (item === 1) { // "借用中" tab
      wx.showModal({
        title: '归还提示',
        content: '如欲归还，请线下找SCUMakers工作人员办理场地归还手续',
        showCancel: false,
        confirmText: '我已知晓',
        confirmColor: '#00adb5',
        success: (res) => {
          if (res.confirm) {
            // User clicked "我已知晓", keep the tab
            this.setData({
              tab: item
            });
          } else {
            // Fallback in case something unexpected happens
            this.setData({
              tab: this.data.tab // Revert to previous tab if needed
            });
          }
        }
      });
    } else {
      // Update tab for other swiper changes
      this.setData({
        tab: item
      });
    }
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

  navigateToDetail(e) {
    const applyId = e.currentTarget.dataset.applyId;
    const state = e.currentTarget.dataset.state;
    console.log("applyId:", applyId);
    wx.navigateTo({
      url: `/pages/my_site_borrow_detail/my_site_borrow_detail?apply_id=${applyId}&state=${state}`
    });
  }
});
