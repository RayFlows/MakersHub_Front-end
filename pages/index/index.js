let authInProgress = false;
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'userInfo';
const LAST_CLEAN_TIME_KEY = 'last_clean_time'; // 上次清理时间的存储键
var config = (wx.getStorageSync('config'));
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
}

/**
 * 检查并执行24小时缓存清理
 */
function checkAndCleanCache() {
  const now = Date.now();
  const lastCleanTime = wx.getStorageSync(LAST_CLEAN_TIME_KEY) || 0;
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24小时的毫秒数
  
  // 如果距离上次清理已超过24小时
  if (now - lastCleanTime > twentyFourHours) {
    console.log('[Cache] 执行24小时缓存清理');
    
    // 获取需要保留的数据（令牌和用户信息）
    const token = wx.getStorageSync(TOKEN_KEY);
    const userInfo = wx.getStorageSync(USER_INFO_KEY);
    
    // 清理所有缓存
    wx.clearStorageSync();
    
    // 恢复需要保留的数据
    if (token) wx.setStorageSync(TOKEN_KEY, token);
    if (userInfo) wx.setStorageSync(USER_INFO_KEY, userInfo);
    
    // 更新最后清理时间
    wx.setStorageSync(LAST_CLEAN_TIME_KEY, now);
    
    console.log('[Cache] 缓存清理完成');
  }
}

/**
 * 检查令牌有效性
 * 如果本地无令牌或验证失败，则触发授权流程
 */
const checkTokenValidity = () => {
  console.log('[Auth] 开始检查授权状态');
  const promise = new Promise((resolve, reject) => {
    if (authInProgress) {
      console.warn('[Auth] 已有授权请求进行中');
      // 此处直接 reject，但 Promise 对象仍然返回
      reject('REQUEST_IN_PROGRESS');
      return;
    }
    authInProgress = true;
    console.log('[Auth] 设置 authInProgress = true');

    const token = getAuthToken();
    if (token) {
      console.log('[Auth] 发现本地令牌，token =', token);
      authInProgress = false;
      resolve(token);
    } else {
      console.log('[Auth] 本地无令牌，需要授权');
      triggerAuthFlow(resolve, reject);
    }
  });
  console.log('[Auth] 返回 Promise 对象:', promise);
  return promise;
};

/**
 * 触发授权流程
 * 设置全局 authResolver，在用户点击授权组件时调用相应的 resolve/reject
 */
const triggerAuthFlow = (resolve, reject) => {
  console.log('[Auth] triggerAuthFlow: 开始触发授权流程');
  wx.showModal({
    title: '授权提示',
    content: '需要授权以使用完整功能',
    confirmText: '同意',
    cancelText: '拒绝',
    success: (res) => {
      if (res.confirm) {
        console.log('[Auth] 用户同意授权');
        // 用户同意，继续执行微信登录
        handleUserAuth(true);
      } else {
        console.log('[Auth] 用户拒绝授权');
        authInProgress = false; // 重置标志
        reject('USER_DENIED');
      }
    },
    fail: (err) => {
      console.error('[Auth] 弹窗显示失败:', err);
      authInProgress = false; // 重置标志
      reject('MODAL_ERROR');
    }
  });
};

/**
 * 用户点击授权弹窗后调用
 * 如果用户同意授权，则通过 wx.login 获取 code，再调用后端接口换取令牌
 */
