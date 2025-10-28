// pages/xiumi_link_permit/xiumi_link_permit.js
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const DEBUG = false;
// 引入外部utils工具
const utils = require("../../utils/util")

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
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (DEBUG) {
      this.loadMockData();
    } else {
      this.fetchAllLinks();
    }
  },

  // 切换 tab
  changeItem(e) {
    const index = parseInt(e.currentTarget.dataset.item);
    this.resetFeedback(); // 重置反馈状态
    this.setData({ tab: index });
  },
  onSwiperChange(e) {
    this.setData({ tab: e.detail.current });
  },
  // 重置 unreviewedList 的反馈状态
  resetFeedback() {
    const unreviewedList = this.data.unreviewedList.map(item => ({
      ...item,
      showFeedback: false,
      feedbackText: ''
    }));
    this.setData({ unreviewedList });
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

  // 显示打回输入框
  showFeedbackInput(e) {
    const { index } = e.currentTarget.dataset;
    console.log("index: ", index);
    this.setData({
      [`unreviewedList[${index}].showFeedback`]: true
    });
  },

  // 处理打回原因输入
  onFeedbackInput(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`unreviewedList[${index}].feedbackText`]: value
    });
  },

  // 拉取秀米链接列表
  // 真正从后端拉数据的方法
  fetchAllLinks() {
    wx.request({
      url: config.publicity_link.view_all,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 200) {
          this.processList(res.data.data.list);
        } else {
          wx.showToast({ title: '获取失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
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

  // 统一处理列表：格式化时间 + 按 state 分组
  processList(list) {
    const all = list.map(item => ({
      ...item,
      formatted_time: utils.formatDateTime(new Date(item.create_time)),
      showFeedback: false,
      feedbackText: ''
    }));
    this.setData({
      unreviewedList: all.filter(x => x.state === 0),
      rejectedList: all.filter(x => x.state === 1),
      approvedList: all.filter(x => x.state === 2)
    });
  },


  // 点击“通过”，提示并调用接口反馈
  onApprove(e) {
    const { linkId, index } = e.currentTarget.dataset;
    wx.showModal({
      content: '通过后将无法撤回审核意见，确认通过？',
      cancelColor: '#222831',
      confirmColor: '#00ADB5',
      complete: (res) => {
        if (res.cancel) {
          
        }
    
        if (res.confirm) {
          wx.request({
            url: config.publicity_link.review + `${linkId}`,
            method: 'PATCH',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: { state: 2 },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({ title: '已通过', icon: 'success' });
                this.fetchAllLinks();
              } else {
                wx.showToast({ title: '通过失败', icon: 'none' });
              }
            },
            fail: (err) => {
              console.error('通过请求失败：', err);
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    })
  },

  // 选择打回后点击取消
  cancelFeedback(e) {
    const { index } = e.currentTarget.dataset; // 从事件对象获取 index
    wx.showModal({
      content: '取消后反馈将丢失，确认取消？',
      cancelColor: '#00ADB5',
      confirmColor: '#222831',
      complete: (res) => {
        if (res.cancel) {
          
        }
    
        if (res.confirm) {
          this.setData({
            [`unreviewedList[${index}].showFeedback`]: false,
            [`unreviewedList[${index}].feedbackText`]: ''
          });
        }
      }
    })
  },

  // 选择打回后点击确认
  confirmFeedback(e) {
    const { linkId, index } = e.currentTarget.dataset;
    const feedback = this.data.unreviewedList[index].feedbackText;
    if (!feedback) {
      wx.showToast({ title: '请输入打回原因', icon: 'none' });
      return;
    }
    wx.showModal({
      content: '通过后将无法撤回审核意见，确认打回？',
      cancelColor: '#222831',
      confirmColor: '#00ADB5',
      complete: (res) => {
        if (res.confirm) {
          console.log("Feedback to Back-End: ", feedback);
          wx.request({
            url: config.publicity_link.review + `${linkId}`,
            method: 'PATCH',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              state: 1, // 设置为已打回
              review: feedback // 打回原因
            },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({ title: '打回成功', icon: 'success' });
                this.fetchAllLinks(); // 刷新列表
              } else {
                wx.showToast({ title: '打回失败', icon: 'none' });
              }
            },
            fail: (err) => {
              console.error('打回请求失败：', err);
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    })
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

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