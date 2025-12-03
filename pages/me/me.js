// pages/me/me.js

const { getUserProfile, USER_PROFILE_KEY } = require('../index/index.js');
const app = getApp();

Page({
  data: {
    textToCopy: "",
    userInfo: {
      profile_photo: "/images/me/avatar.png",
      real_name: "新来的猫猫",
      phone_num: "",
      qq: "",
      student_id: "",
      college: "",
      grade: "",
      motto: "什么都没有捏",
      score: 0,
      role: 0,
    },
    isAssociationMember: false,
    itemHandler: [
      "goToBorrowPage",
      "goToProjectPage",
      "goToVenuePage",
      "goToHonorWallPage",
    ],
    items: ["我的借物", "我的项目", "我的场地", "荣誉墙", "协会工作"],
    activeTab: "me",
    icons: {}
  },

  onShow() {
    console.log('[Me] onShow 被调用');
    this.loadUserProfileFromCache();
  },

  onLoad: function() {
    console.log('[Me] 页面加载');
    this.loadIcons();
    this.loadUserProfileFromCache();
  },

  loadIcons: function() {
    console.log('[Me] 获取本页图标资源');
    const resources = app.globalData.publicResources;

    if (resources) {
      this.setData({
        icons: {
          whiteArrow: resources.whiteArrow,
          blackArrow: resources.blackArrow,
          whiteEdit: resources.whiteEdit,
          circuitSplit: resources.circuitSplit,
          catIconChosen: resources.catIconChosen,
          catIconUnchosen: resources.catIconUnchosen,
          meChosen: resources.meChosen,
        }
      });
    }
  },

  /**
   * 从缓存加载用户信息
   */
  loadUserProfileFromCache() {
    console.log('[Me] 从缓存加载用户信息');
    
    const cachedProfile = getUserProfile();
    
    if (cachedProfile) {
      console.log('[Me] 缓存中的用户信息:', cachedProfile);
      
      this.setData({
        userInfo: {
          profile_photo: cachedProfile.profile_photo || this.data.userInfo.profile_photo,
          real_name: cachedProfile.real_name || this.data.userInfo.real_name,
          phone_num: cachedProfile.phone_num || this.data.userInfo.phone_num,
          qq: cachedProfile.qq || this.data.userInfo.qq,
          student_id: cachedProfile.student_id || this.data.userInfo.student_id,
          college: cachedProfile.college || this.data.userInfo.college,
          grade: cachedProfile.grade || this.data.userInfo.grade,
          motto: cachedProfile.motto || this.data.userInfo.motto,
          score: cachedProfile.score || this.data.userInfo.score,
          role: cachedProfile.role || this.data.userInfo.role,
        },
        isAssociationMember: cachedProfile.role > 0,
      });
      
      console.log('[Me] 用户信息已加载:', this.data.userInfo);
    } else {
      console.warn('[Me] 缓存中没有用户信息,使用默认值');
      wx.showToast({
        title: '用户信息加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 跳转到编辑页面 - 不再传递参数
   */
  goToEditPage() {
    console.log('[Me] 跳转到编辑页面');
    // 直接跳转,编辑页面会自己从缓存读取用户信息
    wx.navigateTo({
      url: '/pages/editPage/editPage'
    });
  },

  navigateToPage(url) {
    wx.navigateTo({ url });
  },

  goToMyPointPage() {
    this.navigateToPage("/pages/MyPoints/MyPoints");
  },

  goToBorrowPage() {
    this.navigateToPage("/pages/my_stuff_borrow_list/my_stuff_borrow_list");
  },

  goToProjectPage() {
    this.navigateToPage("/pages/project/project");
  },

  goToVenuePage() {
    this.navigateToPage("/pages/my_site_borrow_list/my_site_borrow_list");
  },

  goToHonorWallPage() {
    this.navigateToPage("/pages/honor-wall/honor-wall");
  },

  goToWorkPage() {
    this.navigateToPage("/pages/club_work/club_work");
  },

  /**
   * 底部导航切换页面
   */
  switchPage(e) {
    const page = e.currentTarget.dataset.page;
    
    if (page === this.data.activeTab) {
      return; // 已经在当前页,不需要跳转
    }

    this.setData({ activeTab: page });

    const urlMap = {
      community: "/pages/community/community",
      index: "/pages/index/index",
      me: "/pages/me/me"
    };

    const url = urlMap[page];
    if (url && page !== 'me') {
      wx.redirectTo({ url });
    }
  },

  handlerGobackClick() {
    wx.navigateBack({ delta: 1 });
  },
});
