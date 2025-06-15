// pages/FieldApply/FieldApply.js
const API_BASE = 'http://146.56.227.73:8000'
const TOKEN_KEY = 'auth_token'

Page({
  data: {
    tab: 0, // 当前 tab 页索引
    sortText: '默认',
    currentSort: 'default',
    isFolded: true,
    loading: false, // 加载状态

    unreviewedList: [], // 未审核列表（状态0）
    approvedList: [],   // 审核通过列表（状态1和2）
    returnedList: [],   // 已归还列表（状态3）
    
    // 统计信息
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
      borrowed: 0,
      returned: 0,
      rejected: 0,
      overdue: 0
    }
  },

  /**
   * 页面加载时执行
   */
  onLoad() {
    console.log('页面加载，开始获取借物申请数据');
    this.loadBorrowApplies();
  },

  /**
   * 页面显示时刷新数据
   */
  onShow() {
    const hasData = this.data.unreviewedList.length > 0 || 
                    this.data.approvedList.length > 0 || 
                    this.data.returnedList.length > 0;
    
    if (hasData) {
      console.log('页面显示，刷新数据');
      this.loadBorrowApplies();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({ loading: true });
    this.loadBorrowApplies();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1500);
  },

  /**
   * 获取所有借物申请数据
   */
  loadBorrowApplies() {
    const token = wx.getStorageSync(TOKEN_KEY);
    
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: `${API_BASE}/borrow/my-applies`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (response) => {
        console.log('请求成功:', response);
        if (response.data && response.data.status === 'ok') {
          console.log('获取借物申请成功:', response.data);
          this.processBorrowData(response.data.data, response.data.stats);
        } else {
          console.error('返回数据格式错误:', response.data);
          wx.showToast({
            title: response.data.message || '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('获取借物申请失败:', error);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  /**
   * 处理借物申请数据，按状态分类
   */
  processBorrowData(borrowList, stats) {
    console.log('开始处理借物申请数据:', borrowList);
    
    if (!borrowList || !Array.isArray(borrowList)) {
      console.error('borrowList 不是数组:', borrowList);
      return;
    }

    const unreviewedList = []; // 状态0：待审批
    const approvedList = [];   // 状态1,2：已批准、已借出
    const returnedList = [];   // 状态3：已归还
    const rejectedList = [];   // 状态4：已拒绝（可选显示）
    const overdueList = [];    // 状态5：已过期（可选显示）

    // 🔥 直接在 forEach 内部格式化数据，避免任何函数调用问题
    borrowList.forEach(item => {
      console.log("处理项目:", item);
      
      // ===== 直接在这里格式化数据，不调用任何函数 =====
      if (!item) {
        console.error('item 为空');
        return;
      }

      // 获取申请类型 - 保存原始type值用于跳转判断
      let typeText = item.type === 1 ? '团队' : '个人';
      let originalType = item.type; // 保存原始type值

      // 获取物品摘要
      let materials_summary = '无物品';
      if (item.materials && Array.isArray(item.materials) && item.materials.length > 0) {
        const first = typeof item.materials[0] === 'string' 
          ? item.materials[0] 
          : JSON.stringify(item.materials[0]);
        if (item.materials.length === 1) {
          materials_summary = first;
        } else {
          materials_summary = `${first}等${item.materials.length}项`;
        }
      }

      // 获取状态图标
      const statusPosterMap = {
        0: '/images/object_borrow_list/pending.png',
        1: '/images/object_borrow_list/approved.png',
        2: '/images/object_borrow_list/borrowed.png',
        3: '/images/object_borrow_list/returned.png',
        4: '/images/object_borrow_list/rejected.png',
        5: '/images/object_borrow_list/overdue.png'
      };
      const poster = statusPosterMap[item.status] || '/images/object_borrow_list/1.png';

      // 直接创建记录对象
      const record = {
        event_id: item.borrow_id || '',
        event_name: item.task_name || '未命名申请',
        start_str: '申请时间',
        start_time: item.created_at ? item.created_at.split('T')[0] : '未知时间',
        deadline: item.deadline ? item.deadline.split('T')[0] : '未设置',
        type: typeText, // 显示用的文本
        originalType: originalType, // 保存原始type值用于跳转判断
        status: item.status || 0,
        status_desc: item.status_desc || '未知状态',
        materials_count: item.materials ? item.materials.length : 0,
        materials_summary: materials_summary,
        phone: item.phone || '',
        email: item.email || '',
        grade: item.grade || '',
        major: item.major || '',
        poster: poster,
        project_number: item.project_number || '',
        supervisor_name: item.supervisor_name || '',
        supervisor_phone: item.supervisor_phone || ''
      };

      console.log("✅ 直接创建的记录:", record);
      
      // 根据状态分类
      if (record) {
        switch (item.status) {
          case 0: // 待审批
            unreviewedList.push(record);
            console.log("✅ 添加到未审核列表:", record);
            break;
          case 1: // 已批准
          case 2: // 已借出
            approvedList.push(record);
            console.log("✅ 添加到审核通过列表:", record);
            break;
          case 3: // 已归还
            returnedList.push(record);
            console.log("✅ 添加到已归还列表:", record);
            break;
          case 4: // 已拒绝
            rejectedList.push(record);
            break;
          case 5: // 已过期
            overdueList.push(record);
            break;
          default:
            console.warn('未知状态:', item.status);
        }
      }
    });

    // 更新数据
    this.setData({
      unreviewedList,
      approvedList,
      returnedList,
      stats: stats || this.data.stats
    });

    console.log('数据分类完成:', {
      未审核: unreviewedList.length,
      审核通过: approvedList.length,
      已归还: returnedList.length,
      已拒绝: rejectedList.length,
      已过期: overdueList.length
    });

    console.log('最终的 unreviewedList:', unreviewedList);
    console.log('最终的 approvedList:', approvedList);
    console.log('最终的 returnedList:', returnedList);

    // 根据当前排序方式排序
    this.sortAllLists();
  },

  /**
   * 排序所有列表
   */
  sortAllLists() {
    this.sortCurrentList('unreviewedList');
    this.sortCurrentList('approvedList');
    this.sortCurrentList('returnedList');
  },

  /**
   * 具体排序逻辑
   */
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

  /**
   * 手动刷新数据
   */
  onRefresh() {
    console.log('手动刷新数据');
    this.loadBorrowApplies();
  },

  /**
   * 切换 tab
   */
  changeItem(e) {
    const index = parseInt(e.currentTarget.dataset.item);
    this.setData({ tab: index });
  },

  /**
   * Swiper 切换事件
   */
  onSwiperChange(e) {
    this.setData({ tab: e.detail.current });
  },

  /**
   * 返回按钮点击事件
   */
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

  /**
   * 回到首页
   */
  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  /**
   * 切换排序下拉菜单
   */
  toggleSortDropdown() {
    this.setData({ isFolded: !this.data.isFolded });
  },

  /**
   * 选择排序方式
   */
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

  /**
   * 添加记录到指定列表
   */
  addRecordToList(newRecord, targetListName = 'unreviewedList') {
    const oldList = this.data[targetListName];
    const updatedList = oldList.concat([newRecord]);
    this.setData({ [targetListName]: updatedList });
  },

  /**
   * 跳转到详情页 - 修复后的版本，增加了错误处理和调试信息
   */
  navigateToDetail(e) {
    console.log('===== navigateToDetail 开始 =====');
    console.log('事件对象 e:', e);
    
    // 安全地获取 dataset
    let dataset;
    console.log("_______________________________________________________")
    console.log("e",e);
    console.log("e.currentTarget",e.currentTarget);
    console.log("e.currentTarget.dataset",e.currentTarget.dataset);
    if (e && e.currentTarget && e.currentTarget.dataset) {
      dataset = e.currentTarget.dataset;
    } else if (e && e.target && e.target.dataset) {
      dataset = e.target.dataset;
    } else {
      console.error('无法获取 dataset:', e);
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
      return;
    }
    
    console.log('获取到的 dataset:', dataset);
    
    // 获取参数，支持多种命名方式
    const borrowId = dataset.eventId || dataset.eventid || dataset['event-id'];
    const originalType = dataset.originalType || dataset.originaltype || dataset['original-type'];
    
    console.log('解析后的参数:', { borrowId, originalType });
    
    if (!borrowId) {
      console.error('缺少申请ID:', dataset);
      wx.showToast({
        title: '缺少申请ID',
        icon: 'none'
      });
      return;
    }
    
    // 根据原始类型判断跳转到哪个页面
    let targetUrl = '';
    let targetPageType = '';
    console.log('++++++++++++++++++++++++++++++++++++++++');
    if (originalType === 1 || originalType === '1') {
      // 团队借物 - 跳转到团队借物申请清单
      console.log("teamBorrowId:",borrowId)
      targetUrl = `/pages/team_stuff_borrow_permit/team_stuff_borrow_permit?borrow_id=${borrowId}`;
      targetPageType = '团队借物';
    } else {
      // 个人借物 - 跳转到个人借物申请清单
      targetUrl = `/pages/personal_stuff_borrow_permit/personal_stuff_borrow_permit?borrow_id=${borrowId}`;
      targetPageType = '个人借物';
    }
    
    console.log(`准备跳转到${targetPageType}页面:`, targetUrl);
    
    wx.navigateTo({
      url: targetUrl,
      success: () => {
        console.log(`✅ 成功跳转到${targetPageType}页面`);
      },
      fail: (error) => {
        console.error(`❌ ${targetPageType}页面跳转失败:`, error);
        
        // 如果是团队页面跳转失败，尝试跳转到个人页面作为备选
        if (originalType === 1 || originalType === '1') {
          console.log('团队页面跳转失败，尝试跳转到个人页面...');
          const fallbackUrl = `/pages/personal_stuff_borrow_permit/personal_stuff_borrow_permit?borrow_id=${borrowId}`;
          wx.navigateTo({
            url: fallbackUrl,
            success: () => {
              console.log('✅ 备选跳转成功');
              wx.showToast({
                title: '已使用备选页面',
                icon: 'none'
              });
            },
            fail: (fallbackError) => {
              console.error('❌ 备选跳转也失败:', fallbackError);
              wx.showToast({
                title: '页面跳转失败',
                icon: 'none'
              });
            }
          });
        } else {
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      }
    });
    
    console.log('===== navigateToDetail 结束 =====');
  },

  /**
   * 跳转到新建申请页面
   */
  navigateToNewApply() {
    wx.navigateTo({
      url: '/pages/personal_stuff_borrow/personal_stuff_borrow'
    });
  },

  /**
   * 获取指定状态的申请
   */
  loadAppliesByStatus(status, callback) {
    const token = wx.getStorageSync(TOKEN_KEY);
    
    wx.request({
      url: `${API_BASE}/borrow/borrow-ids/by-status/${status}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (response) => {
        if (response.data && response.data.status === 'ok') {
          console.log(`获取状态${status}的申请成功:`, response.data);
          if (callback && typeof callback === 'function') {
            callback(null, response.data.data);
          }
        } else {
          const error = new Error(response.data.message || '获取失败');
          if (callback && typeof callback === 'function') {
            callback(error, null);
          }
        }
      },
      fail: (error) => {
        console.error(`获取状态${status}的申请失败:`, error);
        if (callback && typeof callback === 'function') {
          callback(error, null);
        }
      }
    });
  },

  /**
   * 显示统计信息
   */
  showStats() {
    const stats = this.data.stats;
    const message = `总申请数: ${stats.total}\n` +
                   `待审批: ${stats.pending}\n` +
                   `已批准: ${stats.approved}\n` +
                   `已借出: ${stats.borrowed}\n` +
                   `已归还: ${stats.returned}\n` +
                   `已拒绝: ${stats.rejected}\n` +
                   `已过期: ${stats.overdue}`;
    
    wx.showModal({
      title: '申请统计',
      content: message,
      showCancel: false
    });
  },

  /**
   * 获取借物申请详情
   */
  getBorrowApplyDetail(borrowId, callback) {
    const token = wx.getStorageSync(TOKEN_KEY);
    
    wx.request({
      url: `${API_BASE}/borrow/applies/${borrowId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (response) => {
        if (response.data && response.data.status === 'ok') {
          console.log('申请详情:', response.data.data);
          if (callback && typeof callback === 'function') {
            callback(null, response.data.data);
          }
        } else {
          const error = new Error(response.data.message || '获取详情失败');
          if (callback && typeof callback === 'function') {
            callback(error, null);
          }
        }
      },
      fail: (error) => {
        console.error('获取详情失败:', error);
        if (callback && typeof callback === 'function') {
          callback(error, null);
        }
      }
    });
  },

  /**
   * 使用详情获取示例
   */
  handleGetDetail(borrowId) {
    this.getBorrowApplyDetail(borrowId, (error, data) => {
      if (error) {
        console.error('获取详情失败:', error);
        wx.showToast({
          title: '获取详情失败',
          icon: 'none'
        });
      } else {
        console.log('详情数据:', data);
        // 处理详情数据
      }
    });
  },

  /**
   * 测试连接
   */
  testConnection() {
    wx.request({
      url: `${API_BASE}/borrow/test`,
      method: 'GET',
      success: (response) => {
        console.log('测试连接成功:', response.data);
        wx.showToast({
          title: '连接正常',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('测试连接失败:', error);
        wx.showToast({
          title: '连接失败',
          icon: 'none'
        });
      }
    });
  }
});