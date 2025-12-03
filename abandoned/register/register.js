Page({
  data: {
    isPasswordVisible1: false,
    isPasswordVisible2: false,
    isFocus1: false ,// 控制输入框1焦点状态
    isFocus2: false, // 控制输入框2焦点状态
    isFocused1: false,//控制输入框1选中
    isFocused2: false,//控制输入框2选中
    isFocused3: false,//控制输入框3选中
    isFocused4: false,//控制输入框4选中
    email: '', // 用户输入的邮箱
    password: '', // 用户输入的密码
    verifyCode: '', // 用户输入的验证码
    confirmPassword: '',//用户输入的确认密码
    image1: null,
    sendCount: wx.getStorageSync('sendCount') || 0, // 验证码发送次数
    lastSendTime: wx.getStorageSync('lastSendTime') || 0, // 上次发送验证码的时间
    countdown: wx.getStorageSync('countdown') || 0, // 倒计时秒数
  },
  // 页面加载时，获取 id 为 1(背景)的图片
onLoad: function () {
    this.fetchImage(1);
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
// 处理邮箱输入
handleEmailInput(e) {
  this.setData({
    email: e.detail.value,
  });
},

// 处理密码输入
handlePasswordInput(e) {
  this.setData({
    password: e.detail.value,
  });
},
handleConfirmPasswordInput: function (e) {
  this.setData({
    confirmPassword: e.detail.value
  });
},
// 处理验证码输入
handleVerifyCodeInput(e) {
  this.setData({
    verifyCode: e.detail.value,
  });
},

// 获取验证码
getVerifyCode() {
  const email = this.data.email;
  const currentTime = Date.now();
  const { sendCount, lastSendTime, countdown } = this.data;
  // 检查是否在 1 小时内发送次数超过 3 次
  if (sendCount >= 3 && currentTime - lastSendTime < 3600 * 1000) {
    wx.showToast({
      title: '1 小时内只能发送 3 次验证码',
      icon: 'none',
    });
    return;
  }

  // 检查是否在 60 秒间隔内
  if (countdown > 0) {
    wx.showToast({
      title: `还剩 ${countdown} 秒可再次发送`,
      icon: 'none',
    });
    return;
  }
  if (!email) {
    wx.showToast({
      title: '请输入邮箱',
      icon: 'none',
    });
    return;
  }
  // 开始倒计时
  this.setData({
    sendCount: sendCount + 1,
    lastSendTime: currentTime,
    countdown: 60,
  });

  // 存储到本地
  wx.setStorageSync('sendCount', sendCount + 1);
  wx.setStorageSync('lastSendTime', currentTime);
  wx.setStorageSync('countdown', 60);

  const countdownInterval = setInterval(() => {
    const newCountdown = this.data.countdown - 1;
    if (newCountdown >= 0) {
      this.setData({
        countdown: newCountdown,
      });
      wx.setStorageSync('countdown', newCountdown);
    } else {
      clearInterval(countdownInterval);
    }
  }, 1000);

  // 发送请求到后端获取验证码
  wx.request({
    url: 'https://your-backend-domain.com/api/users/send-verify-code',
    method: 'POST',
    data: {
      userid: email,
    },
    success: (res) => {
      if (res.data.code === 200) {
        wx.showToast({
          title: '验证码已发送',
          icon: 'success',
        });
      } else {
        wx.showToast({
          title: res.data.message || '验证码发送失败',
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

// 处理注册
handleRegister() {
  const { email, password, verifyCode, confirmPassword } = this.data;

  if (!email || !password || !verifyCode || !confirmPassword) {
    wx.showToast({
      title: '请填写完整信息',
      icon: 'none',
    });
    return;
  }

   // 检查两次输入的密码是否一致
   if (password!== confirmPassword) {
    wx.showToast({
      title: '两次输入的密码不一样',
      icon: 'none',
    });
    return;
  }

  // 发送注册请求
  wx.request({
    url: 'https://your-backend-domain.com/api/users/register',
    method: 'POST',
    data: {
      userid: email,
      password: password,
      verify: verifyCode,
    },
    success: (res) => {
      if (res.data.code === 200) {
        wx.showToast({
          title: '注册成功',
          icon: 'success',
        });

        // 注册成功后跳转到登录页面或其他页面
        wx.navigateTo({
          url: '/pages/login/login',
        });
      } else {
        wx.showToast({
          title: res.data.message || '注册失败',
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
  togglePasswordVisibility1: function (event) {
    const isVisible = event.currentTarget.dataset.visible; // 获取当前状态
    this.setData({
      isPasswordVisible1: !isVisible, // 切换状态
      isFocus1: true // 手动聚焦输入框
    });
  },
  togglePasswordVisibility2: function (event) {
    const isVisible = event.currentTarget.dataset.visible; // 获取当前状态
    this.setData({
      isPasswordVisible2: !isVisible, // 切换状态
      isFocus2: true // 手动聚焦输入框
    });
  },

  // 处理容器点击事件
  handleContainerClick: function () {
    console.log('Container clicked');
  },
  navigateToLogin: function() {
    wx.redirectTo({
      url: '/pages/login/login'
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
  },//邮箱
  handleFocus2() {
    this.setData({
      isFocused2: true
    });
  },

  handleBlur2() {
    this.setData({
      isFocused2: false
    });
  },//验证码
  handleFocus3() {
    this.setData({
      isFocused3: true
    });
  },

  handleBlur3() {
    this.setData({
      isFocused3: false
    });
  },//密码
  handleFocus4() {
    this.setData({
      isFocused4: true
    });
  },

  handleBlur4() {
    this.setData({
      isFocused4: false
    });
  }//确认密码
});