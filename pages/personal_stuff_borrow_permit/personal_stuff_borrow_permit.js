const API_BASE = 'https://mini.makershub.cn';
const TOKEN_KEY = 'auth_token';
//
Page({
  data: {
    isLinkFocused: false,
    loading: true,
    borrowId: '',
    replyReason: '',
    applyDetail: {
      borrow_id: '',
      name: '',
      student_id: '',
      phone_num: '',
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
      type: 0
    },
    borrowTime: { year: '', month: '', day: '' },
    returnTime: { year: '', month: '', day: '' },
    materialsList: []
  },

  onLoad(options) {
    console.log('[onLoad] 页面加载，接收到参数:', options);
    const borrowId = options.borrow_id;
    if (!borrowId) {
      wx.showToast({ title: '缺少申请ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ borrowId });
    console.log('[onLoad] 设置 borrowId 成功，开始加载详情');
    this.loadApplyDetail(borrowId);
  },
  
  
  onReturnClick() {
    const borrowId = this.data.borrowId;
  
    if (!borrowId || typeof borrowId !== 'string') {
      wx.showToast({ title: '申请ID无效', icon: 'none' });
      return;
    }
  
    wx.showModal({
      title: '确认归还',
      content: `确认申请 ${borrowId} 的物资已归还？`,
      success: res => {
        if (res.confirm) {
          this.returnStuff(borrowId);
        }
      }
    });
  },  
  returnStuff(borrowId) {
    console.log('[returnStuff] 开始处理归还请求');
    console.log('[returnStuff] 接收到的 borrowId:', borrowId, '类型:', typeof borrowId);
  
    // 验证 borrowId
    if (!borrowId || typeof borrowId !== 'string' || borrowId.trim() === '') {
      wx.showToast({ title: '申请ID无效', icon: 'none' });
      return;
    }
  
    const validBorrowId = borrowId.trim();
    console.log('[returnStuff] 验证通过的 borrowId:', validBorrowId);
  
    wx.showModal({
      title: '确认归还',
      content: `确认申请 ${validBorrowId} 的物资已归还？`,
      success: res => {
        if (res.confirm) {
          // 获取 token
          const token = wx.getStorageSync(TOKEN_KEY);
          console.log('[returnStuff] 确认后获取的 token:', token, '类型:', typeof token);
          
          if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            wx.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' });
            return;
          }
  
          // 发送请求
          wx.showLoading({ title: '处理中...' });
          
          wx.request({
            url: `${API_BASE}/stuff-borrow/return`,
            method: 'POST',
            data: {
              borrow_id: validBorrowId,
              return_notes: '物资已完好归还'
            },
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            success: res => {
              wx.hideLoading();
              console.log('[returnStuff] 服务器响应:', res);
  
              if (res.statusCode === 200) {
                wx.showToast({ title: '归还确认成功', icon: 'success' });
                setTimeout(() => {
                  wx.navigateBack(); // ✅ 自动跳转回上一个页面
                }, 1500);
              }
               else if (res.statusCode === 401) {
                wx.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' });
              } else {
                wx.showToast({ title: res.data?.message || '操作失败', icon: 'none' });
              }
            },
            fail: err => {
              wx.hideLoading();
              console.error('[returnStuff] 请求失败:', err);
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  },
  loadApplyDetail(borrowId) {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    console.log('[loadApplyDetail] 请求开始，borrowId:', borrowId);

    wx.request({
      url: `${API_BASE}/stuff-borrow/detail/${borrowId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        console.log('[loadApplyDetail] 请求成功:', res);
        if (res.data && res.data.code === 200) {
          this.processApplyDetail(res.data.data);
        } else {
          console.warn('[loadApplyDetail] 数据状态异常:', res.data);
          wx.showToast({
            title: res.data?.message || '获取详情失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('[loadApplyDetail] 网络请求失败:', err);
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
        console.log('[loadApplyDetail] 请求完成，loading 状态关闭');
      }
    });
  },

  processApplyDetail(detail) {
    console.log('[processApplyDetail] 处理申请详情数据:', detail);
    console.log('[processApplyDetail] 原始时间字段:', {
      start_time: detail.start_time,
      deadline: detail.deadline
    });
    let borrowTime = { year: '', month: '', day: '' };
    let returnTime = { year: '', month: '', day: '' };
    let materialsList = [];
    const statusDescMap = {
      0: '未审核',
      1: '已打回',
      2: '已通过',
      3: '已归还'
    };
    
    if (detail.start_time) {
      const parts = detail.start_time.split('T')[0].split('-');
      if (parts.length === 3) {
        borrowTime = {
          year: parts[0],
          month: parts[1],
          day: parts[2]
        };
        console.log('[processApplyDetail] 借用时间格式化:', borrowTime);
      }
    }
    

    if (detail.deadline) {
      const match = detail.deadline.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        returnTime = { year: match[1], month: match[2], day: match[3] };
        console.log('[processApplyDetail] 归还时间格式化:', returnTime);
      }
    }

    if (Array.isArray(detail.stuff_list)) {
      materialsList = detail.stuff_list.map((item, index) => ({
        id: index,
        text: item.stuff || '未知物资',
        quantity: item.quantity || 1
      }));
      console.log('[processApplyDetail] 使用 stuff_list 构造物资列表:', materialsList);
    }
    // 否则从 materials 回退
    else if (Array.isArray(detail.materials)) {
      materialsList = detail.materials.map((m, i) => ({
        id: i,
        text: typeof m === 'string' ? m : JSON.stringify(m),
        quantity: 1
      }));
      console.log('[processApplyDetail] 使用 materials 构造物资列表:', materialsList);
    }

    this.setData({
      applyDetail: {
        borrow_id: detail.sb_id || detail.borrow_id || '',
        name: detail.name || '',
        student_id: detail.student_id || '',
        phone_num: detail.phone_num || '',
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
        status: detail.state || 0,
        status_desc: statusDescMap[detail.state] || '未知状态',
        type: detail.type || 0
      },
      borrowTime,
      returnTime,
      materialsList
    });

    console.log('[processApplyDetail] 页面数据已更新');
  },

  onLinkFocused() {
    console.log('[onLinkFocused] 获得焦点');
    this.setData({ isLinkFocused: true });
  },

  onLinkBlur() {
    console.log('[onLinkBlur] 失去焦点');
    this.setData({ isLinkFocused: false });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    console.log('[onInput] 输入字段:', field, '值:', value);
    const updateData = {};
    updateData[field] = value;
    this.setData(updateData);
  },

  onSubmit(e) {
    const action = e.currentTarget.dataset.action || '通过';
    const isApprove = action === 'approve' || action.includes('通过');
    const isReject = action === 'reject' || action.includes('打回');

    console.log('[onSubmit] 操作类型:', action, '通过?', isApprove, '打回?', isReject);

    if (isReject && !this.data.replyReason.trim()) {
      wx.showToast({ title: '请输入打回理由', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认操作',
      content: isApprove ? '确认通过此申请？物资余量将自动减少。' : '确认打回此申请？',
      success: res => {
        if (res.confirm) {
          console.log('[onSubmit] 用户确认操作');
          this.submitReview(isApprove);
        }
      }
    });
  },

  submitReview(isApprove) {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const submitData = {
      borrow_id: this.data.borrowId,
      action: isApprove ? 'approve' : 'reject',
      reason: isApprove ? '' : this.data.replyReason
    };

    console.log('[submitReview] 提交数据:', submitData);

    wx.showLoading({ title: '处理中...' });

    wx.request({
      url: `${API_BASE}/stuff-borrow/review`,
      method: 'POST',
      data: submitData,
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        console.log('[submitReview] 审核响应:', res);
        if (res.statusCode === 200 || res.statusCode === 201) {
          if (isApprove) {
            // 如果是审核通过，自动更新物资余量
            console.log('[submitReview] 审核通过，开始更新物资余量');
            this.updateStuffQuantity();
          } else {
            wx.hideLoading();
            wx.showToast({
              title: '已打回',
              icon: 'success'
            });
            setTimeout(() => wx.navigateBack(), 1500);
          }
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.data?.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('[submitReview] 请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  updateStuffQuantity() {
    const token = wx.getStorageSync(TOKEN_KEY);
    console.log('[updateStuffQuantity] 开始更新物资余量');

    wx.request({
      url: `${API_BASE}/stuff-borrow/auto-update-quantity/${this.data.borrowId}`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        wx.hideLoading();
        console.log('[updateStuffQuantity] 更新物资余量响应:', res);
        
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          const updateData = res.data.data;
          console.log('[updateStuffQuantity] 更新结果:', updateData);
          
          let successMessage = '审核通过';
          
          if (updateData.failed_count > 0) {
            successMessage += `，${updateData.failed_count}个物资更新失败`;
            console.warn('[updateStuffQuantity] 部分物资更新失败:', updateData.failed_updates);
          }
          
          wx.showToast({
            title: successMessage,
            icon: updateData.failed_count > 0 ? 'none' : 'success',
            duration: 2000
          });
          
          // 显示详细更新信息
          if (updateData.updated_stuff && updateData.updated_stuff.length > 0) {
            setTimeout(() => {
              let detailMessage = '物资余量更新详情:\n';
              updateData.updated_stuff.forEach(item => {
                detailMessage += `${item.stuff_name}: ${item.old_remain} → ${item.new_remain}\n`;
              });
              
              wx.showModal({
                title: '更新详情',
                content: detailMessage,
                showCancel: false,
                success: () => {
                  wx.navigateBack();
                }
              });
            }, 2000);
          } else {
            setTimeout(() => wx.navigateBack(), 2000);
          }
          
        } else {
          console.error('[updateStuffQuantity] 更新物资余量失败:', res.data);
          wx.showModal({
            title: '提示',
            content: '审核通过，但物资余量更新失败。请手动检查物资库存。',
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('[updateStuffQuantity] 更新物资余量请求失败:', err);
        wx.showModal({
          title: '提示',
          content: '审核通过，但物资余量更新失败。请手动检查物资库存。',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      }
    });
  },

  handlerGobackClick() {
    console.log('[handlerGobackClick] 返回按钮被点击');
    wx.navigateBack({
      delta: 1,
      fail: () => {
        console.warn('[handlerGobackClick] navigateBack 失败，尝试跳转首页');
        wx.switchTab({
          url: '/pages/base_management_work_page/base_management_work_page',
          fail: () => {
            wx.navigateTo({ url: '/pages/index/index' });
          }
        });
      }
    });
  },

  handlerGohomeClick() {
    console.log('[handlerGohomeClick] 回到首页按钮被点击');
    wx.switchTab({
      url: '/pages/index/index',
      fail: () => {
        wx.navigateTo({
          url: '/pages/index/index',
          fail: () => {
            wx.showToast({ title: '跳转失败', icon: 'none' });
          }
        });
      }
    });
  },

  onPullDownRefresh() {
    console.log('[onPullDownRefresh] 下拉刷新触发');
    this.loadApplyDetail(this.data.borrowId);
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1500);
  }
});