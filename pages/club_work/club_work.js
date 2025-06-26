// club_work.js

Page({
  handlerGobackClick() {
    const pages = getCurrentPages();
    if (pages.length >= 2) {
      wx.navigateBack({
        delta: 1
      });
    } else {
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }

  },
  handlerGohomeClick() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /*点击宣传部的“进入管理”，跳转到宣传部管理页面 */
  jumpToPublicityWorkPage:function() {
      console.log('跳转宣传部工作页面');
      wx.navigateTo({
        url: '/pages/publicity_work_page/publicity_work_page',
      })
  },

  /*点击基管部的“进入管理”，跳转到基管部管理页面 */
  jumpToBaseManagementWorkPage:function() {
      console.log('跳转基管部工作页面');
      wx.navigateTo({
        url: '/pages/base_management_work_page/base_management_work_page',
      })
  },

  /*点击项目部的“进入管理”，跳转到项目部管理页面 */
  jumpTopProjectWorkPage:function() {
      console.log('跳转项目部工作页面');
      wx.navigateTo({
        url: '/pages/project_work_page/project_work_page',
      })
  },

  /*点击运维部的“进入管理”，跳转到运维部管理页面 */
  jumpToMaintenanceWorkPage:function() {
      console.log('跳转运维部工作页面');
      wx.navigateTo({
        url: '/pages/operation_maintenance_work_page/operation_maintenance_work_page',
      })
  },
  // 在 Page({...}) 中添加此函数即可
  jumpToDutyApplicationPage: function () {
    console.log('跳转值班申请页面');
    wx.navigateTo({
      url: '/pages/duty_application/duty_application',
    });
  }

})
