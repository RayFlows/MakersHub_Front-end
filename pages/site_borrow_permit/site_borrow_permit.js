const API_BASE = "https://mini.makershub.cn";
const TOKEN_KEY = "auth_token";
const token = wx.getStorageSync(TOKEN_KEY);

// pages/personal_stuff_borrow_permit.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    apiData: {
      "apply_id": '',
      "state": '',
      "name": '',
      "student_id": '',
      "phone_num": '',
      "email": '',
      "purpose": '',
      "site": '',
      "number":'',
      "project_id": '',
      "mentor_name": '',
      "mentor_phone_num": '',
      "start_time": '',
      "end_time": '',
      "review": ''
    },
    isReviewFocused: false,
    // 单独存年月日以供视图渲染
    startYear: '', startMonth: '', startDay: '',
    endYear: '',   endMonth: '',   endDay: '',
  },

  onReviewFocused : function() {
    this.setData({
      isReviewFocused: true
    });
  },

  onReviewBlur : function() {
    this.setData({
      isReviewFocused: false
    });
  },

  /**
   * 监听 textarea 输入，更新 apiData.review
   */
  onReviewInput(e) {
     // e.detail.value 是 textarea 的当前内容
      this.setData({
        'apiData.review': e.detail.value
      });
    },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const applyId = options.apply_id;
    if (!applyId) {
      wx.showToast({ title: '获取申请ID失败', icon: 'error' });
      return;
    }
    console.log("applyId: ", applyId);
    // 保存 apply_id，方便后续提交审核时使用
    this.setData({ 'apiData.apply_id': applyId });

    // 调用后端接口获取详情
    wx.request({
      url: `${API_BASE}/sites-borrow/detail/${applyId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const d = res.data.data;
          // 解析年月日
          const [sy, sm, sd] = d.start_time.split('-');
          const [ey, em, ed] = d.end_time.split('-');
          this.setData({
            apiData: d,
            startYear: sy, startMonth: sm, startDay: sd,
            endYear:   ey, endMonth:   em, endDay:   ed
          });
          console.log("apiData from backEnd: ", JSON.stringify(d));
        } else {
          wx.showToast({ title: '获取详情失败', icon: 'error' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      }
    });
  },
  /**
   * 审核通过
   */
  onApprove() {
    // this.data.apiData.review 为空
    this.submitReview(2);
  },

  /**
   * 审核打回
   */
  onReject() {
    if(!this.data.apiData.review) {
      wx.showToast({ title: '请填写打回理由', icon: 'none' });
      return;
    } 
    this.submitReview(1);
  },

  /*提交审核结果 */
  submitReview(newState) {
    const { apply_id, review } = this.data.apiData;
    wx.request({
      url: `${API_BASE}/sites-borrow/review/${apply_id}`,
      method: 'PATCH',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: { state: newState, review },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '审核成功', icon: 'success' });
          // 返回上一页
          setTimeout(() => wx.navigateBack(), 800);
        } else {
          wx.showToast({ title: res.data.message || '审核失败', icon: 'error' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      }
    });
  },

  // 归还场地
  returnSite() {
    wx.showModal({
      title: '场地归还检查',
      content: '确认检查无误，允许归还该场地？',
      confirmColor: '#00adb5',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '归还中...',
          });
          wx.request({
            url: `${API_BASE}/sites-borrow/return/${this.data.apiData.apply_id}`,
            method: 'PATCH',
            header: {
              'content-type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            data: {}, // 无需额外数据，后端处理 state
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({
                  title: '归还成功',
                  icon: 'success',
                  duration: 1500,
                  success: () => {
                    setTimeout(() => {
                      wx.navigateBack();
                    }, 1500);
                  }
                });
              } else {
                wx.showToast({
                  title: res.data.message || '归还失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              console.error('归还请求失败:', err);
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      }
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
})