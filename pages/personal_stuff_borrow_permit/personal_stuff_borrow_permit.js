// pages/personal_stuff_borrow_permit/personal_stuff_borrow_permit.js

const API_BASE = 'http://146.56.227.73:8000';
const TOKEN_KEY = 'auth_token';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLinkFocused: false,
    loading: true,
    borrowId: '',
    replyReason: '',
    
    // 借物申请详情数据
    applyDetail: {
      borrow_id: '',
      task_name: '',
      name: '',
      student_id: '',
      phone: '',
      email: '',
      grade: '',
      major: '',
      project_id: '',
      advisor_name: '',
      advisor_phone: '',
      content: '',
      materials: [],
      created_at: '',
      deadline: '',
      status: 0,
      status_desc: '',
      type: 0 // 0: 个人借物, 1: 团队借物
    },
    
    // 格式化的时间数据
    borrowTime: {
      year: '',
      month: '',
      day: ''
    },
    returnTime: {
      year: '',
      month: '',
      day: ''
    },
    
    // 格式化的物资列表
    materialsList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('页面参数:', options);
    
    var borrowId = options.borrow_id;
    if (!borrowId) {
      wx.showToast({
        title: '缺少申请ID',
        icon: 'none'
      });
      var that = this;
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({ borrowId: borrowId });
    this.loadApplyDetail(borrowId);
  },

  /**
   * 加载借物申请详情
   */
  loadApplyDetail: function(borrowId) {
    var token = wx.getStorageSync(TOKEN_KEY);
    var that = this;
    
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: API_BASE + '/borrow/applies/' + borrowId,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      success: function(response) {
        console.log('获取申请详情成功:', response);
        
        if (response.data && response.data.status === 'ok') {
          var detail = response.data.data;
          that.processApplyDetail(detail);
        } else {
          console.error('获取详情失败:', response.data);
          wx.showToast({
            title: (response.data && response.data.message) || '获取详情失败',
            icon: 'none'
          });
        }
      },
      fail: function(error) {
        console.error('网络请求失败:', error);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: function() {
        that.setData({ loading: false });
      }
    });
  },

  /**
 * 处理申请详情数据
 */
