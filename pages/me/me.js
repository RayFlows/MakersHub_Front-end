// pages/me/me.js


var config = (wx.getStorageSync('config'));
const TOKEN_KEY = "auth_token";
const token = wx.getStorageSync(TOKEN_KEY);
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
      motto: "什么都没有捏",
      score: 0,
      role: 0,
    },
    isAssociationMember: 1,
    itemHandler: [
      "goToBorrowPage",
      "goToProjectPage",
      "goToVenuePage",
      "goToHonorWallPage",
    ],
    items: ["我的借物", "我的项目", "我的场地", "荣誉墙", "协会工作"],
    activeTab: "me",
    icons:{}
  },

  onShow() {
      console.log('[Me] onShow 被调用');
      this.fetchUserProfile();
  },

  onLoad: function() {
    console.log('[Me] 获取本页图标资源');
    this.loadIcons();
  },

  loadIcons: function () {
    // 获取该页面的公共资源
    const resources = app.globalData.publicResources;

    if(resources) {
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
      })
    }
  },

  fetchUserProfile() {
    console.log('[Me] fetchUserProfile 开始');
    console.log('[Me] 当前 config:', config);
    console.log('[Me] 当前 token:', token);
    wx.request({
      url: config.users.profile,
      method: "GET",
      header: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`,
      },
      success: (res) => {
        console.log('[Me] 完整响应:', res);
        console.log("后端返回个人主页: " + JSON.stringify(res, null, 2));
        if (res.statusCode === 200 && res.data.data) {
          const info = res.data.data;
          this.setData({
            userInfo: {
              profile_photo:
              `${info.profile_photo}?t=${Date.now()}` || this.data.userInfo.profile_photo,
              real_name: info.real_name || this.data.userInfo.real_name,
              phone_num: info.phone_num || this.data.userInfo.phone_num,
              qq: info.qq || this.data.userInfo.qq,
              student_id: info.student_id || this.data.userInfo.student_id,
              college: info.college || this.data.userInfo.college,
              motto: info.motto || this.data.userInfo.motto,
              score: info.score || this.data.userInfo.score,
              role: info.role || this.data.userInfo.role,
            },
            isAssociationMember: info.role > 0,
          });
        }
        console.log('[Me] 更新后userInfo变量：'+JSON.stringify(this.data.userInfo, null, 2));
      },
    });
  },

  goToEditPage() {
    // 进行加密，避免中文带来的解析错误
    const params = {
      real_name: encodeURIComponent(this.data.userInfo.real_name || ''),
      phone_num: encodeURIComponent(this.data.userInfo.phone_num || ''),
      qq: encodeURIComponent(this.data.userInfo.qq || ''),
      student_id: encodeURIComponent(this.data.userInfo.student_id || ''),
      college: encodeURIComponent(this.data.userInfo.college || ''),
      avatar: encodeURIComponent(this.data.userInfo.profile_photo || ''),
      motto: encodeURIComponent(this.data.userInfo.motto || ''),
    };
    console.log("userInfo 编码后 params: ", JSON.stringify(params, null, 2));
    wx.navigateTo({
      url: `/pages/editPage/editPage?real_name=${params.real_name}&phone_num=${params.phone_num}&qq=${params.qq}&student_id=${params.student_id}&college=${params.college}&avatar=${params.avatar}&motto=${params.motto}`,
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

  // copyPhone() {
  //   const phone = this.data.userInfo.phone_num;
  //   if (!phone) {
  //     return wx.showToast({ title: "暂无联系方式", icon: "none" });
  //   }
  //   wx.setClipboardData({
  //     data: phone,
  //     success: () => wx.showToast({ title: "电话已复制", icon: "success" }),
  //   });
  // },

  // copySignature() {
  //   const motto = this.data.userInfo.motto;
  //   if (!motto) {
  //     return wx.showToast({ title: "暂无签名", icon: "none" });
  //   }
  //   wx.setClipboardData({
  //     data: motto,
  //     success: () => wx.showToast({ title: "签名已复制", icon: "success" }),
  //   });
  // },

  // 新增：底部导航切换页面
  switchPage(e) {
    const page = e.currentTarget.dataset.page;
    this.setData({ activeTab: page });

    if (page === "community") {
      wx.redirectTo({ url: "/pages/community/community" });
    } else if (page === "index") {
      wx.redirectTo({ url: "/pages/index/index" });
    } else if (page === "me") {
      // 已经在“我的”页，可留空
    }
  },

  handlerGobackClick() {
    wx.navigateBack({ delta: 1 });
  },
});
