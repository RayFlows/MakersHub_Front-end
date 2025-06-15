// pages/activity_list/activity_list.js
const config = {
  list: 'http://example.com/api/events' // TODO: 替换为真实接口地址
};

// 模拟 util.js 中的安全导入
const UtilJS = {
  // 如果你之前有 formatDate 工具函数，也可以从 util.js 引入
  formatDate: function (timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
};

Page({
  data: {
    events: [],
    items: [],
    posters: [],
    sortText: '默认',
    currentSort: 'default',
    isFolded: true
  },

  onLoad: function (options) {
    this.loadEvents();
  },

  handlerGobackClick() {
    wx.showModal({
      title: '你点击了返回',
      content: '是否确认放回',
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
    this.setData({
      isFolded: !this.data.isFolded
    });
  },

  selectSort(e) {
    const value = e.currentTarget.dataset.value;
    let sortText = '默认';
    if (value === 'asc') sortText = '正序';
    if (value === 'desc') sortText = '逆序';

    this.setData({
      currentSort: value,
      sortText,
      isFolded: true
    });

    this.doSort(value);
  },

  doSort(mode) {
    let sortedItems = [...this.data.items];

    switch (mode) {
      case 'asc':
        sortedItems.sort((a, b) =>
          new Date(a.start_time.replace(/-/g, '/')) -
          new Date(b.start_time.replace(/-/g, '/'))
        );
        break;
      case 'desc':
        sortedItems.sort((a, b) =>
          new Date(b.start_time.replace(/-/g, '/')) -
          new Date(a.start_time.replace(/-/g, '/'))
        );
        break;
      case 'default':
        sortedItems.sort((a, b) => a.event_id - b.event_id);
        break;
    }

    this.setData({ items: sortedItems });
  },

  navigateToDetail(e) {
    const event_id = e.currentTarget.dataset.eventId;
    if (!event_id) {
      wx.showToast({ title: '活动参数错误', icon: 'error' });
      return;
    }
    wx.navigateTo({
      url: `/pages/activitydetail/activitydetail?event_id=${event_id}`
    });
  },

  loadEvents() {
    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: config.list,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const formatted = res.data.map(item => ({
            ...item,
            start_time: UtilJS.formatDate(item.start_time),
            end_time: UtilJS.formatDate(item.end_time),
            registration_deadline: UtilJS.formatDate(item.registration_deadline)
          }));

          this.setData({
            events: formatted,
            items: formatted,
            posters: formatted.slice(0, 3).map(item => ({
              id: item.event_id,
              image: item.poster
            }))
          });
        } else {
          wx.showToast({ title: '数据格式错误', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});
