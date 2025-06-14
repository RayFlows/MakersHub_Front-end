const API_BASE = 'http://146.56.227.73:8000';
const TOKEN_KEY = 'auth_token';

// 独立的日期解析函数
function parseDate(dateString) {
  console.log('开始解析日期:', dateString, '类型:', typeof dateString);
  
  if (!dateString) {
    console.log('日期为空，返回默认值');
    return { year: '----', month: '--', day: '--' };
  }
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      // 处理 ISO 8601 格式: "2025-06-12T06:19:00.881000"
      if (dateString.includes('T')) {
        // 移除微秒部分，只保留到秒
        let cleanDateString = dateString;
        if (dateString.includes('.')) {
          cleanDateString = dateString.split('.')[0];
        }
        console.log('清理后的日期字符串:', cleanDateString);
        date = new Date(cleanDateString);
      }
      // 处理其他格式
      else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    console.log('创建的Date对象:', date);
    console.log('Date对象是否有效:', !isNaN(date.getTime()));
    
    if (isNaN(date.getTime())) {
      console.log('日期解析失败，返回默认值');
      return { year: '----', month: '--', day: '--' };
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const result = {
      year: year.toString(),
      month: month.toString().padStart(2, '0'),
      day: day.toString().padStart(2, '0')
    };
    
    console.log('最终解析结果:', result);
    return result;
    
  } catch (e) {
    console.error('日期解析异常:', e, '原始数据:', dateString);
    return { year: '----', month: '--', day: '--' };
  }
}

Page({
  data: {
    loading: true,
    applyDetail: {},
    materialsList: [],
    borrowTime: {},
    returnTime: {},
    replyReason: '',
    isLinkFocused: false,
    borrowId: ''
  },

  onLoad: function(options) {
    console.log('页面加载参数:', options);
    if (options.borrow_id) {
      this.setData({
        borrowId: options.borrow_id
      });
      this.fetchApplyDetail(options.borrow_id);
    } else {
      wx.showToast({
        title: '缺少申请ID',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 获取申请详情
  fetchApplyDetail: function(borrowId) {
    this.setData({ loading: true });
    
    const token = wx.getStorageSync(TOKEN_KEY);
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    const requestUrl = API_BASE + '/borrow/applies/' + borrowId;
    
    wx.request({
      url: requestUrl,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('获取申请详情成功:', res);
        console.log('返回的数据结构:', JSON.stringify(res.data, null, 2));
        
        if (res.statusCode === 200 && res.data && res.data.data) {
          // 注意：实际数据在 res.data.data 中
          const rawData = res.data.data;
          
          console.log('实际业务数据:', rawData);
          console.log('后端返回的所有字段:', Object.keys(rawData));
          
          // 直接使用后端返回的字段名
          const applyDetail = {
            // 申请编号
            borrow_id: rawData.borrow_id,
            
            // 类型
            type: rawData.type,
            
            // 任务名称
            task_name: rawData.task_name,
            
            // 基本信息
            name: rawData.name,
            student_id: rawData.student_id || '', // 如果没有学号，显示年级
            grade: rawData.grade,
            major: rawData.major,
            phone: rawData.phone,
            email: rawData.email,
            
            // 团队借物特有字段
            project_id: rawData.project_number, // 注意：后端用的是 project_number
            advisor_name: rawData.supervisor_name, // 注意：后端用的是 supervisor_name
            advisor_phone: rawData.supervisor_phone, // 注意：后端用的是 supervisor_phone
            
            // 借用信息
            materials: rawData.materials,
            content: rawData.content,
            
            // 时间 - 注意：后端用的是 deadline，没有 borrow_date
            borrow_date: rawData.created_at, // 用创建时间作为申请时间
            return_date: rawData.deadline, // 用 deadline 作为归还时间
            
            // 状态
            status: rawData.status,
            status_desc: rawData.status_desc
          };
          
          console.log('映射后的数据:', applyDetail);
          console.log('准备解析的时间 - 申请时间:', applyDetail.borrow_date);
          console.log('准备解析的时间 - 归还时间:', applyDetail.return_date);
          
          // 处理材料列表
          let materialsList = [];
          if (applyDetail.materials && Array.isArray(applyDetail.materials)) {
            materialsList = applyDetail.materials.map((item, index) => ({
              id: index,
              text: item
            }));
          }

          // 处理时间格式 - 使用独立函数
          const borrowTime = parseDate(applyDetail.borrow_date);
          const returnTime = parseDate(applyDetail.return_date);
          
          console.log('解析后的起借时间:', borrowTime);
          console.log('解析后的归还时间:', returnTime);

          this.setData({
            applyDetail: applyDetail,
            materialsList: materialsList,
            borrowTime: borrowTime,
            returnTime: returnTime,
            loading: false
          });
          
          console.log('最终设置的数据:', {
            applyDetail: this.data.applyDetail,
            materialsList: this.data.materialsList,
            borrowTime: this.data.borrowTime,
            returnTime: this.data.returnTime
          });
          
        } else {
          console.error('数据格式不正确:', res.data);
          throw new Error(res.data?.message || '获取数据失败');
        }
      },
      fail: (err) => {
        console.error('获取申请详情失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'error'
        });
        this.setData({ loading: false });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  // 解析日期字符串 - 保留作为实例方法，调用独立函数
  parseDate: function(dateString) {
    return parseDate(dateString);
  },

  // 输入框聚焦
  onLinkFocused: function() {
    this.setData({ isLinkFocused: true });
  },

  // 输入框失焦
  onLinkBlur: function() {
    this.setData({ isLinkFocused: false });
  },

  // 输入处理
  onInput: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    if (field === 'replyReason') {
      this.setData({
        replyReason: value
      });
    }
  },

  // 提交审核结果
  onSubmit: function(e) {
    const action = e.currentTarget.dataset.action;
    const { applyDetail, replyReason, borrowId } = this.data;
    
    // 如果是拒绝操作，检查是否填写了理由
    if (action === 'reject' && !replyReason.trim()) {
      wx.showToast({
        title: '请填写拒绝理由',
        icon: 'error'
      });
      return;
    }

    wx.showModal({
      title: '确认操作',
      content: action === 'approve' ? '确认通过此申请？' : '确认拒绝此申请？',
      success: (res) => {
        if (res.confirm) {
          this.submitReviewResult(action, replyReason);
        }
      }
    });
  },

  // 提交审核结果到后端
  submitReviewResult: function(action, reason) {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      });
      return;
    }

    const requestUrl = API_BASE + '/borrow/applies/' + this.data.borrowId + '/review';
    const requestData = {
      action: action, // 'approve' 或 'reject'
      reason: reason || ''
    };

    wx.showLoading({
      title: '提交中...'
    });

    wx.request({
      url: requestUrl,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        wx.hideLoading();
        console.log('审核提交结果:', res);
        
        if (res.statusCode === 200) {
          wx.showToast({
            title: action === 'approve' ? '审核通过' : '已拒绝',
            icon: 'success'
          });
          
          // 更新页面状态
          setTimeout(() => {
            this.fetchApplyDetail(this.data.borrowId); // 重新获取数据
          }, 1000);
        } else {
          wx.showToast({
            title: res.data?.message || '操作失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('审核提交失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 返回按钮处理
  handlerGobackClick: function() {
    wx.navigateBack();
  },

  // 首页按钮处理
  handlerGohomeClick: function() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 页面分享
  onShareAppMessage: function() {
    return {
      title: '借物申请详情',
      path: '/pages/team_stuff_borrow_permit/team_stuff_borrow_permit?borrow_id=' + this.data.borrowId
    };
  }
});