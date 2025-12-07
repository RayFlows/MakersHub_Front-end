let authInProgress = false;
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'userInfo';
const USER_PROFILE_KEY = 'userProfile'; // 新增:存储完整用户信息的键
const LAST_CLEAN_TIME_KEY = 'last_clean_time';
var config = wx.getStorageSync('config');
const app = getApp();

/**
 * 获取本地存储的令牌
 */
function getAuthToken() {
  return wx.getStorageSync(TOKEN_KEY);
}

/**
 * 存储令牌到本地缓存
 */
function storeAuthToken(token) {
  wx.setStorageSync(TOKEN_KEY, token);
  wx.setStorageSync(USER_INFO_KEY, { logged: true });
  
  // 新增:获取到令牌后立即请求用户信息
  fetchAndStoreUserProfile(token);
}

/**
 * 新增:获取并存储用户个人信息
 */
function fetchAndStoreUserProfile(token) {
  console.log('[Auth] 开始获取用户个人信息');
  
  // 确保 config 是最新的
  const currentConfig = wx.getStorageSync('config');
  if (!currentConfig || !currentConfig.users || !currentConfig.users.profile) {
    console.error('[Auth] 配置信息不完整,无法获取用户信息');
    return;
  }

  wx.request({
    url: currentConfig.users.profile,
    method: "GET",
    header: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`,
    },
    success: (res) => {
      console.log('[Auth] 用户信息响应:', res);
      if (res.statusCode === 200 && res.data.data) {
        const info = res.data.data;
        const userProfile = {
          profile_photo: info.profile_photo || '',
          real_name: info.real_name || '',
          phone_num: info.phone_num || '',
          qq: info.qq || '',
          student_id: info.student_id || '',
          college: info.college || '',
          grade: info.grade || '',
          motto: info.motto || '',
          score: info.score || 0,
          role: info.role || 0,
        };
        
        // 存储到缓存
        wx.setStorageSync(USER_PROFILE_KEY, userProfile);
        console.log('[Auth] 用户信息已缓存:', userProfile);
        
        // 触发自定义事件通知其他页面更新
        if (typeof app.onUserProfileUpdated === 'function') {
          app.onUserProfileUpdated(userProfile);
        }
      } else {
        console.warn('[Auth] 获取用户信息失败:', res.data);
      }
    },
    fail: (err) => {
      console.error('[Auth] 请求用户信息失败:', err);
    }
  });
}

/**
 * 新增:从缓存获取用户信息
 */
function getUserProfile() {
  return wx.getStorageSync(USER_PROFILE_KEY);
}

/**
 * 检查并执行24小时缓存清理
 */
function checkAndCleanCache() {
  const now = Date.now();
  const lastCleanTime = wx.getStorageSync(LAST_CLEAN_TIME_KEY) || 0;
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  if (now - lastCleanTime > twentyFourHours) {
    console.log('[Cache] 执行24小时缓存清理');
    
    // 获取需要保留的数据
    const token = wx.getStorageSync(TOKEN_KEY);
    const userInfo = wx.getStorageSync(USER_INFO_KEY);
    const userProfile = wx.getStorageSync(USER_PROFILE_KEY);
    const configData = wx.getStorageSync('config');
    
    // 清理所有缓存
    wx.clearStorageSync();
    
    // 恢复需要保留的数据
    if (token) wx.setStorageSync(TOKEN_KEY, token);
    if (userInfo) wx.setStorageSync(USER_INFO_KEY, userInfo);
    if (userProfile) wx.setStorageSync(USER_PROFILE_KEY, userProfile);
    if (configData) wx.setStorageSync('config', configData);
    
    // 更新最后清理时间
    wx.setStorageSync(LAST_CLEAN_TIME_KEY, now);
    
    console.log('[Cache] 缓存清理完成');
  }
}

/**
 * 检查令牌有效性
 */
const checkTokenValidity = () => {
  console.log('[Auth] 开始检查授权状态');
  
  return new Promise((resolve, reject) => {
    if (authInProgress) {
      console.warn('[Auth] 已有授权请求进行中');
      reject('REQUEST_IN_PROGRESS');
      return;
    }
    
    const token = getAuthToken();
    if (token) {
      console.log('[Auth] 发现本地令牌', token);
      console.log('[Auth] 本地令牌', token)
      // 检查是否已有用户信息,没有则重新获取
      const userProfile = getUserProfile();
      if (!userProfile || !userProfile.real_name) {
        console.log('[Auth] 用户信息不完整,重新获取');
        fetchAndStoreUserProfile(token);
      }
      
      resolve(token);
    } else {
      console.log('[Auth] 本地无令牌,需要授权');
      triggerAuthFlow(resolve, reject);
    }
  });
};

/**
 * 触发授权流程
 */
const triggerAuthFlow = (resolve, reject) => {
  console.log('[Auth] 开始触发授权流程');
  authInProgress = true;
  
  wx.showModal({
    title: '授权提示',
    content: '需要授权以使用完整功能',
    confirmText: '同意',
    cancelText: '拒绝',
    success: (res) => {
      if (res.confirm) {
        console.log('[Auth] 用户同意授权');
        handleUserAuth(true, resolve, reject);
      } else {
        console.log('[Auth] 用户拒绝授权');
        authInProgress = false;
        reject('USER_DENIED');
      }
    },
    fail: (err) => {
      console.error('[Auth] 弹窗显示失败:', err);
      authInProgress = false;
      reject('MODAL_ERROR');
    }
  });
};

/**
 * 用户点击授权后调用(改进版)
 */
const handleUserAuth = (confirmed, resolve, reject) => {
  if (!confirmed) {
    console.log('[Auth] 用户拒绝授权');
    authInProgress = false;
    if (reject) reject('USER_DENIED');
    return;
  }
  
  console.log('[Auth] 开始执行 wx.login');
  wx.login({
    success: (res) => {
      if (!res.code) {
        console.error('[Auth] wx.login失败:', res.errMsg);
        authInProgress = false;
        if (reject) reject('LOGIN_FAILED');
        return;
      }
      
      console.log('[Auth] 获取 code 成功:', res.code);
      
      // 确保使用最新的 config
      const currentConfig = wx.getStorageSync('config');
      
      wx.request({
        url: currentConfig.users.login,
        method: 'POST',
        data: { code: res.code },
        success: (response) => {
          console.log('[Auth] 后端响应:', response.data);
          if (response.statusCode === 200 && response.data.code === 200) {
            const token = response.data.data.token;
            console.log('[Auth] 后端返回令牌', token);
            
            // 存储令牌(会自动触发获取用户信息)
            storeAuthToken(token);
            
            authInProgress = false;
            
            if (resolve) resolve(token);
            
            // 延时重定向
            setTimeout(() => {
              wx.redirectTo({ url: '/pages/index/index' });
            }, 100);
          } else {
            console.warn('[Auth] 后端返回错误:', response.data);
            authInProgress = false;
            if (reject) reject('LOGIN_FAILED');
          }
        },
        fail: (err) => {
          console.error('[Auth] 请求后端失败:', err);
          authInProgress = false;
          if (reject) reject('NETWORK_ERROR');
        }
      });
    },
    fail: (err) => {
      console.error('[Auth] wx.login异常:', err);
      authInProgress = false;
      if (reject) reject('LOGIN_ERROR');
    }
  });
};

// ======== 页面逻辑 ========
Page({
  data: {
    activeTab: "index",
    showAuthModal: false,
    hasUserInfo: !!wx.getStorageSync(USER_INFO_KEY),
    icons: {},
    userProfile: null // 新增:存储用户信息
  },

  onShow: function () {
    console.log("[Page] 页面显示");
    
    // 检查并执行缓存清理
    checkAndCleanCache();
    
    // 加载用户信息到页面
    const cachedProfile = getUserProfile();
    if (cachedProfile) {
      this.setData({ 
        userProfile: cachedProfile,
        hasUserInfo: true 
      });
    }

    // 检查令牌状态
    checkTokenValidity()
      .then((token) => {
        console.log("[Page] 令牌状态正常");
        this.setData({ hasUserInfo: true });
      })
      .catch((err) => {
        console.warn("[Page] 令牌验证错误:", err);
        this.setData({ hasUserInfo: false });
      });
  },

  onLoad: function () {
    console.log('[Index] 页面加载');
    this.loadIcons();
  },

  loadIcons: function () {
    const resources = app.globalData.publicResources;
    if (resources) {
      this.setData({
        icons: {
          spanner: resources.spanner,
          peoples: resources.peoples,
          grayHouse: resources.grayHouse,
          activity: resources.activity,
          project: resources.project,
          lookup: resources.lookup,
          catIconChosen: resources.catIconChosen,
          catIconUnChosen: resources.catIconUnChosen,
          meChosen: resources.meChosen,
          meUnchosen: resources.meUnchosen
        }
      });
    }
  },

  /**
   * 显示授权弹窗(优化版)
   */
  showAuthModal: function () {
    console.log("[Page] 显示授权弹窗");
    
    // 避免重复弹窗
    if (authInProgress) {
      console.warn("[Page] 授权流程进行中,不重复显示");
      return;
    }
    
    triggerAuthFlow(
      (token) => {
        console.log("[Page] 授权成功");
        this.setData({ hasUserInfo: true });
      },
      (err) => {
        console.warn("[Page] 授权失败:", err);
        wx.showToast({ title: "授权失败,请重试", icon: "none" });
      }
    );
  },

  /**
   * 统一的导航前置检查(新增,减少代码重复)
   */
  checkAuthAndNavigate: function(callback) {
    console.log("[Auth] 检查授权状态");
    if (!this.data.hasUserInfo) {
      this.showAuthModal();
    } else {
      callback.call(this);
    }
  },

  // 底部导航切换
  switchPage(e) {
    const target = e.currentTarget.dataset.page;
    
    this.checkAuthAndNavigate(() => {
      if (target === this.data.activeTab) return;

      const urlMap = {
        community: "/pages/community/community",
        index: "/pages/index/index",
        me: "/pages/me/me"
      };

      const url = urlMap[target];
      if (url) {
        wx.redirectTo({ url });
      }
    });
  },

  // 各类导航方法(简化版)
  navigateToPersonalStuffBorrow: function () {
    this.checkAuthAndNavigate(() => {
      wx.navigateTo({ 
        url: "/pages/personal_stuff_borrow_apply/personal_stuff_borrow_apply" 
      });
    });
  },

  navigateToVenue: function () {
    this.checkAuthAndNavigate(() => {
      wx.navigateTo({ 
        url: "/pages/site_borrow_apply/site_borrow_apply" 
      });
    });
  },

  navigateToProject: function () {
    this.checkAuthAndNavigate(() => {
      wx.navigateTo({ 
        url: "/pages/project_create_apply/project_create_apply" 
      });
    });
  },

  navigateToActivity: function () {
    this.checkAuthAndNavigate(() => {
      wx.navigateTo({ 
        url: "/pages/activity_list/activity_list" 
      });
    });
  },

  navigateToViewProject: function () {
    this.checkAuthAndNavigate(() => {
      wx.navigateTo({ 
        url: "/pages/my_project_list/my_project_list" 
      });
    });
  },

  navigateToTeamStuffBorrow: function () {
    this.checkAuthAndNavigate(() => {
      wx.navigateTo({ 
        url: "/pages/team_stuff_borrow_apply/team_stuff_borrow_apply" 
      });
    });
  },
});

// 导出函数供其他页面使用
module.exports = {
  TOKEN_KEY,
  USER_INFO_KEY,
  USER_PROFILE_KEY,
  getAuthToken,
  getUserProfile,
  checkTokenValidity,
  fetchAndStoreUserProfile
};
