// pages/my_xiumi_list/my_xiumi_link.js
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const DEBUG = false;
// 引入外部utils工具
const utils = require("../../utils/util")
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    tab: 0, // 当前 tab 页索引
    stateTag: ["待审核", "已打回", "已通过"],
    stateColors: {
      0: "#666",      // 待审核
      1: "#E33C64",   // 已打回
      2: "#00adb5"    // 已通过
    },
    list: [],         // 全部申请
    unreviewedList: [], // 待审核 (state=0)
    rejectedList: [],  // 已打回 (state=1)
    approvedList: [], // 已通过 (state=2)
    // DEBUG = TRUE加载的数据
    mockData: {
      code: 200,
      message: "successfully get application list",
      data: {
        total: 2,
        "list": [
          {
            "link_id": "PL1749790054000",
            "title": "全国大学生物联网设计竞赛经验分享会",
            "name": "张贤",
            "create_time": "2024-02-13T10:00:00Z",
            "link": "http://example.com",
            "state": 0,
            "review": ''
          },
          {
            "link_id": "PL1749790056000",
            "title": "作弊经验分享会",
            "name": "王远航",
            "create_time": "2024-02-13T10:00:00Z",
            "link": "http://example.com",
            "state": 1,
            "review": '谁允许你这么起名的，出去'
          },
          {
            "link_id": "PL1749790058000",
            "title": "后端开发经验分享会",
            "name": "许景源",
            "create_time": "2024-02-13T10:00:00Z",
            "link": "http://example.com",
            "state": 2,
            "review": ''
          }
        ]
      }
    },
    icons: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("[My Xiumi Link] 获取页面图标资源");
    this.loadIcons();

    if (DEBUG) {
      this.loadMockData();
    } else {
      this.fetchLinks();
    }
  },

  loadIcons() {
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
      icons: {
        grayCopy: resources.grayCopy,
        catPattern: resources.catPattern,
        whiteCat: resources.whiteCat
      }
      })
    }
  },

  // 切换 tab
  changeItem(e) {
    const index = parseInt(e.currentTarget.dataset.item);
    this.setData({ tab: index });
  },
  onSwiperChange(e) {
    this.setData({ tab: e.detail.current });
  },

  // 使用本地 mockData 调试的方法
  loadMockData() {
    const res = this.data.mockData;
    if (res.code === 200) {
      this.processList(res.data.list);
    } else {
      wx.showToast({ title: 'Mock 数据错误', icon: 'none' });
    }
  },

  // 获取列表
  fetchLinks() {
    this.setData({ loading: true });
    wx.request({
      url: config.publicity_link.view_my,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        console.log('获取链接列表：', res.data);
        if (res.data.code === 200) {
          // 获取数据后立即处理并分组
          this.processList(res.data.data.list || []);
          this.setData({ loading: false });
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' });
          this.setData({ loading: false });
        }
      },
      fail: err => {
        console.error('获取链接失败：', err);
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  },

  // 统一处理列表：格式化时间 + 按 state 分组
  processList(list) {
    const all = list.map(item => ({
      ...item,
      formatted_time: utils.formatDateTime(new Date(item.create_time))
    }));
    this.setData({
      unreviewedList: all.filter(x => x.state === 0),
      rejectedList:   all.filter(x => x.state === 1),
      approvedList:   all.filter(x => x.state === 2)
    });
  },

  // 复制链接
  copy(e) {
    const link = e.currentTarget.dataset.link; // 获取点击的链接
    if (!link) {
      wx.showToast({
        title: '链接为空',
        icon: 'none'
      });
      return;
    }
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'none'
        });
      },
      fail: (err) => {
        console.error('复制失败：', err);
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 点击“修改”，跳转到编辑页
  navigateToDetail(e) {
    const { linkId, title, name, link } = e.currentTarget.dataset;
    console.log("pass to next: ", { linkId, title, name, link });
    wx.navigateTo({
      url: `/pages/xiumi_submit/xiumi_submit?link_id=${linkId}&title=${encodeURIComponent(title)}&name=${encodeURIComponent(name)}&link=${encodeURIComponent(link)}`
    });
  },

  // 点击“+”，跳转到新增页
  navigateToSubmit() {
    wx.navigateTo({
      url: `/pages/xiumi_submit/xiumi_submit`
    });
  },

  // 返回处理
  handlerGobackClick() {
    wx.navigateBack();
  },

  // 回到首页
  handlerGohomeClick() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  onShow() {
    // 每次页面显示时刷新数据
    this.fetchLinks();
  },

  // 监听 xiumi_submit 页面的事件
  onReady() {
    // const eventChannel = this.getOpenerEventChannel();
    // eventChannel.on('refreshLinks', (data) => {
    //   console.log('收到刷新事件：', data);
    //   this.fetchLinks(); // 收到事件后刷新数据
    // });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})