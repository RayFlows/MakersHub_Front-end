// pages/my_site_borrow_detail/my_site_borrow_detail.js
// const API_BASE = "https://mini.makershub.cn";
const API_BASE = "http://146.56.227.73:8000";
const token = wx.getStorageSync('auth_token');
const DEBUG = false; // 调试模式标志

Page({
  /**
   * 页面的初始数据
   */
  data: {
    apiData: {},
    stateTag: ["待审核", "已打回", "借用中", "已归还"],
    stateText: ['#FFFFFF', '#FFFFFF', '#222831', '#FFFFFF'],
    stateColors: {
      0: "#666",      // 待审核
      1: "#E33C64",   // 已打回
      2: "#ffeaa7",   // 借用中
      3: "#00adb5"    // 已归还
    },
    apply_id: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.apply_id) {
      this.setData({
        apply_id: options.apply_id
      });
      this.fetchSiteBorrowDetail(options.apply_id);
    } else if (DEBUG) {
      // 调试模式：使用模拟的apply_id
      const mockApplyId = "LB1749636004000";
      this.setData({
        apply_id: mockApplyId
      });
      this.fetchSiteBorrowDetail(mockApplyId);
    } else {
      wx.showToast({
        title: '获取申请id失败',
        icon: 'error'
      });
    }
  },

  /**
   * 获取场地借用详情
   */
  fetchSiteBorrowDetail(apply_id) {
    wx.showLoading({
      title: '加载中...',
    });
    if(DEBUG) {
      // 调试模式：使用模拟数据
      setTimeout(() => {
        const mockData = {
            apply_id: apply_id,
            name: "张三",
            student_id: "2023141460079",
            phone_num: "13800138000",
            email: "student@example.com",
            purpose: "创新项目展示与研讨",
            project_id: "PJ1749636004000",
            mentor_name: "李华",
            mentor_phone_num: "13900139000",
            site: "二基楼B101",
            number: 1,
            start_time: "2024-02-15",
            end_time: "2024-02-25",
            state: 0,
            review: ""
          };        
        this.setData({
          apiData: mockData
        });
        
        console.log('加载的申请详情:', mockData);
        wx.hideLoading();
      }, 500);
    } else {
      wx.request({
        url: `${API_BASE}/sites-borrow/detail/${apply_id}`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'Authorization': token
        },
        success: (res) => {
          if (res.data.code === 200) {
            this.setData({
              apiData: res.data.data
            });
          } else {
            wx.showToast({
              title: res.data.message || '获取详情失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
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
  },

  /**
   * 复制项目编号
   */
  copyLink() {
    wx.setClipboardData({
      data: this.data.apiData.project_id,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 取消申请
   */
  cancelApplication() {
    wx.showModal({
      title: '确认取消',
      content: '取消后本次申请作废，确认取消？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '取消中...',
          });
          
          wx.request({
            url: `${API_BASE}/sites-borrow/cancel/${this.data.apply_id}`,
            method: 'POST',
            header: {
              'content-type': 'application/json',
              'Authorization': token
            },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({
                  title: '申请已取消',
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
                  title: res.data.message || '取消失败',
                  icon: 'none'
                });
              }
            },
            fail: () => {
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
   * 修改申请
   */
  modifyApplication() {
    // 直接跳转到申请页面，并传递apply_id参数
    wx.navigateTo({
      url: `/pages/site_borrow_apply/site_borrow_apply?edit=true&apply_id=${this.data.apply_id}`
    });
  },

  /**
   * 返回上一页
   */
  handlerGobackClick() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 返回首页
   */
  handlerGohomeClick() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    if (this.data.apply_id) {
      this.fetchSiteBorrowDetail(this.data.apply_id);
    }
    wx.stopPullDownRefresh();
  }
})
