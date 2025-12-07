const TOKEN_KEY = 'auth_token'; // 登录后保存的 token 的 key
const app = getApp(); 

Page({
  data: {
    weekArray: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    timeArray: ['08:10 - 10:05', '10:15 - 12:20', '12:30 - 14:30', '14:30 - 16:30', '16:30 - 18:30', '18:30 - 20:30'],

    timeSlot1: { weekIndex: -1, timeIndex: -1 },
    timeSlot2: { weekIndex: -1, timeIndex: -1 },
    timeSlot3: { weekIndex: -1, timeIndex: -1 },

    token: '', // 用于存储本地获取的 token
    icons: {}
  },

  onLoad() {
    console.log("[Duty Application] 获取本页图标资源")
    this.loadIcons();
    console.log('值班申请页面加载完成');
    const token = wx.getStorageSync(TOKEN_KEY);
    console.log('本地获取到的 token:', token);
    this.setData({ token }); // 存入 data 方便后续使用
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

  onWeekChange1(e) {
    this.setData({ 'timeSlot1.weekIndex': parseInt(e.detail.value) });
  },
  onTimeChange1(e) {
    this.setData({ 'timeSlot1.timeIndex': parseInt(e.detail.value) });
  },
  onWeekChange2(e) {
    this.setData({ 'timeSlot2.weekIndex': parseInt(e.detail.value) });
  },
  onTimeChange2(e) {
    this.setData({ 'timeSlot2.timeIndex': parseInt(e.detail.value) });
  },
  onWeekChange3(e) {
    this.setData({ 'timeSlot3.weekIndex': parseInt(e.detail.value) });
  },
  onTimeChange3(e) {
    this.setData({ 'timeSlot3.timeIndex': parseInt(e.detail.value) });
  },

  onSubmit() {
    const { weekArray, timeArray, timeSlot1, timeSlot2, timeSlot3 } = this.data;

    const slot1 = {
      week: timeSlot1.weekIndex === -1 ? '' : weekArray[timeSlot1.weekIndex],
      time: timeSlot1.timeIndex === -1 ? '' : timeArray[timeSlot1.timeIndex]
    };
    const slot2 = {
      week: timeSlot2.weekIndex === -1 ? '' : weekArray[timeSlot2.weekIndex],
      time: timeSlot2.timeIndex === -1 ? '' : timeArray[timeSlot2.timeIndex]
    };
    const slot3 = {
      week: timeSlot3.weekIndex === -1 ? '' : weekArray[timeSlot3.weekIndex],
      time: timeSlot3.timeIndex === -1 ? '' : timeArray[timeSlot3.timeIndex]
    };

    const validSlots = [slot1, slot2, slot3].filter(slot => slot.week && slot.time);

    if (validSlots.length === 0) {
      wx.showToast({
        title: '请至少选择一个时段',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const submitData = {
      timeSlots: [
        { slot: 1, ...slot1, selected: !!(slot1.week && slot1.time) },
        { slot: 2, ...slot2, selected: !!(slot2.week && slot2.time) },
        { slot: 3, ...slot3, selected: !!(slot3.week && slot3.time) }
      ],
      submitTime: Date.now()
    };

    console.log('提交数据：', submitData);

    wx.showToast({
      title: '申请提交中',
      icon: 'loading',
      duration: 1000
    });

    this.submitToServer(submitData);
  },

  submitToServer(data) {
    const token = wx.getStorageSync('auth_token'); // 与 fetchUserProfile 保持一致
  
    if (!token) {
      wx.showToast({ title: '请先登录获取token', icon: 'none' });
      return;
    }
  
    wx.request({
      url: 'https://mini.makershub.cn/duty-apply/post',
      method: 'POST',
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // ✅ 正确地发送 token
      },
      success: (res) => {
        console.log('提交成功：', res.data);
        wx.showToast({ title: '申请成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('提交失败：', err);
        wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      }
    });
  },
  
  handlerGobackClick() {
    wx.showModal({
      title: '你点击了返回',
      content: '是否确认放回',
      success: e => {
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
  }
});
