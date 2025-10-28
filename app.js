//app.js
// 导入根目录下config.js中的配置
var config=require("./config.js")

App({
    onLaunch: function() {
    // 将全局API的url配置保存到缓存中
        wx.setStorageSync('config', config)
    },
    // globalData: {
    //   auth: {  // 初始化 auth 对象
    //     showModal: false,
    //     session: null,
    //     config: config,
    //   },
    // },
    // /**
    //  * 清除本地令牌和用户信息
    //  */
    // removeAuthToken: function() {
    //   wx.removeStorageSync(TOKEN_KEY);
    //   wx.removeStorageSync(USER_INFO_KEY);
    // }
})