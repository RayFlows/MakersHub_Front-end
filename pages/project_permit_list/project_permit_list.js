const config = require('../../config.js');

Page({
  data: {
    projectList: [],   // 原始列表
    filteredList: [],  // 当前 tab 下的过滤列表
    activeTab: 0       // 0 待审核, 1 进行中, 2 已打回
  },

  onLoad() {
    this.getProjectList();
  },

  /** 从后端获取审核列表 */
  getProjectList() {
    wx.request({
      url: config.project.project_review_list,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('auth_token') || ''),
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('列表接口返回：', res);

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          let rawList = res.data.data || [];
          if (!Array.isArray(rawList)) rawList = [rawList];

          // ✅ 这里给每个项目加上状态文案 + 状态样式类名
          const list = rawList.map(p => {
            let statusText = '待审核';
            let statusClass = 'status-pending';

            if (p.state === 1) {
              statusText = '进行中';
              statusClass = 'status-running';
            } else if (p.state === 2) {
              statusText = '已打回';
              statusClass = 'status-rejected';
            }

            return {
              ...p,
              statusText,
              statusClass
            };
          });

          this.setData(
            { projectList: list },
            () => this.filterList()
          );
        } else if (res.statusCode === 403) {
          wx.showToast({
            title: '没有权限访问该列表',
            icon: 'none'
          });
          console.error('403 详情：', res.data);
        } else {
          wx.showToast({
            title: `错误：${res.statusCode}`,
            icon: 'none'
          });
          console.error('接口错误：', res);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        console.error('请求失败：', err);
      }
    });
  },

  /** 根据当前 activeTab 过滤项目 */
  filterList() {
    const state = this.data.activeTab; // 0 / 1 / 2
    const filtered = this.data.projectList.filter(p => p.state === state);
    this.setData({ filteredList: filtered });
  },

  /** 切换顶部 Tab */
  onTabChange(e) {
    const tab = Number(e.currentTarget.dataset.tab);
    if (tab === this.data.activeTab) return;

    this.setData({ activeTab: tab }, () => {
      this.filterList();
    });
  },

  /** 跳转到项目审核详情页 */
  goDetail(e) {
    const id = e.currentTarget.dataset.id; // project_id
    if (!id) {
      wx.showToast({
        title: '缺少项目 ID',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/project_permit/project_permit?project_id=${id}`
    });
  }
});