const handleUserAuth = (confirmed) => {
  if (!confirmed) {
    console.log('[Auth] 用户拒绝授权');
    const app = getApp();
    if (app.globalData.authResolver) {
      app.globalData.authResolver.reject('USER_DENIED');
    }
    authInProgress = false; // 重置标志
    return;
  }
  console.log('[Auth] 开始执行 wx.login');
  wx.login({
    success: (res) => {
      if (!res.code) {
        console.error('[Auth] wx.login失败:', res.errMsg);
        authInProgress = false; // 重置标志
        if (getApp().globalData.authResolver) {
          getApp().globalData.authResolver.reject('LOGIN_FAILED');
        }
        return;
      }
      console.log('[Auth] 获取 code 成功:', res.code);
      wx.request({
        url: config.users.login,
        method: 'POST',
        data: { code: res.code },
        success: (response) => {
          console.log('[Auth] 后端响应:', response.data);
          if (response.statusCode === 200 && response.data.code === 200) {
            const token = response.data.data.token;
            console.log('[Auth] 后端返回令牌，token =', token);
            storeAuthToken(token);
            
            // 重要：在重定向前重置标志
            authInProgress = false;
            
            if (getApp().globalData.authResolver) {
              getApp().globalData.authResolver.resolve(token);
            }
            
            // 使用延时重定向，避免状态冲突
            setTimeout(() => {
              wx.redirectTo({ url: '/pages/index/index' });
            }, 100);
          } else {
            console.warn('[Auth] 后端返回错误代码:', response.data.data.code);
            authInProgress = false; // 重置标志
            if (getApp().globalData.authResolver) {
              getApp().globalData.authResolver.reject('LOGIN_FAILED');
            }
          }
        },
        fail: (err) => {
          console.error('[Auth] 请求后端失败:', err);
          authInProgress = false; // 重置标志
          if (getApp().globalData.authResolver) {
            getApp().globalData.authResolver.reject('NETWORK_ERROR');
          }
        }
      });
    },
    fail: (err) => {
      console.error('[Auth] wx.login异常:', err);
      authInProgress = false; // 重置标志
      if (getApp().globalData.authResolver) {
        getApp().globalData.authResolver.reject('LOGIN_ERROR');
      }
    }
  });
};
// ======== 原 login.js 部分结束 ========

// ======== 原 index.js 部分开始 ========
// 注: 不再需要导入login.js，因为已经合并到同一文件
// 原导入语句：
// const loginJS = require("../../API/login.js");
// const { TOKEN_KEY, USER_INFO_KEY } = require("../../API/login.js");

