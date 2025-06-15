// pages/me/me.js
const API_BASE = 'http://146.56.227.73:8000'
const TOKEN_KEY = 'auth_token' // 统一使用你登录时设置的 key
const token = wx.getStorageSync(TOKEN_KEY)
console.log('本地获取到的 token:', token)

Page({
  data: {
    textToCopy: '',

    userInfo: {
      profile_photo: '../../images/me/avatar.png',
      real_name: '用户123',
      phone_num: 'dsdf',
      motto: 'safsa',
      score: 10,
      role: 0
    },
    isAssociationMember: 1,

    itemHandler: [
      'goToBorrowPage',
      'goToProjectPage',
      'goToVenuePage',
      'goToHonorWallPage'
    ],
    items: ['我的借物', '我的项目', '我的场地', '荣誉墙', '协会工作'],
    activeTab: 'me'
  },

  onLoad() {
    this.fetchUserProfile()
  },

  fetchUserProfile() {
    wx.request({
      url: `${API_BASE}/users/profile`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      success: res => {
        console.log('[me] 用户信息请求响应:', res)
        if (res.statusCode === 200 && res.data) {
          const info = res.data
          this.setData({
            userInfo: {
              state: info.state || 1,
              real_name: info.real_name || '',
              phone_num: info.phone_num || '',
              motto: info.motto || '',
              score: info.score || 0,
              role: info.role || 0,
              profile_photo: info.profile_photo || ''
            },
            isAssociationMember: info.role > 0
          })
        } else {
          wx.showToast({ title: '获取用户信息失败', icon: 'none' })
        }
      },
      fail: err => {
        console.error('[me] 请求失败:', err)
        wx.showToast({ title: '请求失败，请检查网络', icon: 'none' })
      }
    })
  },

  copyPhone() {
    wx.setClipboardData({
      data: this.data.userInfo.phone_num,
      success: () => {
        wx.showToast({ title: '电话已复制', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  },

  copySignature() {
    wx.setClipboardData({
      data: this.data.userInfo.motto,
      success: () => {
        wx.showToast({ title: '签名已复制', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  },

  navigateToPage(url) {
    wx.navigateTo({
      url,
      fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' })
    })
  },

  switchPage(e) {
    const target = e.currentTarget.dataset.page
    if (target === this.data.activeTab) return

    let url = ''
    if (target === 'community') url = '/pages/community/community'
    else if (target === 'index') url = '/pages/index/index'
    else if (target === 'me') url = '/pages/me/me'

    wx.redirectTo({
      url,
      fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' })
    })
  },

  goToEditPage() {
    this.navigateToPage('/pages/editPage/editPage')
  },

  goToMyPointPage() {
    this.navigateToPage('/pages/MyPoints/MyPoints')
  },

  goToBorrowPage() {
    this.navigateToPage('/pages/borrow/borrow')
  },
  goToProjectPage() {
    this.navigateToPage('/pages/project/project')
  },
  goToVenuePage() {
    this.navigateToPage('/pages/venue/venue')
  },
  goToHonorWallPage() {
    this.navigateToPage('/pages/honor-wall/honor-wall')
  },
  goToWorkPage() {
    this.navigateToPage('/pages/club_work/club_work')
  }
})
