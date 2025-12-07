let authInProgress = false;
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'userInfo';
const USER_PROFILE_KEY = 'userProfile';
const LAST_CLEAN_TIME_KEY = 'last_clean_time';
const PROFILE_CHECK_FLAG = 'profile_check_flag'; // 新增：防止重复检查标志
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
  
  fetchAndStoreUserProfile(token);
}

/**
 * 新增：检查用户信息完整性
 */
function checkProfileCompleteness(userProfile) {
  if (!userProfile) {
    console.log('[Profile] 用户信息不存在');
    return false;
  }

  const requiredFields = ['real_name', 'phone_num', 'qq', 'student_id', 'grade', 'college'];
  
  for (let field of requiredFields) {
    const value = userProfile[field];
    // 检查字段是否为空、null、undefined或空字符串
    if (!value || value === '' || value === null || value === undefined) {
      console.log(`[Profile] 字段 ${field} 为空，需要完善信息`);
      return false;
    }
  }
  
  console.log('[Profile] 用户信息完整');
  return true;
}

/**
 * 新增：强制跳转到编辑页面（带新用户标识）
 */
function forceNavigateToEditPage() {
  console.log('[Profile] 跳转到编辑页面完善信息');
  
  // 设置标志，避免重复检查
  wx.setStorageSync(PROFILE_CHECK_FLAG, true);
  
  wx.showModal({
    title: '完善个人信息',
    content: '请先完善个人信息，以便后续功能的使用',
    showCancel: false,
    confirmText: '去完善',
    success: (res) => {
      if (res.confirm) {
        // 添加 isNewMember=true 参数
        wx.redirectTo({
          url: '/pages/editPage/editPage?isNewMember=true',
          fail: (err) => {
            console.error('[Profile] redirectTo跳转失败:', err);
            // 如果redirectTo失败，尝试使用navigateTo
            wx.navigateTo({
              url: '/pages/editPage/editPage?isNewMember=true'
            });
          }
        });
      }
    }
  });
}

/**
 * 新增：清除检查标志（在editPage保存成功后调用）
 */
function clearProfileCheckFlag() {
  wx.removeStorageSync(PROFILE_CHECK_FLAG);
}

/**
 * 获取并存储用户个人信息
 */
function fetchAndStoreUserProfile(token) {
  console.log('[Auth] 开始获取用户个人信息');
  
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
        
        wx.setStorageSync(USER_PROFILE_KEY, userProfile);
        console.log('[Auth] 用户信息已缓存:', userProfile);
        
        // 新增：检查用户信息完整性
        const isComplete = checkProfileCompleteness(userProfile);
        if (!isComplete) {
          const checkFlag = wx.getStorageSync(PROFILE_CHECK_FLAG);
          if (!checkFlag) {
            // 延迟执行，确保页面已加载
            setTimeout(() => {
              forceNavigateToEditPage();
            }, 500);
          }
        } else {
          // 信息完整，清除检查标志
          clearProfileCheckFlag();
        }
        
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
 * 从缓存获取用户信息
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
    
    const token = wx.getStorageSync(TOKEN_KEY);
    const userInfo = wx.getStorageSync(USER_INFO_KEY);
    const userProfile = wx.getStorageSync(USER_PROFILE_KEY);
    const configData = wx.getStorageSync('config');
    
    wx.clearStorageSync();
    
    if (token) wx.setStorageSync(TOKEN_KEY, token);
    if (userInfo) wx.setStorageSync(USER_INFO_KEY, userInfo);
    if (userProfile) wx.setStorageSync(USER_PROFILE_KEY, userProfile);
    if (configData) wx.setStorageSync('config', configData);
    
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
      
      const userProfile = getUserProfile();
      if (!userProfile || !userProfile.real_name) {
        console.log('[Auth] 用户信息不完整,重新获取');
        fetchAndStoreUserProfile(token);
      } else {
        // 新增：即使有用户信息，也要检查完整性
        const isComplete = checkProfileCompleteness(userProfile);
        if (!isComplete) {
          const checkFlag = wx.getStorageSync(PROFILE_CHECK_FLAG);
          if (!checkFlag) {
            setTimeout(() => {
              forceNavigateToEditPage();
            }, 500);
          }
        }
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
 * 用户点击授权后调用
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
            
            storeAuthToken(token);
            
            authInProgress = false;
            
            if (resolve) resolve(token);
            
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
    userProfile: null
  },

  onShow: function () {
    console.log("[Page] 页面显示");
    
    checkAndCleanCache();
    
    // 新增：从editPage返回时，清除检查标志并重新验证
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
    
    // 如果是从editPage返回的，清除标志并重新检查
    if (prevPage && prevPage.route === 'pages/editPage/editPage') {
      console.log('[Page] 从编辑页返回，清除检查标志');
      clearProfileCheckFlag();
    }
    
    const cachedProfile = getUserProfile();
    if (cachedProfile) {
      this.setData({ 
        userProfile: cachedProfile,
        hasUserInfo: true 
      });
      
      // 新增：检查信息完整性
      const isComplete = checkProfileCompleteness(cachedProfile);
      if (!isComplete) {
        const checkFlag = wx.getStorageSync(PROFILE_CHECK_FLAG);
        if (!checkFlag) {
          setTimeout(() => {
            forceNavigateToEditPage();
          }, 300);
        }
      }
    }

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

  showAuthModal: function () {
    console.log("[Page] 显示授权弹窗");
    
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

  checkAuthAndNavigate: function(callback) {
    console.log("[Auth] 检查授权状态");
    if (!this.data.hasUserInfo) {
      this.showAuthModal();
    } else {
      callback.call(this);
    }
  },

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
        url: "" 
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
  PROFILE_CHECK_FLAG,
  getAuthToken,
  getUserProfile,
  checkTokenValidity,
  fetchAndStoreUserProfile,
  checkProfileCompleteness,
  clearProfileCheckFlag  // 新增：供editPage调用
};
