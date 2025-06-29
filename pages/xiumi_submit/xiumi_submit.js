// pages/xiumi_submit/xiumi_submit.js
const token = wx.getStorageSync('auth_token');
const API_BASE = "https://mini.makershub.cn";

Page({
  data: {
    formData: {
      "link_id": '',
      "title": '',
      "name": '',
      "link": ''
    },
    isEdited: false,
    isValid: true,
    isTitleFocused: false,
    isNameFocused: false,
    isLinkFocused: false
  },

  onLoad(options) {
    if (options.link_id) {
      this.setData({
        isEdited: true,
        'formData.link_id': options.link_id,
        'formData.title': decodeURIComponent(options.title || ''),
        'formData.name': decodeURIComponent(options.name || ''),
        'formData.link': decodeURIComponent(options.link || '')
      });
      console.log("[LINK ID]: ", options.link_id);
    }
    console.log("link_id: ", options.link_id);
    console.log("formData passed: ", JSON.stringify(this.data.formData, null, 2));
  },

  onSubmit() {
    const { title, name, link } = this.data.formData;

    // 非空校验
    if (!title) return wx.showToast({ title: '请输入推文标题', icon: 'none' });
    if (!name) return wx.showToast({ title: '请输入制作人姓名', icon: 'none' });
    if (!link) return wx.showToast({ title: '请输入秀米链接', icon: 'none' });

    // URL 格式校验（可选）
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(link)) {
      return wx.showToast({ title: '请输入有效的秀米链接', icon: 'none' });
    }

    const url = this.data.isEdited
      ? `${API_BASE}/publicity-link/update/${this.data.formData.link_id}`
      : `${API_BASE}/publicity-link/post`;
    const method = this.data.isEdited ? 'PATCH' : 'POST';

    wx.request({
      url,
      method,
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { title, name, link },
      success: res => {
        console.log('服务器返回：', res.data);
        wx.showToast({ title: this.data.isEdited ? '修改成功' : '提交成功', icon: 'success' });

        // 使用事件通道通知上一页刷新
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('refreshLinks', { success: true });

        // 统一返回上一页
        wx.navigateBack({ delta: 1 });
      },
      fail: err => {
        console.error('请求失败：', err);
        console.log('后端错误详情：', err.response ? err.response.data : '无详细错误信息');
        wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
      }
    });
  },

  onTitleFocused() {
    this.setData({ isTitleFocused: true });
  },
  onTitleBlur(e) {
    this.setData({
      isTitleFocused: false,
      'formData.title': e.detail.value
    });
  },

  onNameFocused() {
    this.setData({ isNameFocused: true });
  },
  onNameBlur(e) {
    this.setData({
      isNameFocused: false,
      'formData.name': e.detail.value
    });
  },

  onLinkFocused() {
    this.setData({ isLinkFocused: true });
  },
  onLinkBlur(e) {
    this.setData({
      isLinkFocused: false,
      'formData.link': e.detail.value.trim()
    });
  },
  onLinkInput(e) {
    console.log('textarea 输入值:', e.detail.value);
    this.setData({
      'formData.link': e.detail.value
    });
  },

  handlerGobackClick() {
    wx.showModal({
      content: '返回将丢失已填写的内容，\n确认返回？',
      cancelColor: '#00ADB5',
      confirmColor: '#222831',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },
  handlerGohomeClick() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
