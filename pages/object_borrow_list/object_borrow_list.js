// pages/FieldApply/FieldApply.js
Page({
  data: {
    tab: 0, // 当前 tab 页索引
    sortText: '默认',
    currentSort: 'default',
    isFolded: true,

    unreviewedList: [
      {
        event_id: 1,
        event_name: '三架',
        start_str: '申请时间',
        start_time: '2025-05-20',
        type: '个人',
        poster: '/images/object_borrow_list/1.png'
      },
      {
        event_id: 2,
        event_name: '音响',
        start_str: '申请时间',
        start_time: '2025-05-18',
        type: '个人',
        poster: '/images/object_borrow_list/1.png'
      }
    ],
    approvedList: [
      {
        event_id: 3,
        event_name: '教室A',
        start_time: '2025-05-15',
        type: '部门',
        poster: '/images/object_borrow_list/1.png'
      }
    ],
    returnedList: [
      {
        event_id: 4,
        event_name: '摄影设备',
        start_time: '2025-05-12',
        type: '借用归还',
        poster: '/images/object_borrow_list/1.png'
      }
    ]
  },

  // 初始化不需要 currentList
  onLoad() {
    // 可以预排序每个列表（可选）
    this.sortCurrentList('unreviewedList');
    this.sortCurrentList('approvedList');
    this.sortCurrentList('returnedList');
  },

  // 切换 tab
  changeItem(e) {
    const index = parseInt(e.currentTarget.dataset.item);
    this.setData({ tab: index });
  },

  onSwiperChange(e) {
    this.setData({ tab: e.detail.current });
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

  toggleSortDropdown() {
    this.setData({ isFolded: !this.data.isFolded });
  },

  // 修改排序方式
  selectSort(e) {
    const value = e.currentTarget.dataset.value;
    const targetList = ['unreviewedList', 'approvedList', 'returnedList'][this.data.tab];
    this.setData({
      currentSort: value,
      sortText: value === 'default' ? '默认' : value === 'asc' ? '正序' : '逆序',
      isFolded: true
    }, () => this.sortCurrentList(targetList));
  },

  // 具体排序逻辑
  sortCurrentList(targetListName) {
    if (this.data.currentSort === 'default') return;

    const list = this.data[targetListName];
    const sorted = [...list].sort((a, b) =>
      this.data.currentSort === 'asc'
        ? a.start_time.localeCompare(b.start_time)
        : b.start_time.localeCompare(a.start_time)
    );

    this.setData({ [targetListName]: sorted });
  },

  // 添加记录
  addRecordToList(newRecord, targetListName = 'unreviewedList') {
    const oldList = this.data[targetListName];
    const updatedList = [...oldList, newRecord];
    this.setData({ [targetListName]: updatedList });
  },

  // 跳转到详情页
  navigateToDetail(e) {
    wx.navigateTo({
      url: `/pages/site_borrow_permit/site_borrow_permit?event_id=${e.currentTarget.dataset.eventId}`
    });
  }
});
