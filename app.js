//app.js
// 导入根目录下config.js中的配置
var config=require("./config.js")
// 导入资源管理工具
const ResourceUtils = require('./utils/resources.js');

App({
  globalData: {
    auth: {  // 初始化 auth 对象
      showModal: false,
      session: null,
      config: config,
    },
    publicResources: null
  },
  async onLaunch() {
    console.log('[App] 配置全局API的url')
    // 将全局API的url配置保存到缓存中
    wx.setStorageSync('config', config)
    console.log('[App] 配置全局API的url成功')

    // 应用启动时加载公共资源
    console.log('[App] 加载全局资源')
    await this.loadPublicResources();
  },
  /**
   * 加载公共资源到全局
   */
  async loadPublicResources() {
    try {
      console.log('[App] 开始预加载公共资源');
      
      this.globalData.publicResources = await ResourceUtils.fetchPublicResources();
      this.globalData.resourcesLoaded = true;
      
      console.log('[App] 公共资源预加载成功:', this.globalData.publicResources);
      
    } catch (error) {
      console.error('[App] 公共资源预加载失败:', error);
      this.globalData.resourcesLoaded = false;
      
      // 可以在这里添加用户提示
      // wx.showToast({ title: '资源加载失败', icon: 'none' });
    }
  },

  /**
   * 获取全局资源（供页面调用）
   * @returns {Object|null}
   */
  getGlobalResources() {
    return this.globalData.publicResources;
  },

  /**
   * 刷新全局资源
   */
  async refreshGlobalResources() {
    console.log('[App] 刷新全局资源');
    await this.loadPublicResources();
  },
  /**
   * 清除本地令牌和用户信息
   */
  removeAuthToken: function() {
    wx.removeStorageSync(TOKEN_KEY);
    wx.removeStorageSync(USER_INFO_KEY);
  }
})