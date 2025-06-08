// 值班申请页面 JS 逻辑文件

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    // 星期选项数组
    weekArray: ['星期', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    
    // 时段选项数组
    timeArray: ['时段', '上午', '下午', '晚上', '全天'],
    
    // 时段1选择状态
    timeSlot1: {
      weekIndex: 0,  // 默认选择第一个（星期）
      timeIndex: 0   // 默认选择第一个（时段）
    },
    
    // 时段2选择状态
    timeSlot2: {
      weekIndex: 0,
      timeIndex: 0
    },
    
    // 时段3选择状态
    timeSlot3: {
      weekIndex: 0,
      timeIndex: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('值班申请页面加载完成');
  },

  /**
   * 时段1 - 星期选择变化
   */
  onWeekChange1: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'timeSlot1.weekIndex': index
    });
    console.log('时段1星期选择：', this.data.weekArray[index]);
  },

  /**
   * 时段1 - 时间选择变化
   */
  onTimeChange1: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'timeSlot1.timeIndex': index
    });
    console.log('时段1时间选择：', this.data.timeArray[index]);
  },

  /**
   * 时段2 - 星期选择变化
   */
  onWeekChange2: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'timeSlot2.weekIndex': index
    });
    console.log('时段2星期选择：', this.data.weekArray[index]);
  },

  /**
   * 时段2 - 时间选择变化
   */
  onTimeChange2: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'timeSlot2.timeIndex': index
    });
    console.log('时段2时间选择：', this.data.timeArray[index]);
  },

  /**
   * 时段3 - 星期选择变化
   */
  onWeekChange3: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'timeSlot3.weekIndex': index
    });
    console.log('时段3星期选择：', this.data.weekArray[index]);
  },

  /**
   * 时段3 - 时间选择变化
   */
  onTimeChange3: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'timeSlot3.timeIndex': index
    });
    console.log('时段3时间选择：', this.data.timeArray[index]);
  },

  /**
   * 提交按钮点击事件
   */
  onSubmit: function() {
    // 获取当前选择的值
    const timeSlot1 = {
      week: this.data.weekArray[this.data.timeSlot1.weekIndex],
      time: this.data.timeArray[this.data.timeSlot1.timeIndex]
    };
    
    const timeSlot2 = {
      week: this.data.weekArray[this.data.timeSlot2.weekIndex],
      time: this.data.timeArray[this.data.timeSlot2.timeIndex]
    };
    
    const timeSlot3 = {
      week: this.data.weekArray[this.data.timeSlot3.weekIndex],
      time: this.data.timeArray[this.data.timeSlot3.timeIndex]
    };

    // 验证是否至少选择了一个有效时段
    const validSlots = [timeSlot1, timeSlot2, timeSlot3].filter(slot => 
      slot.week !== '星期' && slot.time !== '时段'
    );

    if (validSlots.length === 0) {
      wx.showToast({
        title: '请至少选择一个时段',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 构造提交数据
    const submitData = {
      timeSlots: [
        {
          slot: 1,
          week: timeSlot1.week,
          time: timeSlot1.time,
          selected: timeSlot1.week !== '星期' && timeSlot1.time !== '时段'
        },
        {
          slot: 2,
          week: timeSlot2.week,
          time: timeSlot2.time,
          selected: timeSlot2.week !== '星期' && timeSlot2.time !== '时段'
        },
        {
          slot: 3,
          week: timeSlot3.week,
          time: timeSlot3.time,
          selected: timeSlot3.week !== '星期' && timeSlot3.time !== '时段'
        }
      ],
      submitTime: new Date().getTime()
    };

    console.log('提交数据：', submitData);

    // 显示提交成功提示
    wx.showToast({
      title: '申请提交成功',
      icon: 'success',
      duration: 2000
    });

    // 这里可以调用API提交数据到服务器
    // this.submitToServer(submitData);
  },

  /**
   * 提交数据到服务器（示例方法）
   */
  submitToServer: function(data) {
    wx.request({
      url: 'https://your-api-endpoint.com/duty-application',
      method: 'POST',
      data: data,
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log('提交成功：', res.data);
        wx.showToast({
          title: '申请提交成功',
          icon: 'success'
        });
      },
      fail: function(error) {
        console.error('提交失败：', error);
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('页面渲染完成');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('页面显示');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('页面隐藏');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('页面卸载');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('下拉刷新');
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('上拉触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '值班申请',
      path: '/pages/duty-application/duty-application'
    };
  }
});