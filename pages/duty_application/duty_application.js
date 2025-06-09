Page({
  data: {
    // 实际下拉选项（不包含提示项）
    weekArray: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    timeArray: ['08:10 - 10:05', '10:15 - 12:20', '12:30 - 14:30', '14:30 - 16:30', '16:30 - 18:30', '18:30 - 20:30'],

    // 每组时段的初始选择索引，-1 表示未选择（显示提示文字）
    timeSlot1: { weekIndex: -1, timeIndex: -1 },
    timeSlot2: { weekIndex: -1, timeIndex: -1 },
    timeSlot3: { weekIndex: -1, timeIndex: -1 }
  },

  onLoad() {
    console.log('值班申请页面加载完成');
  },

  // ======= 选择事件处理 =======
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

  // ======= 提交处理 =======
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
      title: '申请提交成功',
      icon: 'success',
      duration: 2000
    });

    // 如需提交到后端，请启用以下函数
    this.submitToServer(submitData);
  },

  // 示例：提交数据到后端接口
  submitToServer(data) {
    wx.request({
      url: 'http://146.56.227.73:8000/duty-apply/post',
      method: 'POST',
      data,
      header: { 'content-type': 'application/json' },
      success: (res) => {
        console.log('提交成功：', res.data);
        wx.showToast({ title: '申请成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('提交失败：', err);
        wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      }
    });
  }
});
