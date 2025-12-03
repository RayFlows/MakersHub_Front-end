// pages/login/login.js
Page({
  data: {
    email: '',
    password: '',
    image1: null,
    image2: null, // 用于存储获取到的图片数据
    isPasswordVisible: false,
    rememberMe: false, // 记住我状态
    isFocus: false, // 控制输入框焦点状态
    isFocused1: false,//控制输入框1选中
    isFocused2: false//控制输入框2选中
  },
  // 生命周期函数：页面加载时读取缓存
  onLoad: function () {
    // 页面加载时，获取 id 为 1(背景) 和 2（白色猫猫） 的图片
    this.fetchImage(1);
    this.fetchImage(2);
    //记住我 操作初始化
    const rememberMe = wx.getStorageSync('rememberMe');
    if (rememberMe) {
      const email = wx.getStorageSync('email');
      const password = wx.getStorageSync('password');
      this.setData({
        rememberMe: true,
        email: email || '',
        password: password || ''
      });
    }
  },
// 获取图片数据的函数
fetchImage: function (id) {
  const that = this;
  wx.request({
    url: `https://your-backend-domain.com/api/resources/get/${id}`, // 替换为你的后端地址
    method: 'GET',
    success: function (res) {
      if (res.data.code === 200) {
        const imageData = res.data.data;
          if (id === 1) {
            that.setData({
              image1: imageData
            });
          } else if (id === 2) {
            that.setData({
              image2: imageData
            });
          }
      } else {
        console.error('获取图片失败:', res.data.message);
      }
    },
    fail: function (err) {
      console.error('网络请求失败:', err);
    }
  });
},
  // 切换记住我状态
  toggleRememberMe: function () {
    const rememberMe = !this.data.rememberMe;
    this.setData({ rememberMe });

    if (rememberMe) {
      // 如果勾选记住我，存储邮箱和密码
      wx.setStorageSync('rememberMe', true);
      wx.setStorageSync('email', this.data.email);
      wx.setStorageSync('password', this.data.password);
    } else {
      // 如果取消勾选记住我，清除邮箱和密码
      wx.removeStorageSync('email');
      wx.removeStorageSync('password');
      wx.setStorageSync('rememberMe', false);
    }
  },

  // 处理邮箱输入
  handleEmailInput: function (event) {
    const email = event.detail.value;
    this.setData({ email});

    // 如果记住我状态为 true，更新缓存
    if (this.data.rememberMe) {
      wx.setStorageSync('email', email);
    }
  },

  // 处理密码输入
  handlePasswordInput: function (event) {
    const password = event.detail.value;
    this.setData({ password });

    // 如果记住我状态为 true，更新缓存
    if (this.data.rememberMe) {
      wx.setStorageSync('password', password);
    }
  },
  // 处理忘记密码点击事件
  handleForgetPassword: function () {
    wx.showModal({
      title: '请问', // 弹窗标题
      content: '那你还能记住啥', // 弹窗内容
      showCancel: false, // 不显示取消按钮
      confirmText: '知道了', // 确认按钮文本
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击了知道了');
        }
      }
    });
  },
// 处理邮箱输入
handleEmailInput(e) {
  this.setData({
    email: e.detail.value,
    cursorPosition: e.detail.cursor
  });
},

// 处理密码输入
handlePasswordInput(e) {
  this.setData({
    password: e.detail.value,
    cursorPosition: e.detail.cursor
  });
},

// 处理登录
handleLogin() {
  const { email, password } = this.data;

  if (!email || !password) {
    wx.showToast({
      title: '请填写完整信息',
      icon: 'none',
    });
    return;
  }

  // 发送登录请求
  wx.request({
    url: `https://your-backend-domain.com/api/users/login/${email}`,
    method: 'POST',
    data: {
      password: password,
    },
    success: (res) => {
      if (res.data.code === 200) {
        wx.showToast({
          title: '登录成功',
          icon: 'success',
        });

        // 存储用户信息到本地
        wx.setStorageSync('userInfo', res.data.data);

        // 登录成功后跳转到首页
        wx.switchTab({
          url: '/pages/index/index',
        });
      } else if (res.data.code === 401) {
        wx.showToast({
          title: '账号已被封禁',
          icon: 'none',
        });
      } else if (res.data.code === 406) {
        wx.showToast({
          title: '密码错误',
          icon: 'none',
        });
      }
    },
    fail: () => {
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none',
      });
    },
  });
},
   // 切换密码可见性的函数
   togglePasswordVisibility: function (event) {
    const isVisible = event.currentTarget.dataset.visible; // 获取当前状态
    this.setData({
      isPasswordVisible: !isVisible, // 切换状态
      isFocus: true, // 手动聚焦输入框
    });
  },

  // 处理容器点击事件
  handleContainerClick: function () {
    console.log('Container clicked');
  },
  //跳转到注册页面
  navigateToRegister: function() {
    wx.redirectTo({
        url: '/pages/register/register'
    });
  },
  //处理输入框变色
  handleEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },

  handleFocus1() {
    this.setData({
      isFocused1: true
    });
  },

  handleBlur1() {
    this.setData({
      isFocused1: false
    });
  },
  handleFocus2() {
    this.setData({
      isFocused2: true
    });
  },

  handleBlur2() {
    this.setData({
      isFocused2: false
    });
  }
});