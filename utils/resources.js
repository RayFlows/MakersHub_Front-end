// utils/resources.js

/**
 * 资源管理工具类
 * 负责获取、缓存和管理所有公共资源（从 MinIO 获取 icons）
 */
const ResourceUtils = {
  // 缓存键名
  RESOURCE_CACHE_KEY: 'public_resources',
  RESOURCE_VERSION_KEY: 'resource_version',
  RESOURCE_HASH_KEY: 'resource_hash', // 新增：资源列表哈希值
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时缓存有效期
  FORCE_CHECK_INTERVAL: 2 * 60 * 60 * 1000, // 2小时强制检查一次

  // 所有需要加载的资源文件列表
  RESOURCE_FILES: {
    // 底部导航图标
    whiteCat: 'white_cat.svg',
    blackCat: 'cat_black.svg',
    // 卡片猫咪图标
    catPattern: 'cat_pattern.svg',
    // 背景图
    catBackground: 'cat_background.png',
    // 上传相关
    upload: 'upload.svg',
    // 复制图标
    grayCopy: 'gray_copy.svg',
    whiteCopy: 'white_copy.svg',
    // 日历图标
    grayCalendar: 'gray_calendar.svg',
    whiteCalendar: 'white_calendar.svg',
    // 工具图标
    broom: 'broom.svg',
    spanner: 'spanner.svg',
    badge: 'badge.svg',
    remote: 'remote.svg',
    // 房子图标
    grayHouse: 'gray_house.svg',
    whiteHouse: 'white_house.svg',
    // 箭头图标
    blackArrow: 'icon_arrow_chevron-right_black.svg',
    whiteArrow: 'icon_arrow_chevron-right_white.svg',
    // 取消图标
    cancel: 'cancel.svg',
    // 搜索图标
    find: 'find.svg',
    // 分隔图标
    circuitSplit: 'circuit_split.svg',
    separate: 'separate.svg',
    // 编辑图标
    greenEdit: 'green_edit.svg',
    whiteEdit: 'white_edit.svg',
    // 首页图标
    peoples: 'peoples.svg',
    activity: 'activity.svg',
    project: 'project.svg',
    lookup: 'lookup.svg',
    catIconChosen: 'cat_icon_chosen.svg',
    catIconUnchosen: 'cat_icon_unchosen.svg',
    meChosen: 'me_chosen.svg',
    meUnchosen: 'me_unchosen.svg',
    // 个人页面图标
    phone: 'phone.svg',
    puzzle: 'puzzle.svg',
    // 部门工作图标
    monitor: 'monitor.svg',
    web: 'web.svg',
    printer: 'printer.svg',
    grayTask: 'gray_task.svg',
    whiteTask: 'white_task.svg',
    pencilNote: 'pencil_note.svg',
    inspect: 'inspect.svg',
    ticket: 'ticket.svg',
    arrange: 'arrange.svg',
    history: 'history.svg',
    checklist: 'checklist.svg',
    pushDoor: 'push_door.svg'
  },

  /**
   * 生成资源列表的哈希值（用于检测配置变更）
   * @returns {string}
   */
  generateResourceHash() {
    const fileList = Object.values(this.RESOURCE_FILES).sort().join('|');
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < fileList.length; i++) {
      const char = fileList.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  },

  /**
   * 检查资源列表是否发生变化
   * @returns {boolean}
   */
  hasResourceListChanged() {
    const currentHash = this.generateResourceHash();
    const cachedHash = wx.getStorageSync(this.RESOURCE_HASH_KEY);
    
    if (!cachedHash) {
      return true; // 首次使用，视为变化
    }
    
    return currentHash !== cachedHash;
  },

  /**
   * 获取所有公共资源
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 返回资源对象，键为资源名，值为完整 URL
   */
  async fetchPublicResources(forceRefresh = false) {
    try {
      console.log('[Resource] 开始获取公共资源');

      // 1. 检查资源列表是否变化
      if (this.hasResourceListChanged()) {
        console.log('[Resource] 检测到资源列表变化，清除旧缓存');
        this.clearCache();
      }

      // 2. 检查是否需要强制刷新
      if (forceRefresh || this.shouldForceCheck()) {
        console.log('[Resource] 执行强制检查');
        const resources = await this.buildResourceUrls();
        this.saveToCache(resources);
        return resources;
      }

      // 3. 先检查缓存
      const cachedResources = this.getCachedResources();
      if (cachedResources) {
        console.log('[Resource] 使用缓存的资源');
        // 后台异步验证资源可用性（可选优化）
        this.validateResourcesInBackground(cachedResources);
        return cachedResources;
      }

      // 4. 缓存不存在或已过期，构建资源 URL
      const resources = await this.buildResourceUrls();

      // 5. 保存到缓存
      this.saveToCache(resources);
      console.log('[Resource] 公共资源获取并缓存成功');
      
      return resources;
    } catch (error) {
      console.error('[Resource] 获取公共资源失败:', error);
      
      // 失败时尝试返回过期的缓存（降级策略）
      const expiredCache = wx.getStorageSync(this.RESOURCE_CACHE_KEY);
      if (expiredCache && expiredCache.resources) {
        console.warn('[Resource] 使用过期缓存作为降级方案');
        return expiredCache.resources;
      }
      
      throw error;
    }
  },

  /**
   * 判断是否需要强制检查（即使缓存未过期）
   * @returns {boolean}
   */
  shouldForceCheck() {
    const lastCheckTime = wx.getStorageSync(this.RESOURCE_VERSION_KEY);
    if (!lastCheckTime) {
      return true;
    }
    
    const now = Date.now();
    return (now - lastCheckTime) > this.FORCE_CHECK_INTERVAL;
  },

  /**
   * 后台异步验证资源可用性（可选）
   * @param {Object} resources
   */
  validateResourcesInBackground(resources) {
    // 随机抽查几个资源是否可访问
    const sampleKeys = Object.keys(resources).slice(0, 3);
    
    sampleKeys.forEach(key => {
      wx.getImageInfo({
        src: resources[key],
        fail: (err) => {
          console.warn(`[Resource] 资源验证失败: ${key}, 可能已更新`, err);
          // 标记需要刷新
          wx.setStorageSync('resource_needs_refresh', true);
        }
      });
    });
  },

  /**
   * 构建所有资源的完整 URL
   * @returns {Promise<Object>}
   */
  async buildResourceUrls() {
    return new Promise((resolve, reject) => {
      // 从全局配置中获取 MinIO 基础 URL
      const config = wx.getStorageSync('config');
      if (!config || !config.public_resources) {
        reject(new Error('public_resources 配置信息不存在'));
        return;
      }

      const baseUrl = config.public_resources;
      // 确保 baseUrl 末尾有斜杠
      const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      // 构建资源对象，添加时间戳防止缓存
      const resources = {};
      const timestamp = Date.now();
      
      for (const [key, filename] of Object.entries(this.RESOURCE_FILES)) {
        resources[key] = `${normalizedBaseUrl}${filename}?t=${timestamp}`;
      }

      console.log('[Resource] 资源 URL 构建完成:', resources);
      resolve(resources);
    });
  },

  /**
   * 获取缓存的资源（如果有效）
   * @returns {Object|null}
   */
  getCachedResources() {
    const cacheData = wx.getStorageSync(this.RESOURCE_CACHE_KEY);
    if (!cacheData || !cacheData.resources) {
      return null;
    }

    // 检查是否有标记需要刷新
    const needsRefresh = wx.getStorageSync('resource_needs_refresh');
    if (needsRefresh) {
      console.log('[Resource] 检测到刷新标记，清除缓存');
      wx.removeStorageSync('resource_needs_refresh');
      return null;
    }

    // 检查缓存是否过期
    if (!this.isCacheValid()) {
      console.log('[Resource] 缓存已过期');
      return null;
    }

    return cacheData.resources;
  },

  /**
   * 检查缓存是否有效
   * @returns {boolean}
   */
  isCacheValid() {
    const cacheTime = wx.getStorageSync(this.RESOURCE_VERSION_KEY);
    if (!cacheTime) {
      return false;
    }

    const now = Date.now();
    return (now - cacheTime) < this.CACHE_DURATION;
  },

  /**
   * 保存资源到缓存
   * @param {Object} resources - 资源对象
   */
  saveToCache(resources) {
    try {
      const cacheData = {
        resources: resources,
        timestamp: Date.now()
      };
      
      wx.setStorageSync(this.RESOURCE_CACHE_KEY, cacheData);
      wx.setStorageSync(this.RESOURCE_VERSION_KEY, Date.now());
      wx.setStorageSync(this.RESOURCE_HASH_KEY, this.generateResourceHash());
      
      console.log('[Resource] 资源已保存到缓存');
    } catch (error) {
      console.error('[Resource] 保存缓存失败:', error);
    }
  },

  /**
   * 获取特定的资源 URL
   * @param {string} key - 资源键名（如 'whiteCat'）
   * @returns {string|null} 返回资源的完整 URL
   */
  getResourceByKey(key) {
    const cacheData = wx.getStorageSync(this.RESOURCE_CACHE_KEY);
    if (!cacheData || !cacheData.resources) {
      console.warn(`[Resource] 缓存中没有资源，key: ${key}`);
      return null;
    }
    return cacheData.resources[key] || null;
  },

  /**
   * 批量获取多个资源 URL
   * @param {Array<string>} keys - 资源键名数组
   * @returns {Object} 返回键值对对象
   */
  getResourcesByKeys(keys) {
    const cacheData = wx.getStorageSync(this.RESOURCE_CACHE_KEY);
    if (!cacheData || !cacheData.resources) {
      console.warn('[Resource] 缓存中没有资源');
      return {};
    }

    const result = {};
    keys.forEach(key => {
      if (cacheData.resources[key]) {
        result[key] = cacheData.resources[key];
      }
    });
    return result;
  },

  /**
   * 获取所有资源
   * @returns {Object|null}
   */
  getAllResources() {
    const cacheData = wx.getStorageSync(this.RESOURCE_CACHE_KEY);
    return cacheData ? cacheData.resources : null;
  },

  /**
   * 强制刷新资源（清除缓存后重新获取）
   * @returns {Promise<Object>}
   */
  async refreshResources() {
    console.log('[Resource] 强制刷新资源');
    this.clearCache();
    return await this.fetchPublicResources(true);
  },

  /**
   * 清除资源缓存
   */
  clearCache() {
    wx.removeStorageSync(this.RESOURCE_CACHE_KEY);
    wx.removeStorageSync(this.RESOURCE_VERSION_KEY);
    wx.removeStorageSync(this.RESOURCE_HASH_KEY);
    wx.removeStorageSync('resource_needs_refresh');
    console.log('[Resource] 资源缓存已清除');
  },

  /**
   * 预加载所有图片资源（可选）
   * 提前下载图片到本地,提升首次显示速度
   * @returns {Promise<void>}
   */
  async preloadImages() {
    try {
      const resources = await this.fetchPublicResources();
      const preloadPromises = [];

      // 只预加载图片文件（png, jpg, svg 等）
      for (const [key, url] of Object.entries(resources)) {
        if (url.match(/\.(png|jpg|jpeg|svg|gif|webp)(\?|$)/i)) {
          preloadPromises.push(
            new Promise((resolve) => {
              wx.getImageInfo({
                src: url,
                success: () => {
                  console.log(`[Resource] 预加载成功: ${key}`);
                  resolve();
                },
                fail: (err) => {
                  console.warn(`[Resource] 预加载失败: ${key}`, err);
                  resolve(); // 即使失败也继续
                }
              });
            })
          );
        }
      }

      await Promise.all(preloadPromises);
      console.log('[Resource] 所有图片资源预加载完成');
    } catch (error) {
      console.error('[Resource] 预加载失败:', error);
    }
  }
};

module.exports = ResourceUtils;
