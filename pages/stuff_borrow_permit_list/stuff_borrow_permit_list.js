var config = (wx.getStorageSync('config'));
const TOKEN_KEY = 'auth_token';
const app = getApp()

Page({
  data: {
    unreviewedList: [],
    approvedList: [],
    returnedList: [],
    loading: false,
    currentSort: 'default',
    sortText: '默认',
    isFolded: true,
    tab: 0,
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
      borrowed: 0,
      returned: 0,
      rejected: 0,
      overdue: 0
    },
    icons: {}
  },

  onLoad() {
    this.loadIcons();
    this.loadBorrowApplies();
  },

  onShow() {
    this.loadBorrowApplies();
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

  loadBorrowApplies() {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: config.stuff_borrow.view_all,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log("——————————————————————",res.data);
        if (res.data && res.data.code === 200) {
          const records = res.data.data.records || [];
          const stats = { total: res.data.data.total || records.length };
          this.processBorrowData(records, stats);
        } else {
          wx.showToast({ title: res.data.message || '数据错误', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  processBorrowData(borrowList, stats) {
    const unreviewedList = [], approvedList = [], returnedList = [], rejectedList = [], overdueList = [];

    const statusPosterMap = {
      0: '/images/object_borrow_list/pending.png',
      1: '/images/object_borrow_list/approved.png',
      2: '/images/object_borrow_list/borrowed.png',
      3: '/images/object_borrow_list/returned.png',
    };

    borrowList.forEach(item => {
      const record = {
        event_id: item.sb_id || '',
        event_name: item.task_name || '未命名申请',
        name: item.name || '未知申请人',
        start_str: '申请时间',
        start_time: item.start_time ? item.start_time.split('T')[0] : '未知时间',
        deadline: item.deadline ? item.deadline.split('T')[0] : '未设置',
        type: item.type === 1 ? '团队' : '个人',
        originalType: item.type,
        status: item.state,
        status_desc: this.mapStateToText(item.state),
        materials_count: item.materials ? item.materials.length : 0,
        materials_summary: '未知',
        phone: item.phone || '',
        email: item.email || '',
        grade: item.grade || '',
        major: item.major || '',
        poster: statusPosterMap[item.state] || '/images/object_borrow_list/1.png',
        project_number: item.project_number || '',
        supervisor_name: item.supervisor_name || '',
        supervisor_phone: item.supervisor_phone || ''
      };

      switch (item.state) {
        case 0: unreviewedList.push(record); break;
        case 1: rejectedList.push(record); break;
        case 2: approvedList.push(record); break;
        case 3: returnedList.push(record); break;
        default: console.warn('未知状态:', item.state);
      }
    });

    this.setData({
      unreviewedList,
      approvedList,
      returnedList,
      stats: stats || this.data.stats
    });

    this.sortAllLists();
  },

  mapStateToText(state) {
    switch (state) {
      case 0: return '待审批';
      case 1: return '已打回';
      case 2: return '已借出';
      case 3: return '已归还';
      default: return '未知状态';
    }
  },

  sortAllLists() {
    this.sortCurrentList('unreviewedList');
    this.sortCurrentList('approvedList');
    this.sortCurrentList('returnedList');
  },

  sortCurrentList(targetListName) {
    if (this.data.currentSort === 'default') return;
    const list = this.data[targetListName];
    if (!list || list.length === 0) return;

    const sorted = list.slice().sort((a, b) => {
      if (this.data.currentSort === 'asc') {
        return a.start_time.localeCompare(b.start_time);
      } else {
        return b.start_time.localeCompare(a.start_time);
      }
    });

    this.setData({ [targetListName]: sorted });
  },

  changeItem(e) {
    this.setData({ tab: parseInt(e.currentTarget.dataset.item) });
  },

  onSwiperChange(e) {
    this.setData({ tab: e.detail.current });
  },

  toggleSortDropdown() {
    this.setData({ isFolded: !this.data.isFolded });
  },

  selectSort(e) {
    const value = e.currentTarget.dataset.value;
    const targetList = ['unreviewedList', 'approvedList', 'returnedList'][this.data.tab];

    this.setData({
      currentSort: value,
      sortText: value === 'default' ? '默认' : value === 'asc' ? '正序' : '逆序',
      isFolded: true
    }, () => {
      this.sortCurrentList(targetList);
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
                setTimeout(() => this.loadBorrowApplies(), 1500);
              } else if (res.statusCode === 401) {
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
  // 独立的请求执行函数
  performReturnRequest(borrowId, token) {
    wx.showLoading({ title: '处理中...' });
  
    // 详细检查 token
    console.log('[performReturnRequest] 原始 token:', token);
    console.log('[performReturnRequest] token 类型:', typeof token);
    console.log('[performReturnRequest] token 是否为空:', !token);
    
    if (!token || token === 'undefined' || token === 'null') {
      wx.hideLoading();
      wx.showToast({ title: 'Token 无效', icon: 'none' });
      return;
    }
  
    // 构造 Authorization 头部
    const authHeader = `Bearer ${token}`;
    console.log('[performReturnRequest] Authorization 头部:', authHeader);
  
    // 构造请求数据
    const requestData = {
      borrow_id: borrowId,
      return_notes: '物资已完好归还'
    };
  
    console.log('[performReturnRequest] 最终发送的数据:', requestData);
    console.log('[performReturnRequest] 请求头部:', {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    });
  
    wx.request({
      url: config.stuff_borrow.return,
      method: 'POST',
      data: requestData,
      header: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      success: res => {
        wx.hideLoading();
        console.log('[performReturnRequest] 服务器响应:', res);
  
        if (res.statusCode === 200) {
          wx.showToast({
            title: '归还确认成功',
            icon: 'success'
          });
          setTimeout(() => {
            this.loadBorrowApplies();
          }, 1500);
        } else if (res.statusCode === 401) {
          wx.showToast({
            title: '登录状态已失效，请重新登录',
            icon: 'none'
          });
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/login' });
          }, 2000);
        } else {
          console.error('[performReturnRequest] 服务器返回错误:', res.data);
          wx.showToast({
            title: res.data?.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('[performReturnRequest] 请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },
  // 重写的点击事件处理 - 使用索引方式
  // 修改 onReturnClick 函数，针对审核通过列表
  onReturnClick(e) {
    console.log('[onReturnClick] 事件对象:', e);
    
    // 获取列表索引
    const index = e.currentTarget.dataset.index;
    console.log('[onReturnClick] 获取到的索引:', index);

    if (index === undefined || index === null) {
      wx.showToast({ title: '无法获取申请信息', icon: 'none' });
      return;
    }

    // 因为归还按钮只在审核通过 tab 中，所以直接使用 approvedList
    const targetList = this.data.approvedList;

    if (!targetList || !targetList[index]) {
      wx.showToast({ title: '申请数据不存在', icon: 'none' });
      return;
    }

    const borrowItem = targetList[index];
    const borrowId = borrowItem.event_id;

    console.log('[onReturnClick] 从 approvedList 中获取的申请数据:', borrowItem);
    console.log('[onReturnClick] 提取的 borrowId:', borrowId);

    if (!borrowId || typeof borrowId !== 'string') {
      console.error('[onReturnClick] borrowId 无效:', borrowId);
      wx.showToast({ title: '申请ID无效', icon: 'none' });
      return;
    }

    this.returnStuff(borrowId);
  },

  handlerGobackClick() {
    wx.showModal({
      title: '你点击了返回',
      content: '是否确认返回',
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
  },

  navigateToDetail(e) {
    const dataset = e.currentTarget.dataset || {};
    const borrowId = dataset.eventId || dataset.eventid || dataset['event-id'];
    const originalType = dataset.originalType || dataset.originaltype || dataset['original-type'];

    if (!borrowId) {
      wx.showToast({ title: '缺少申请ID', icon: 'none' });
      return;
    }

    let url = originalType === 1 || originalType === '1'
      ? `/pages/team_stuff_borrow_permit/team_stuff_borrow_permit?borrow_id=${borrowId}`
      : `/pages/personal_stuff_borrow_permit/personal_stuff_borrow_permit?borrow_id=${borrowId}`;

    wx.navigateTo({
      url,
      fail: () => {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onPullDownRefresh() {
    this.loadBorrowApplies();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1500);
  }
});