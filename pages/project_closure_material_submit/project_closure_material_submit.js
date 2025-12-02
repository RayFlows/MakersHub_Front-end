// pages/project_closure_material_submit/project_closure_material_submit.js
const app = getApp();
var config = (wx.getStorageSync('config'));

// ============ 调试模式配置 ============
const DEBUG_MODE = false; // 设置为 true 启用调试模式，false 关闭
// ====================================

Page({

  /**
   * 页面的初始数据
   */
  data: {
    formData: {
      finish_description: ''
    },
    isFinishDescriptionFocused: false,
    charCount: 0,
    uploadedFiles: [], // 已上传文件列表
    projectId: 'PJ20251129234847566_425', // 项目ID
    icons: {},
    debugMode: DEBUG_MODE // 将调试模式状态存入 data
  },

  loadIcons() {
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
        icons: {
          upload: resources.upload,
          pdf: resources.pdf,      // PDF 图标
          word: resources.word,   // Word 图标
          greenCancel: resources.greenCancel, // 删除图标
          whiteCat: resources.whiteCat, 
        }
      })
    }
  },

  /**
   * 输入事件 - 实时更新字符计数
   */
  onFinishDescriptionInput(e) {
    const value = e.detail.value;
    const length = value.length;
    
    this.setData({
      'formData.finish_description': value,
      charCount: length
    });

    // 超出限制时的提示(可选)
    if (length > 500) {
      wx.showToast({
        title: '已超出字数限制',
        icon: 'none',
        duration: 1500
      });
    }
  },

  /**
   * 聚焦事件
   */
  onFinishDescriptionFocus() {
    this.setData({
      isFinishDescriptionFocused: true
    });
  },

  /**
   * 失焦事件
   */
  onFinishDescriptionBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isFinishDescriptionFocused: false,
      'formData.finish_description': value
    });
    console.log("更新结项成果描述：", value);
  },

  /**
   * 选择文件
   */
  onChooseFile() {
    wx.chooseMessageFile({
      count: 1, // 一次只能选择一个文件
      type: 'file',
      extension: ['pdf', 'doc', 'docx'], // 限制文件类型
      success: (res) => {
        const file = res.tempFiles[0];
        console.log('[选择文件]', file);

        // 验证文件格式
        const fileName = file.name;
        const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        
        if (!['pdf', 'doc', 'docx'].includes(fileExtension)) {
          wx.showToast({
            title: '仅支持 PDF 和 Word 文档',
            icon: 'none',
            duration: 1500
          });
          return;
        }

        // 验证文件大小(例如限制 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          wx.showToast({
            title: '文件大小不能超过 50MB',
            icon: 'none',
            duration: 1500
          });
          return;
        }

        // 上传文件
        this.uploadFile(file);
      },
      fail: (err) => {
        console.error('[选择文件失败]', err);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  /**
   * 上传文件到服务器（支持调试模式）
   */
  uploadFile(file) {
    const projectId = this.data.projectId;
    
    if (!projectId) {
      wx.showToast({
        title: '缺少项目ID',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // ============ 调试模式：模拟上传 ============
    if (DEBUG_MODE) {
      console.log('[调试模式] 模拟文件上传');
      
      wx.showLoading({
        title: '上传中...',
        mask: true
      });

      // 模拟网络延迟 1.5 秒
      setTimeout(() => {
        wx.hideLoading();
        
        // 模拟后端返回的数据结构
        const mockResponse = {
          code: 200,
          msg: "上传成功",
          data: {
            material_id: `MAT_MOCK_${Date.now()}`,
            file_name: `mock_${file.name}`,
            original_name: file.name,
            url: `https://mock-server.com/files/${file.name}`
          }
        };
        
        console.log('[调试模式] 模拟上传成功', mockResponse);
        
        wx.showToast({
          title: `成功上传 "${file.name}"`,
          icon: 'none',
          duration: 1500
        });

        // 判断文件类型
        const fileName = file.name;
        const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        const fileType = fileExtension === 'pdf' ? 'pdf' : 'word';

        // 添加到已上传列表（使用后端返回的数据结构）
        const uploadedFiles = this.data.uploadedFiles;
        uploadedFiles.push({
          materialId: mockResponse.data.material_id,     // 保存 material_id（重要！）
          fileName: mockResponse.data.file_name,         // 后端返回的文件名
          originalName: mockResponse.data.original_name, // 原始文件名
          fileType: fileType,                            // 文件类型（用于显示图标）
          fileUrl: mockResponse.data.url                 // 文件 URL
        });

        this.setData({
          uploadedFiles: uploadedFiles
        });

        console.log('[调试模式] 已上传文件列表', this.data.uploadedFiles);

      }, 1500);

      return; // 调试模式下直接返回，不执行真实上传
    }
    // =========================================

    // ============ 正式模式：真实上传 ============
    wx.showLoading({
      title: '上传中...',
      mask: true
    });

    const token = wx.getStorageSync('auth_token');
    const uploadUrl = config.project.material_upload + `/${projectId}`;

    wx.uploadFile({
      url: uploadUrl,
      filePath: file.path,
      name: 'file', // 后端接收的字段名
      header: {
        Authorization: `Bearer ${token}`
      },
      formData: {
        // 可以添加其他表单数据
        'filename': file.name
      },
      success: (res) => {
        wx.hideLoading();
        console.log('[后端响应] 原始响应:', res);

        try {
          const data = JSON.parse(res.data);
          
          if (data.code === 200) {
            // 成功上传
            wx.showToast({
              title: `成功上传 "${file.name}"`,
              icon: 'none',
              duration: 1500
            });

            // 判断文件类型
            const originalName = data.data.original_name;
            const fileExtension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
            const fileType = fileExtension === 'pdf' ? 'pdf' : 'word';

            // 添加到已上传列表（使用后端返回的数据结构）
            const uploadedFiles = this.data.uploadedFiles;
            uploadedFiles.push({
              materialId: data.data.material_id,     // 保存 material_id
              fileName: data.data.file_name,         // 后端返回的文件名
              originalName: data.data.original_name, // 原始文件名（用于显示）
              fileType: fileType,                    // 文件类型（用于显示图标）
              fileUrl: data.data.url                 // 文件 URL
            });

            this.setData({
              uploadedFiles: uploadedFiles
            });

            console.log('[已上传文件列表]', this.data.uploadedFiles);

          } else {
            // 上传失败
            wx.showToast({
              title: '文件上传失败，请重试',
              icon: 'none',
              duration: 1500
            });
          }
        } catch (err) {
          console.error('[解析响应失败]', err);
          wx.showToast({
              title: '服务器返回格式错误',
              icon: 'none',
              duration: 1500
            });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('[上传失败]', err);
        
        wx.showToast({
          title: '网络错误，请检查网络后重试',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  /**
   * 删除文件（调用后端接口）
   */
  onDeleteFile(e) {
    const index = e.currentTarget.dataset.index;
    const fileInfo = this.data.uploadedFiles[index];
    const materialId = fileInfo.materialId;
    const displayName = fileInfo.originalName || fileInfo.fileName;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除 "${displayName}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deleteFileFromServer(materialId, index);
        }
      }
    });
  },

  /**
   * 从服务器删除文件
   */
  deleteFileFromServer(materialId, index) {
    // ============ 调试模式：模拟删除 ============
    if (DEBUG_MODE) {
      console.log('[调试模式] 模拟删除文件, material_id:', materialId);
      
      wx.showLoading({
        title: '删除中...',
        mask: true
      });

      // 模拟网络延迟 1 秒
      setTimeout(() => {
        wx.hideLoading();
        
        // 模拟删除成功
        const uploadedFiles = this.data.uploadedFiles;
        const deletedFile = uploadedFiles[index];
        uploadedFiles.splice(index, 1);
        
        this.setData({
          uploadedFiles: uploadedFiles
        });

        wx.showToast({
          title: '已删除',
          icon: 'success',
          duration: 1500
        });

        console.log('[调试模式] 删除成功，删除的文件:', deletedFile);
        console.log('[调试模式] 删除后文件列表:', this.data.uploadedFiles);

      }, 1000);

      return; // 调试模式下直接返回
    }
    // =========================================

    // ============ 正式模式：真实删除 ============
    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    const token = wx.getStorageSync('auth_token');
    const deleteUrl = config.project.material_delete + `/${materialId}`;

    wx.request({
      url: deleteUrl,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        console.log('[删除成功] 响应:', res);

        if (res.statusCode === 200 && res.data.code === 200) {
          // 删除成功，从列表中移除
          const uploadedFiles = this.data.uploadedFiles;
          const deletedFile = uploadedFiles[index];
          uploadedFiles.splice(index, 1);
          
          this.setData({
            uploadedFiles: uploadedFiles
          });

          wx.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1500
          });

          console.log('[删除成功] 删除的文件:', deletedFile);
          console.log('[删除后文件列表]', this.data.uploadedFiles);

        } else {
          // 删除失败
          wx.showToast({
            title: '删除失败，请重试',
            icon: 'none',
            duration: 1500
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('[删除失败]', err);
        
        wx.showToast({
          title: '删除失败，请重试',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  /**
   表单验证
   */
  validateForm() {
    const { finish_description } = this.data.formData;
    const { uploadedFiles } = this.data;

    // 验证成果描述
    if (!finish_description || finish_description.trim() === '') {
      wx.showToast({
        title: '请填写成果描述',
        icon: 'none',
        duration: 1500
      });
      return false;
    }

    // 验证文件上传
    if (uploadedFiles.length === 0) {
      wx.showToast({
        title: '至少上传一个文件',
        icon: 'none',
        duration: 1500
      });
      return false;
    }

    return true;
  },

  /**
   提交结项申请
   */
  onSubmit() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }
    this.submitClosureToServer();
  },

  /**
   提交结项申请到服务器（支持调试模式）
   */
  submitClosureToServer() {
    const projectId = this.data.projectId;
    const { finish_description } = this.data.formData;

    // ============ 调试模式：模拟提交 ============
    if (DEBUG_MODE) {
      console.log('[调试模式] 模拟提交结项申请');
      console.log('[调试模式] 项目ID:', projectId);
      console.log('[调试模式] 成果描述:', finish_description);
      console.log('[调试模式] 已上传文件:', this.data.uploadedFiles);

      wx.showLoading({
        title: '提交中...',
        mask: true
      });

      // 模拟网络延迟 2 秒
      setTimeout(() => {
        wx.hideLoading();

        // 模拟后端返回
        const mockResponse = {
          code: 200,
          msg: "结项申请已提交",
          data: {
            project_id: projectId,
            state: 3,
            updated_at: "2025-12-02 16:00:00"
          }
        };

        console.log('[调试模式] 提交成功', mockResponse);

        wx.showToast({
          title: '提交成功',
          icon: 'none',
          duration: 1500,
          success: () => {
            // 提交成功后返回上一页或跳转到项目详情页
            wx.navigateBack({
              delta: 1
            });
          }
        });

      }, 1500);

      return; // 调试模式下直接返回
    }
    // =========================================

    // ============ 正式模式：真实提交 ============
    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    const token = wx.getStorageSync('auth_token');
    const submitUrl = config.project.submit_closure + `/${projectId}`;

    wx.request({
      url: submitUrl,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        finish_description: finish_description
      },
      success: (res) => {
        wx.hideLoading();
        console.log('[提交结项] 响应:', res);

        if (res.statusCode === 200 && res.data.code === 200) {
          // 提交成功
          console.log('[提交成功] 返回数据:', res.data.data);

          wx.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              // 提交成功后返回上一页或跳转到项目详情页
              wx.navigateBack({
                delta: 1
              });
            }
          });

        } else {
          // 提交失败
          console.error('[提交失败] 错误信息:', res.data);
          
          wx.showToast({
            title: '提交失败，请重试',
            icon: 'none',
            duration: 1500
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('[提交失败]', err);
        
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

    // 返回处理(更新提示文本)
    handlerGobackClick() {
      const content = this.data.isEditMode 
        ? '返回将丢失未保存的修改，是否确认？'
        : '返回将丢失已填写的内容，是否确认？';
      
      wx.showModal({
        title: '确认返回',
        content: content,
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack({ delta: 1 });
          }
        }
      });
    },
  
    // 返回首页(更新提示文本)
    handlerGohomeClick() {
      const content = this.data.isEditMode 
        ? '返回首页将丢失未保存的修改，是否确认？'
        : '返回首页将丢失已填写的内容，是否确认？';
      
      wx.showModal({
        title: '返回首页',
        content: content,
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/index/index' });
          }
        }
      });
    },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("[Project Closure Material Submit] 获取页面图标资源");
    
    // 显示调试模式状态
    if (DEBUG_MODE) {
      console.log('%c[调试模式已开启] 文件上传、删除和提交将被模拟', 'color: #00adb5; font-weight: bold; font-size: 14px;');
    }
    
    this.loadIcons();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
