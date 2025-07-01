// pages/my_task/my_task.js
// const API_BASE = "https://mini.makershub.cn";
const API_BASE = 'http://146.56.227.73:8000';
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
    stateTag: ["待完成", "已完成", "已取消"],
    stateColors: {
      0: "#666",      // 待完成
      1: "#00adb5",   // 已完成
      2: "#E33C64"    // 已取消
    },
    list: [],         // 全部申请
    unfinishedList: [], // 待完成 (state=0)
    finishedList: [],  // 已完成 (state=1)
    cancelledList: [], // 已取消 (state=2)
    loading: false,   // 加载状态
    // 任务类型名称映射
    taskName: ['其他', '活动文案', '推文', '新闻稿'],
    // DEBUG = TRUE加载的数据
    mockData: {
      "code": 200,
      "message": "successfully get all tasks",
      "data": {
        "total": 3,
        "list": [
          {
            "task_id": "TS20250613205701479_792",
            "task_type": 0,
            "content": "找这学期打比赛做项目的同学，整理他们的项目信息，包括图片、奖项和介绍",
            "state": 0,
            "deadline": "2025-03-23T12:00:21Z",
            "create_time": "2025-02-23T12:00:21Z"
          },
          {
            "task_id": "TS20250613205701479_791",
            "task_type": 0,
            "content": "找上学期打比赛做项目的同学，整理他们的项目信息，包括图片、奖项和介绍",
            "state": 1,
            "deadline": "2025-03-23T12:00:21Z",
            "create_time": "2025-02-23T12:00:21Z"
          },
          {
            "task_id": "TS20250613205701479_790",
            "task_type": 0,
            "content": "完成百团大战海报的制作，采用蓝色和白色为主调",
            "state": 2,
            "deadline": "2025-01-23T12:00:21Z",
            "create_time": "2025-02-23T12:00:21Z"
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
      this.fetchList();
    }
  },

  // 切换 tab
  changeItem(e) {
    const index = parseInt(e.currentTarget.dataset.item);
    this.setData({ tab: index });
    
    // 每次切换tab时重新请求数据
    if (DEBUG) {
      this.loadMockData();
    } else {
      this.fetchList();
    }
  },
  onSwiperChange(e) {
    this.setData({ tab: e.detail.current });
  
    // 滑动切换tab时也重新请求数据
    if (DEBUG) {
      this.loadMockData();
    } else {
      this.fetchList();
    }
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

  // 获取任务列表
  fetchList() {
    this.setData({ loading: true });
    wx.request({
      url: `${API_BASE}/tasks/view-my`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        console.log('获取任务列表：', res.data);
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
        console.error('获取任务失败：', err);
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  },

  // 统一处理列表：格式化时间 + 按 state 分组 + 映射 task_type
  processList(list) {
    const all = list.map(item => ({
      ...item,
      task_name: this.data.taskName[item.task_type] || '未知任务类型', // 映射 task_type 到任务名称
      formatted_deadline: utils.formatDateTime(new Date(item.deadline)),
      formatted_create_time: utils.formatDateTime(new Date(item.created_at))
    }));
    
    this.setData({
      list: all,
      unfinishedList: all.filter(x => x.state === 0),
      finishedList: all.filter(x => x.state === 1),
      cancelledList: all.filter(x => x.state === 2)
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
    if (DEBUG) {
      this.loadMockData();
    } else {
      this.fetchList();
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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
    if (DEBUG) {
      this.loadMockData();
    } else {
      this.fetchList();
    }
    wx.stopPullDownRefresh();
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
