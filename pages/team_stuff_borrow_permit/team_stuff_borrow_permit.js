var config = (wx.getStorageSync('config'));
const TOKEN_KEY = 'auth_token';

function parseDate(dateStr) {
  try {
    if (!dateStr) return { year: '----', month: '--', day: '--' };
    const clean = dateStr.split('.')[0];
    const date = new Date(clean);
    if (isNaN(date)) throw new Error('Invalid date');
    return {
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString().padStart(2, '0'),
      day: date.getDate().toString().padStart(2, '0')
    };
  } catch {
    return { year: '----', month: '--', day: '--' };
  }
}

Page({
  data: {
    borrowId: '',
    replyReason: '',
    loading: true,
    isLinkFocused: false,
    applyDetail: {},
    borrowTime: {},
    returnTime: {},
    materialsList: []
  },

  onLoad(options) {
    const borrowId = options?.borrow_id;
    if (!borrowId) {
      wx.showToast({ title: '缺少申请ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ borrowId }, () => this.loadDetail());
  },

  loadDetail() {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: config.stuff_borrow.detail + `/${this.data.borrowId}`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        const detail = res.data?.data;
        if (!detail || res.data.code !== 200) {
          wx.showToast({ title: res.data?.message || '获取失败', icon: 'none' });
          return;
        }

        const statusMap = {
          0: '未审核',
          1: '已打回',
          2: '已通过',
          3: '已归还'
        };

        const materialsList = Array.isArray(detail.stuff_list)
          ? detail.stuff_list.map((m, i) => ({ id: i, text: m.stuff || '未知物资' }))
          : Array.isArray(detail.materials)
            ? detail.materials.map((m, i) => ({ id: i, text: typeof m === 'string' ? m : JSON.stringify(m) }))
            : [];

        this.setData({
          applyDetail: {
            borrow_id: detail.sb_id || detail.borrow_id || '',
            task_name: detail.task_name || '',
            name: detail.name || '',
            student_id: detail.student_id || '',
            phone_num: detail.phone_num || '',
            email: detail.email || '',
            grade: detail.grade || '',
            major: detail.major || '',
            project_id: detail.project_num || detail.project_id || '',
            advisor_name: detail.mentor_name || detail.advisor_name || '',
            advisor_phone: detail.mentor_phone_num || detail.advisor_phone || '',
            content: detail.reason || detail.content || '',
            materials: detail.materials || [],
            created_at: detail.created_at || '',
            deadline: detail.deadline || '',
            status: detail.state ?? 0,
            status_desc: statusMap[detail.state ?? 0] || '未知状态',
            type: detail.type || 1
          },
          borrowTime: parseDate(detail.start_time),
          returnTime: parseDate(detail.deadline),
          materialsList,
          loading: false
        });
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  },

  onInput(e) {
    this.setData({ replyReason: e.detail.value });
  },

  onSubmit(e) {
    const action = e.currentTarget.dataset.action || '通过';
    const isApprove = action === 'approve' || action.indexOf('通过') !== -1;
    const isReject = action === 'reject' || action.indexOf('打回') !== -1;
  
    if (isReject && !this.data.replyReason.trim()) {
      wx.showToast({ title: '请输入打回理由', icon: 'none' });
      return;
    }
  
    wx.showModal({
      title: '确认操作',
      content: isApprove ? '确认通过此申请？物资余量将自动减少。' : '确认打回此申请？',
      success: res => {
        if (res.confirm) {
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
      reason: isApprove ? (this.data.replyReason || '审核通过') : this.data.replyReason
    };

    console.log('[submitReview] 提交原子性审核请求:', submitData);
    wx.showLoading({ title: '处理中...' });

    wx.request({
      url: config.stuff_borrow.review, // 只调用这一个统一的审核接口
      method: 'POST',
      data: submitData,
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        wx.hideLoading();
        console.log('[submitReview] 原子性审核响应:', res);

        // ---【核心修改】统一处理后端响应 ---
        if (res.statusCode === 200) {
          // --- 后端业务处理成功 (批准并扣减成功 / 打回成功) ---
          wx.showToast({
            title: res.data.message || '操作成功',
            icon: 'success',
            duration: 2000
          });
          // 成功后延时返回上一页
          setTimeout(() => wx.navigateBack(), 2000);

        } else {
          // --- 后端返回了业务错误（如400库存不足, 403权限问题等）---
          const errorMessage = res.data.detail || res.data.message || '操作失败，请稍后重试';
          console.error(`[submitReview] 审核失败: ${errorMessage}`);
          
          wx.showModal({
            title: '操作失败',
            content: errorMessage,
            showCancel: false // 只显示一个“确定”按钮，让用户知晓结果
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('[submitReview] 网络请求失败:', err);
        wx.showToast({ title: '网络错误，请检查您的网络连接', icon: 'none' });
      }
    });
  },

  
  handlerGohomeClick() {
    wx.reLaunch({
      url: '/pages/index/index'  // 替换成你的首页路径
    });
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
            url: config.stuff_borrow.return,
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
  
});