processApplyDetail: function(detail) {
  console.log('处理详情数据:', detail);
  
  // 格式化借用时间（申请时间）
  var borrowTime = this.formatDateTime(detail.created_at);
  console.log('格式化后的借用时间:', borrowTime);
  
  // 格式化归还时间
  var returnTime = this.formatDateTime(detail.deadline);
  console.log('格式化后的归还时间:', returnTime);
  
  // 格式化物资列表
  var materialsList = this.formatMaterials(detail.materials);
  console.log('格式化后的物资列表:', materialsList);
  
  // 更新页面数据
  this.setData({
    applyDetail: {
      borrow_id: detail.borrow_id || '',
      task_name: detail.task_name || '',
      name: detail.name || '',
      student_id: detail.student_id || detail.grade || '', // 如果没有学号，用年级代替
      phone: detail.phone || '',
      email: detail.email || '',
      grade: detail.grade || '',
      major: detail.major || '',
      project_id: detail.project_id || '',
      advisor_name: detail.advisor_name || '',
      advisor_phone: detail.advisor_phone || '',
      content: detail.content || '',
      materials: detail.materials || [],
      created_at: detail.created_at || '',
      deadline: detail.deadline || '',
      status: detail.status || 0,
      status_desc: detail.status_desc || '',
      type: detail.type || 0
    },
    borrowTime: borrowTime,
    returnTime: returnTime,
    materialsList: materialsList
  });
  
  console.log('页面数据更新完成:', this.data);
},

  /**
   * 格式化日期时间
   */
  formatDateTime: function(dateTimeStr) {
    if (!dateTimeStr) {
      return { year: '', month: '', day: '' };
    }
    
    try {
      // 处理日期字符串，可能格式为 "2025-06-12T10:30:00" 或 "2025-06-12 10:30:00"
      var dateStr = dateTimeStr.split('T')[0] || dateTimeStr.split(' ')[0];
      var dateParts = dateStr.split('-');
      var year = dateParts[0];
      var month = dateParts[1];
      var day = dateParts[2];
      
      return {
        year: year || '',
        month: month || '',
        day: day || ''
      };
    } catch (error) {
      console.error('日期格式化失败:', error);
      return { year: '', month: '', day: '' };
    }
  },

  /**
   * 格式化物资列表
   */
  formatMaterials: function(materials) {
    if (!materials || !Array.isArray(materials)) {
      return [];
    }
    
    var result = [];
    for (var i = 0; i < materials.length; i++) {
      var material = materials[i];
      if (typeof material === 'string') {
        result.push({
          id: i,
          text: material
        });
      } else if (typeof material === 'object') {
        result.push({
          id: i,
          text: JSON.stringify(material)
        });
      } else {
        result.push({
          id: i,
          text: '未知物品'
        });
      }
    }
    return result;
  },

  /**
   * 输入框焦点事件
   */
  onLinkFocused: function() {
    this.setData({
      isLinkFocused: true
    });
  },

  onLinkBlur: function() {
    this.setData({
      isLinkFocused: false
    });
  },

    /**
   * 输入事件处理
   */
  onInput: function(e) {
    var field = e.currentTarget.dataset.field;
    console.log('输入字段:', field, '输入值:', e.detail.value);
    var updateData = {};
    updateData[field] = e.detail.value;
    this.setData(updateData);
  },
  /**
   * 审核操作
   */
  onSubmit: function(e) {
    var action = e.currentTarget.dataset.action || '通过';
    var buttonText = e.target.innerText || action;
    
    console.log('审核操作:', buttonText, action);
    
    // 判断是通过还是打回 - 避免使用 includes
    var isApprove = buttonText.indexOf('通过') !== -1 || action === 'approve';
    var isReject = buttonText.indexOf('打回') !== -1 || action === 'reject';
    
    if (isReject && !this.data.replyReason.trim()) {
      wx.showToast({
        title: '请输入打回理由',
        icon: 'none'
      });
      return;
    }
    
    var confirmText = isApprove ? '确认通过此申请？' : '确认打回此申请？';
    var that = this;
    
    wx.showModal({
      title: '确认操作',
      content: confirmText,
      success: function(res) {
        if (res.confirm) {
          that.submitReview(isApprove);
        }
      }
    });
  },

  /**
   * 提交审核结果
   */
  submitReview: function(isApprove) {
    var token = wx.getStorageSync(TOKEN_KEY);
    var that = this;
    
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    var submitData = {
      borrow_id: this.data.borrowId,
      action: isApprove ? 'approve' : 'reject',
      reason: isApprove ? '' : this.data.replyReason
    };

    console.log('提交审核数据:', submitData);

    wx.showLoading({ title: '处理中...' });

    wx.request({
      url: API_BASE + '/borrow/review',
      method: 'POST',
      data: submitData,
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      success: function(response) {
        wx.hideLoading();
        console.log('审核结果:', response);
        
        if (response.statusCode === 200 || response.statusCode === 201) {
          wx.showToast({
            title: isApprove ? '审核通过' : '已打回',
            icon: 'success'
          });
          
          // 延迟返回上级页面
          setTimeout(function() {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: (response.data && response.data.message) || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: function(error) {
        wx.hideLoading();
        console.error('审核请求失败:', error);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 返回按钮点击事件
   */
  handlerGobackClick: function() {
    wx.navigateBack({
      delta: 1,
      fail: function() {
        wx.switchTab({ 
          url: '/pages/base_management_work_page/base_management_work_page', 
          fail: function() {
            wx.navigateTo({ url: '/pages/index/index' });
          }
        });
      }
    });
  },

  /**
   * 首页按钮点击事件
   */
  handlerGohomeClick: function() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: function() {
        wx.navigateTo({ 
          url: '/pages/index/index', 
          fail: function() {
            wx.showToast({ title: '跳转失败', icon: 'none' });
          }
        });
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.loadApplyDetail(this.data.borrowId);
    setTimeout(function() {
      wx.stopPullDownRefresh();
    }, 1500);
  }
});