Page({
  data: {
    activeTab: "index", // 当前页面为首页
    showAuthModal: false,
    hasUserInfo: !!wx.getStorageSync(USER_INFO_KEY), // 使用合并后的常量
    icons: {}
  },

  onShow: function () {
    console.log("[Page] 初始化令牌检查");
    // 一开始就获取所有的minIO公共icon资源，保存到用户的缓存中
    // 检查并执行24小时缓存清理
    checkAndCleanCache();

    // 使用本文件中的函数，不再需要通过loginJS访问
    checkTokenValidity()
      .then((token) => {
        console.log("[Page] 令牌状态正常，token =", token);
        this.setData({ hasUserInfo: true });
      })
      .catch((err) => {
        console.warn("[Page] 令牌验证错误:", err);
        this.setData({ hasUserInfo: false });
        // 如果在 index 页面需要提示用户授权，这里可以增加相应处理逻辑
      });
  },
  onLoad: function () {
    console.log('[Index] 获取本页图标资源')
    this.loadIcons();
  },

  loadIcons: function () {
    // 获取该页面的公共资源
    const resources = app.globalData.publicResources;

    if(resources) {
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
      })
    }
  },
  /**
   * 用户点击授权按钮时调用，显示授权弹窗
   */
  showAuthModal: function () {
    console.log("[Page] 显示授权弹窗");
    wx.showModal({
      title: "提示",
      content: "授权以使用完整功能，是否同意授权？",
      confirmText: "同意",
      cancelText: "拒绝",
      success: (res) => {
        if (res.confirm) {
          // 使用本文件中的函数
          handleUserAuth(true);
        } else {
          console.log("[Page] 用户拒绝授权");
          wx.showToast({ title: "功能需要授权才能使用", icon: "none" });
        }
      },
    });
  },

  // 点击底部导航项时调用
  switchPage(e) {
    const target = e.currentTarget.dataset.page;
    let url = "";

    console.log("[Auth] 尝试更换导航栏");
    if (!this.data.hasUserInfo) {
      this.showAuthModal(); // 抽离授权逻辑
    } else {
      if (target === this.data.activeTab) {
        return; // 点击的是当前页面，无需跳转
      }

      switch (target) {
        case "community":
          url = "/pages/community/community"; // 社区页面（此处用community页面占位）
          break;
        case "index":
          url = "/pages/index/index"; // 首页
          break;
        case "me":
          url = "/pages/me/me"; // 我的页面
          break;
      }
    }

    // 使用 wx.redirectTo 或 wx.reLaunch 进行页面跳转，防止页面堆栈积累
    wx.redirectTo({
      url: url,
    });
  },

  //跳转申请借物的逻辑
  navigateToPersonalStuffBorrow: function () {
    console.log("[Auth] 尝试访问功能");
    if (!this.data.hasUserInfo) {
      this.showAuthModal(); // 抽离授权逻辑
    } else {
      this.actuallyNavigateToBorrow();
    }
  },

  actuallyNavigateToBorrow: function () {
    wx.navigateTo({
      url: "/pages/personal_stuff_borrow_apply/personal_stuff_borrow_apply",
      success: () => console.log("跳转成功"),
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({ title: "页面跳转失败", icon: "none" });
      },
    });
  },

  //跳转申请场地的逻辑
  navigateToVenue: function () {
    console.log("[Auth] 尝试访问功能");
    if (!this.data.hasUserInfo) {
      this.showAuthModal(); // 抽离授权逻辑
    } else {
      this.actuallyNavigateToVenue();
    }
  },

  actuallyNavigateToVenue: function () {
    wx.navigateTo({
      url: "/pages/site_borrow_apply/site_borrow_apply",
      success: () => console.log("跳转成功"),
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({ title: "页面跳转失败", icon: "none" });
      },
    });
  },

  //跳转项目立项的逻辑
  navigateToProject: function () {
    console.log("[Auth] 尝试访问功能");
    if (!this.data.hasUserInfo) {
      this.showAuthModal(); // 抽离授权逻辑
    } else {
      this.actuallyNavigateToProject();
    }
  },

  actuallyNavigateToProject: function () {
    wx.navigateTo({
      url: "/pages",
      success: () => console.log("跳转成功"),
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({ title: "页面跳转失败", icon: "none" });
      },
    });
  },

  //跳转协会活动的逻辑
  navigateToActivity: function () {
    console.log("[Auth] 尝试访问功能");
    if (!this.data.hasUserInfo) {
      this.showAuthModal(); // 抽离授权逻辑
    } else {
      this.actuallyNavigate();
    }
  },

  actuallyNavigate: function () {
    wx.navigateTo({
      url: "/pages/activity_list/activity_list",
      success: () => console.log("跳转成功"),
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({ title: "页面跳转失败", icon: "none" });
      },
    });
  },

  //跳转查看项目的逻辑
  navigateToViewProject: function () {
    console.log("[Auth] 尝试访问功能");
    if (!this.data.hasUserInfo) {
      this.showAuthModal(); // 抽离授权逻辑
    } else {
      this.actuallyNavigateToViewProject();
    }
  },

  actuallyNavigateToViewProject: function () {
    wx.navigateTo({
      url: "/pages",
      success: () => console.log("跳转成功"),
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({ title: "页面跳转失败", icon: "none" });
      },
    });
  },

  //跳转团队借物的逻辑
  navigateToTeamStuffBorrow: function () {
    console.log("[Auth] 尝试访问功能");
    if (!this.data.hasUserInfo) {
      this.showAuthModal(); // 抽离授权逻辑
    } else {
      this.actuallyNavigateToEvents();
    }
  },

  actuallyNavigateToEvents: function () {
    wx.navigateTo({
      url: "/pages/team_stuff_borrow_apply/team_stuff_borrow_apply",
      success: () => console.log("跳转成功"),
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({ title: "页面跳转失败", icon: "none" });
      },
    });
  },
});
// ======== 原 index.js 部分结束 ========
