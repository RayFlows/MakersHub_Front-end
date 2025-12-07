const app = getApp();

// 从 storage 中读取 config 和 token
var config = wx.getStorageSync('config');
const token = wx.getStorageSync('auth_token');

Page({
  data: {
    projectList: [],   // 后端返回的全部项目
    filteredList: [],  // 当前 tab 下要展示的项目
    activeTab: 0       // 0: 待审核, 1: 进行中, 2: 已打回
  },

  onLoad() {
    console.log('[Project Permit List] config:', config);
    console.log('[Project Permit List] token:', token);
    this.getProjectList();
  },

  onShow() {
    console.log('[project_permit_list] onShow -> 刷新列表');
    // 返回列表页时刷新一下数据（例如详情页审核后返回）
    this.getProjectList();
  },

  /** 顶部 navBar 返回按钮 */
  handlerGobackClick() {
    wx.showModal({
      title: '提示',
      content: '确认返回上一页？',
      success: (e) => {
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

  /** 顶部 navBar 首页按钮 */
  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  /** 辅助函数：格式化时间 */
  formatTime(timeStr) {
    if (!timeStr) return '';
    // 1. 将所有的 '-' 替换为 '/' (解决 iOS 下 new Date() 的兼容性问题，同时也满足你的显示需求)
    let formatted = timeStr.replace(/-/g, '/');
    
    // 2. 去掉秒钟
    // 假设后端返回格式为 "YYYY-MM-DD HH:mm:ss" (19位)
    // 截取前 16 位即为 "YYYY/MM/DD HH:mm"
    if (formatted.length > 16) {
        formatted = formatted.substring(0, 16);
    }
    
    // 如果你只想显示日期 "YYYY/MM/DD" 而不显示具体时间，请使用下面这行代替上面那行：
    // formatted = formatted.substring(0, 10);

    return formatted;
  },

  /** 从后端获取审核列表 */
  getProjectList() {
    // 根据当前 config 结构，从 project 下取列表接口
    const url =
      config.project &&
      (config.project.review_list || config.project.project_review_list);

    console.log('[Project Permit List] 请求地址:', url);

    if (!url) {
      console.error('项目审核列表 URL 未配置，请检查 config.project');
      wx.showToast({
        title: '接口未配置',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('列表接口返回：', res);

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          let list = res.data.data || [];
          if (!Array.isArray(list)) list = [list];

          // --- 格式化时间字段 ---
          list = list.map(item => {
            // 处理 created_at 字段
            if (item.created_at) {
                item.created_at = this.formatTime(item.created_at);
            }
            
            return item;
          });
          // --- 【修改结束】 ---

          this.setData(
            {
              projectList: list
            },
            () => {
              this.filterList();
            }
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
    const filtered = (this.data.projectList || []).filter(
      (p) => p.state === state
    );
    this.setData({ filteredList: filtered });
  },

  /** 顶部 Tab 点击切换 */
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