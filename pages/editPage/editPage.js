// pages/editPage/editPage.js

var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync("auth_token");
const app = getApp();
const { getUserProfile, USER_PROFILE_KEY, clearProfileCheckFlag } = require('../index/index.js');

Page({
  data: {
    userInfo: {
      avatar: "",
      real_name: "",
      phone_num: "",
      qq: "",
      student_id: "",
      college: "",
      grade: "",
      motto: "",
    },
    tempAvatar: "",
    isNewMember: false,  // 新增：标识是否为新用户
    isNameFocused: false,
    isPhoneFocused: false,
    isQQFocused: false,
    isStudentIDFocused: false,
    isMottoFocused: false,
    isNameChanged: false,
    isPhoneChanged: false,
    isQQChanged: false,
    isStudentIDChaged: false,
    isCollegeChanged: false,
    isGradeChanged: false,
    isMottoChanged: false,
    isPhoneValid: true,
    phoneErrorMsg: "",
    gradeRange: [],
    gradeIndex: 0,
    displayGrade: "",
    collegeIndex: 0,
    collegeNames:[
      "计算机学院",
      "网络空间安全学院",
      "电子信息学院",
      "经济学院",
      "外国语学院",
      "数学学院",
      "生命科学学院",
      "机械工程学院",
      "文学与新闻学院",
      "法学院",
      "艺术学院",
      "历史文化学院",
      "物理学院",
      "化学学院"
    ],
    icons: {}
  },

  onLoad(options) {
    console.log("[Edit Page] 接收到的参数:", options);
    
    // 接收并处理 isNewMember 参数
    if (options.isNewMember === 'true') {
      this.setData({
        isNewMember: true
      });
      console.log('[EditPage] 检测到新用户，需完善全部必填信息');
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: '完善个人信息'
      });
    } else {
      console.log('[EditPage] 普通编辑模式');
      wx.setNavigationBarTitle({
        title: '编辑个人信息'
      });
    }

    console.log("[Edit Page] 获取本页图标资源");
    this.loadIcons();
    this.loadUserProfileFromCache();

    // 初始化年级选项
    console.log("初始化年级选项");
    this.initGradeRange();

    if (this.data.userInfo.grade) {
      const gradeFromBackend = this.data.userInfo.grade;
      const gradeWithSuffix = `${gradeFromBackend}级`;
      const index = this.data.gradeRange.indexOf(gradeWithSuffix);
      if (index !== -1) {
        this.setData({ 
          gradeIndex: index,
          displayGrade: gradeWithSuffix
        });
        console.log(`找到年级匹配: ${gradeWithSuffix}, 索引: ${index}`);
      } else {
        console.warn(`未找到年级 ${gradeWithSuffix} 在选项列表中`);
      }
    }
    
    // 设置学院选择器的初始索引
    if (this.data.userInfo.college) {
      const collegeIndex = this.data.collegeNames.indexOf(this.data.userInfo.college);
      if (collegeIndex !== -1) {
        this.setData({ collegeIndex });
        console.log(`找到学院匹配: ${this.data.userInfo.college}, 索引: ${collegeIndex}`);
      }
    }
    
    console.log('加载的用户信息:', JSON.stringify(this.data.userInfo, null, 2));
  },
  
  loadIcons() {
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
        icons: {
          greenEdit: resources.greenEdit,
          whiteCat: resources.whiteCat
        }
      });
    }
  },

  /**
   * 从缓存加载用户信息
   */
  loadUserProfileFromCache() {
    console.log('[EditPage] 从缓存加载用户信息');
    
    const cachedProfile = getUserProfile();
    
    if (cachedProfile && cachedProfile.real_name) {
      console.log('[EditPage] 缓存中的用户信息:', cachedProfile);
      
      this.setData({
        userInfo: {
          avatar: cachedProfile.profile_photo || this.data.userInfo.profile_photo,
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
      
      console.log('[EditPage] 用户信息已加载:', this.data.userInfo);
    } else {
      console.warn('[EditPage] 缓存中没有用户信息,使用默认值');
      wx.showToast({
        title: '用户信息加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 更新本地缓存中的用户信息
   */
  updateLocalCache(updatedFields) {
    console.log('[EditPage] 开始更新本地缓存', updatedFields);
    
    try {
      const cachedProfile = getUserProfile() || {};
      const updatedProfile = {
        ...cachedProfile,
        ...updatedFields
      };
      
      wx.setStorageSync(USER_PROFILE_KEY, updatedProfile);
      console.log('[EditPage] 缓存更新成功:', updatedProfile);
      
      return true;
    } catch (error) {
      console.error('[EditPage] 缓存更新失败:', error);
      return false;
    }
  },

  /**
   * 新增：验证新用户必填字段
   */
  validateRequiredFields() {
    const requiredFields = {
      'real_name': '姓名',
      'phone_num': '联系电话',
      'qq': 'QQ',
      'student_id': '学号',
      'college': '学院',
      'grade': '年级'
    };

    const emptyFields = [];

    for (let [field, label] of Object.entries(requiredFields)) {
      const value = this.data.userInfo[field];
      if (!value || value === '' || value === null || value === undefined) {
        emptyFields.push(label);
      }
    }

    return emptyFields;
  },

  // 初始化年级选项范围
  initGradeRange() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    let latestEnrollmentYear = currentYear;
    if (currentMonth < 9) {
      latestEnrollmentYear = currentYear - 1;
    }
    
    const earliestYear = latestEnrollmentYear - 25;
    const grades = [];
    for (let year = latestEnrollmentYear; year >= earliestYear; year--) {
      grades.push(`${year}级`);
    }
    
    this.setData({
      gradeRange: grades
    });
    
    console.log('年级范围:', grades);
    console.log('最近入学年份:', latestEnrollmentYear);
    console.log('最早年份:', earliestYear);
  },

  onNameFocused() {
    this.setData({ isNameFocused: true });
  },
  onNameBlur() {
    this.setData({ isNameFocused: false });
  },
  onPhoneFocused() {
    this.setData({ isPhoneFocused: true });
  },
  onPhoneBlur() {
    this.setData({ isPhoneFocused: false });
  },
  onQQFocused() {
    this.setData({ isQQFocused: true });
  },
  onQQBlur() {
    this.setData({ isQQFocused:false });
  },
  onStudentIDFocused() {
    this.setData({ isStudentIDFocused: true });
  },
  onStudentIDBlur() {
    this.setData({ isStudentIDFocused:false });
  },
  onCollegeFocused() {
    this.setData({ isCollegeFocused: true });
  },
  onCollegeBlur() {
    this.setData({ isCollegeFocused:false });
  },
  onMottoFocused() {
    this.setData({ isMottoFocused: true });
  },
  onMottoBlur() {
    this.setData({ isMottoFocused: false });
  },

  updateRealName(e) {
    this.setData({
      'userInfo.real_name': e.detail.value,
      isNameChanged: true
    });
    console.log("更新真实姓名为：", this.data.userInfo.real_name);
  },

  updateContact(e) {
    const phone = e.detail.value;
    const isNumeric = /^\d*$/.test(phone);
    const isValidLength = phone.length === 11 || phone.length === 0;
    
    let isValid = true;
    let errorMsg = "";
    
    if (phone && !isNumeric) {
      isValid = false;
      errorMsg = "有非法字符";
      console.log("电话包含非数字字符");
    } else if (phone && !isValidLength) {
      isValid = false;
      errorMsg = "请输入11位电话号码";
      console.log("电话长度不是11位: " + phone.length);
    }

    console.log("电话验证: ", {
      phone, 
      isNumeric, 
      isValidLength, 
      isValid, 
      errorMsg
    });

    this.setData({
      ...(!isNumeric ? {} : {'userInfo.phone_num': phone}),
      isPhoneChanged: isNumeric ? true : this.data.isPhoneChanged,
      isPhoneValid: isValid,
      phoneErrorMsg: errorMsg
    });
    console.log("更新个人电话为：", this.data.userInfo.phone_num);
  },

  updateQQ(e) {
    this.setData({
      'userInfo.qq': e.detail.value,
      isQQChanged: true
    });
    console.log("更新QQ为：", this.data.userInfo.qq);
  },

  updateStudentID(e) {
    this.setData({
      'userInfo.student_id': e.detail.value,
      isStudentIDChanged: true
    });
    console.log("更新学号为：", this.data.userInfo.student_id);
  },

  bindCollegeChange(e) {
    const index = e.detail.value;
    
    this.setData({
      collegeIndex: index,
      'userInfo.college': this.data.collegeNames[index],
      isCollegeChanged: true,
    });
    
    console.log('选择的学院:', this.data.collegeNames[index]);
  },

  bindGradeChange(e) {
    const index = e.detail.value;
    const selectedGradeWithSuffix = this.data.gradeRange[index];
    const gradeNumberOnly = selectedGradeWithSuffix.replace('级', '');
    
    this.setData({
      gradeIndex: index,
      'userInfo.grade': gradeNumberOnly,
      isGradeChanged: true,
      displayGrade: selectedGradeWithSuffix,
    });
    
    console.log('选择的年级:', gradeNumberOnly);
  },

  updateMotto(e) {
    this.setData({
      'userInfo.motto': e.detail.value,
      isMottoChanged: true
    });
    console.log("更新座右铭为：", this.data.userInfo.motto);
  },

  editAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath;
        this.setData({
          'userInfo.avatar': path,
          tempAvatar: path
        });
        console.log("选择新头像临时路径: ", this.data.tempAvatar);
      },
    });
  },

  saveChanges() {
    console.log('[EditPage] 开始保存，当前状态:', {
      isNewMember: this.data.isNewMember,
      userInfo: this.data.userInfo
    });

    // 验证电话号码
    if (!this.data.isPhoneValid) {
      wx.showToast({ 
        title: "请输入正确的电话号码", 
        icon: "none" 
      });
      return;
    }

    // 新增：如果是新用户，验证所有必填字段
    if (this.data.isNewMember) {
      const emptyFields = this.validateRequiredFields();
      
      if (emptyFields.length > 0) {
        const fieldsList = emptyFields.join('、');
        wx.showToast({
          title: `${fieldsList}为必填项`,
          icon: 'none',
          duration: 1500
        });
        console.log('[EditPage] 新用户必填字段验证失败，未填写:', emptyFields);
        return;
      }
      
      console.log('[EditPage] 新用户必填字段验证通过');
    }

    const uploadAndSaveProfile = () => {
      const updateData = {
        data: {}
      };
      const changedFields = {};

      // 新增：如果是新用户模式，强制提交所有必填字段
      if (this.data.isNewMember) {
        updateData.data.real_name = this.data.userInfo.real_name;
        updateData.data.phone_num = this.data.userInfo.phone_num;
        updateData.data.qq = this.data.userInfo.qq;
        updateData.data.student_id = this.data.userInfo.student_id;
        updateData.data.college = this.data.userInfo.college;
        updateData.data.grade = this.data.userInfo.grade;
        
        changedFields.real_name = this.data.userInfo.real_name;
        changedFields.phone_num = this.data.userInfo.phone_num;
        changedFields.qq = this.data.userInfo.qq;
        changedFields.student_id = this.data.userInfo.student_id;
        changedFields.college = this.data.userInfo.college;
        changedFields.grade = this.data.userInfo.grade;

        // 如果有座右铭也一起提交
        if (this.data.userInfo.motto) {
          updateData.data.motto = this.data.userInfo.motto;
          changedFields.motto = this.data.userInfo.motto;
        }
      } else {
        // 原有逻辑：只提交有变化且非空的字段
        if (this.data.isNameChanged && this.data.userInfo.real_name) {
          updateData.data.real_name = this.data.userInfo.real_name;
          changedFields.real_name = this.data.userInfo.real_name;
        }
        if (this.data.isPhoneChanged && this.data.userInfo.phone_num) {
          updateData.data.phone_num = this.data.userInfo.phone_num;
          changedFields.phone_num = this.data.userInfo.phone_num;
        }
        if (this.data.isQQChanged && this.data.userInfo.qq) {
          updateData.data.qq = this.data.userInfo.qq;
          changedFields.qq = this.data.userInfo.qq;
        }
        if (this.data.isStudentIDChanged && this.data.userInfo.student_id) {
          updateData.data.student_id = this.data.userInfo.student_id;
          changedFields.student_id = this.data.userInfo.student_id;
        }
        if (this.data.isCollegeChanged && this.data.userInfo.college) {
          updateData.data.college = this.data.userInfo.college;
          changedFields.college = this.data.userInfo.college;
        }
        if (this.data.isGradeChanged && this.data.userInfo.grade) {
          updateData.data.grade = this.data.userInfo.grade;
          changedFields.grade = this.data.userInfo.grade;
        }
        if (this.data.isMottoChanged && this.data.userInfo.motto) {
          updateData.data.motto = this.data.userInfo.motto;
          changedFields.motto = this.data.userInfo.motto;
        }
      }

      if (this.data.userInfo.avatar && !this.data.tempAvatar) {
        updateData.data.profile_photo = this.data.userInfo.avatar;
      }

      console.log('[EditPage] 准备提交的数据:', updateData);
      console.log('[EditPage] 变化的字段:', changedFields);

      wx.request({
        url: config.users.profile,
        method: "PATCH",
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: updateData,
        success: (res) => {
          console.log('[EditPage] 后端响应:', res);
          
          if (res.statusCode === 200) {
            // 更新本地缓存
            const cacheUpdateSuccess = this.updateLocalCache(changedFields);
            
            // 如果是新用户模式，清除检查标志
            if (this.data.isNewMember) {
              clearProfileCheckFlag();
              console.log('[EditPage] 新用户信息完善成功，已清除检查标志');
            }
            
            if (cacheUpdateSuccess) {
              wx.showToast({ 
                title: "保存成功",
                icon: "success"
              });
              
              setTimeout(() => {
                // 新增：根据是否为新用户决定跳转路径
                if (this.data.isNewMember) {
                  // 新用户完善信息后返回首页
                  wx.redirectTo({
                    url: '/pages/index/index',
                    fail: () => {
                      // 如果redirectTo失败，尝试reLaunch
                      wx.reLaunch({
                        url: '/pages/index/index'
                      });
                    }
                  });
                } else {
                  // 普通编辑返回上一页
                  wx.navigateBack({ delta: 1 });
                }
              }, 1500);
            } else {
              wx.showToast({ 
                title: "保存成功但缓存更新失败",
                icon: "none"
              });
              
              setTimeout(() => {
                if (this.data.isNewMember) {
                  wx.redirectTo({ url: '/pages/index/index' });
                } else {
                  wx.navigateBack({ delta: 1 });
                }
              }, 1500);
            }
          } else {
            wx.showToast({ 
              title: "保存失败", 
              icon: "error" 
            });
          }
        },
        fail: (error) => {
          console.error('[EditPage] 请求失败:', error);
          wx.showToast({ 
            title: "保存失败", 
            icon: "error" 
          });
        }
      });
    };
    
    if (this.data.tempAvatar) {
      wx.uploadFile({
        filePath: this.data.tempAvatar,
        name: "file",
        url: config.users.profile_photo,
        header: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        success: (upRes) => {
          console.log('[EditPage] 头像上传响应:', upRes);
          const data = JSON.parse(upRes.data);
          console.log('[EditPage] 头像上传返回数据:', data);

          if (upRes.statusCode === 200 && data.data.profile_photo) {
            const newAvatarUrl = data.data.profile_photo;
            this.setData({ 
              'userInfo.avatar': newAvatarUrl
            });
            
            this.updateLocalCache({
              profile_photo: newAvatarUrl
            });
            
            console.log('[EditPage] 头像上传成功,URL:', newAvatarUrl);
            uploadAndSaveProfile();
          } else {
            console.error('[EditPage] 头像上传失败:', data);
            wx.showToast({ 
              title: "头像上传失败", 
              icon: "error"
            });
          }
        },
        fail: (error) => {
          console.error('[EditPage] 头像上传失败:', error);
          wx.showToast({ 
            title: "头像上传失败", 
            icon: "error" 
          });
        }
      });
    } else {
      uploadAndSaveProfile();
    }
  },

  handlerGobackClick() {
    // 新增：如果是新用户模式，阻止返回
    // if (this.data.isNewMember) {
    //   wx.showModal({
    //     title: '提示',
    //     content: '请先完善个人信息后再进行其他操作',
    //     showCancel: false,
    //     confirmText: '知道了'
    //   });
    //   return;
    // }
    
    wx.navigateBack({ delta: 1 });
  },
});
