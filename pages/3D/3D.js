// pages/3D/3D.js
Page({
    data: {
    name: '', // 用户姓名
    phone_num: '', // 用户电话
    printer: 1, // 打印机选择（默认值为1，对应“二基楼B101”）
    quantity: '', // 料量
    file_zip: '', // 文件的 Base64 编码
    userid: '', // 用户ID（邮箱）
    loading: false, // 提交状态
    isNameFocused:false, //姓名输入框选中
    isPhoneFocused:false, //电话输入框选中
    isAmountFocsed:false, //用料量输入框选中
    },

    handlerGobackClick() {
      wx.showModal({
        title: '你点击了返回',
        content: '是否确认放回',
        success: e => {
          if (e.confirm) {
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
          }
        }
      });
    },
    handlerGohomeClick() {
      wx.reLaunch({
        url: '/pages/index/index'
      });
    },
  

    onNameFocused : function() {
      this.setData({
        isNameFocused: true
      });
    },

    onNameBlur : function() {
      this.setData({
        isNameFocused: false
      });
    },

    onPhoneFocused : function() {
      this.setData({
        isPhoneFocused: true
      });
    },

    onPhoneBlur : function() {
      this.setData({
        isPhoneFocused: false
      });
    },

    onAmountFocused : function() {
      this.setData({
        isAmountFocused: true
      });
    },

    onAmountBlur : function() {
      this.setData({
        isAmountFocused: false
      });
    },

    onLoad: function(options) {
      const userid = options.userid; // 从页面参数中获取 userid
      this.setData({ userid });
    },

  goBack: function() {
    wx.navigateBack({
      delta: 1, // 返回上一级页面
    });
  },

  // 显示帮助信息的弹窗
  showHelp: function() {
    wx.showModal({
      title: '温馨提示', // 对话框标题
      content: '请如实填写总料量，否则双倍扣除积分哦！此外，请将要打印的切片文件压缩为.zip文件再上传哦！', // 对话框内容
      showCancel: true, // 显示取消按钮
      cancelText: '取消', // 取消按钮的文本
      confirmText: '确定', // 确定按钮的文本
      success: function(res) {
        if (res.cancel) {
          console.log('用户点击了取消按钮');
        } else if (res.confirm) {
          console.log('用户点击了确定按钮');
        }
      }
    });
  },


  // 绑定姓名输入
  bindNameInput(e) {
    this.setData({
      name: e.detail.value
    });
  },

  // 绑定电话输入
  bindPhoneInput(e) {
    this.setData({
      phone_num: e.detail.value
    });
  },

  // 绑定料量输入
  bindMaterialInput(e) {
    this.setData({
      quantity: e.detail.value
    });
  },

  // 绑定打印机选择
  bindPrinterChange(e) {
    const printerMap = {
      "二基楼B101": 1,
      "i创街": 0
    };
    this.setData({
      printer: printerMap[e.detail.value]
    });
  },


  // 上传文件并转换为Base64
  uploadFile: function() {
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['zip'],
      success: (res) => {
        const filePath = res.tempFiles[0].path;
        const fileReader = wx.getFileSystemManager();
        fileReader.readFile({
          filePath: filePath,
          encoding: 'base64', // 读取为Base64编码
          success: (result) => {
            that.setData({
              file_zip: result.data // 保存Base64编码的文件内容
            });
            wx.showToast({
              title: '文件上传成功',
              icon: 'success'
            });
          },
          fail: (err) => {
            console.error('文件读取失败：', err);
            wx.showToast({
              title: '文件读取失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('文件选择失败：', err);
        wx.showToast({
          title: '文件选择失败',
          icon: 'none'
        });
      }
    });
  },

  // 提交表单
  submitForm: function() {
    const { userid, phone_num, name, quantity, printer, file_zip } = this.data;

    // 数据校验
    if (!name || !phone_num || !quantity || !file_zip || printer === undefined || printer === null) {
      wx.showToast({
        title: '请填写所有信息',
        icon: 'none'
      });
      return;
    };

    // 构造提交数据
    const formData = {
      userid: userid,
      phone_num: phone_num,
      name: name,
      quantity: parseFloat(quantity), // 确保料量是浮点型
      printer: printer,
      file_zip: file_zip
    };

    // 提交表单
    this.setData({ loading: true });
    wx.request({
      url: 'config.apply_3d', // 替换为实际的API地址
      method: 'POST',
      data: formData,
      header: {
        'Authorization': `Bearer ${token}`,
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '申请提交成功',
            icon: 'success'
          });
          console.log('申请ID：', res.data.data.apply_id);
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '提交失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }


  
});