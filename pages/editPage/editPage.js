// pages/editPage/editPage.js

var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync("auth_token");
const app = getApp();
const { getUserProfile, USER_PROFILE_KEY } = require('../index/index.js');

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
    isPhoneValid: true, // 电话号码是否有效的标志
    phoneErrorMsg: "", // 电话错误信息
    gradeRange: [],  // 新增:年级选项数组
    gradeIndex: 0,    // 新增:当前选中的年级索引
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
    console.log("[Edit Page] 获取本页图标资源")
    this.loadIcons();
    this.loadUserProfileFromCache();

    // 初始化年级选项
    console.log("初始化年级选项")
    this.initGradeRange();

    if (this.data.userInfo.grade) {
      const gradeFromBackend = this.data.userInfo.grade;
      const gradeWithSuffix = `${gradeFromBackend}级`;  // 转换为带"级"字的格式
      const index = this.data.gradeRange.indexOf(gradeWithSuffix);
      if (index !== -1) {
        this.setData({ 
          gradeIndex: index,
          displayGrade: gradeWithSuffix  // 设置显示用的年级
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
    // 输出从me页面传送来的数据
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
      })
    }
  },

  /**
   * 从缓存加载用户信息
   */
  loadUserProfileFromCache() {
    console.log('[Me] 从缓存加载用户信息');
    
    const cachedProfile = getUserProfile();
    
    if (cachedProfile && cachedProfile.real_name) {
      console.log('[Me] 缓存中的用户信息:', cachedProfile);
      
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
      
      console.log('[Me] 用户信息已加载:', this.data.userInfo);
    } else {
      console.warn('[Me] 缓存中没有用户信息,使用默认值');
      wx.showToast({
        title: '用户信息加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 更新本地缓存中的用户信息
   * @param {Object} updatedFields - 需要更新的字段对象
   */
  updateLocalCache(updatedFields) {
    console.log('[EditPage] 开始更新本地缓存', updatedFields);
    
    try {
      // 获取当前缓存的完整用户信息
      const cachedProfile = getUserProfile() || {};
      
      // 合并更新的字段
      const updatedProfile = {
        ...cachedProfile,
        ...updatedFields
      };
      
      // 保存回缓存
      wx.setStorageSync(USER_PROFILE_KEY, updatedProfile);
      
      console.log('[EditPage] 缓存更新成功:', updatedProfile);
      
      return true;
    } catch (error) {
      console.error('[EditPage] 缓存更新失败:', error);
      return false;
    }
  },

  // 初始化年级选项范围
  initGradeRange() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 月份从0开始,需要+1
    
    // 判断当前最近可能的入学年份
    // 如果当前月份 >= 9月(开学季),则当年可以入学
    // 如果当前月份 < 9月,则最近入学年份是去年
    let latestEnrollmentYear = currentYear;
    if (currentMonth < 9) {
      latestEnrollmentYear = currentYear - 1;
    }
    
    // 最早年份 = 最近入学年份 - 25
    const earliestYear = latestEnrollmentYear - 25;
    
    // 生成年级数组(从最新到最旧)
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

  // 更改用户真实姓名
  updateRealName(e) {
    this.setData(
      { 'userInfo.real_name': e.detail.value ,
       isNameChanged: true }
    );
  },

  // 更改用户联系电话
  updateContact(e) {
    const phone = e.detail.value;
    // 验证是否只有数字
    const isNumeric = /^\d*$/.test(phone);
    // 验证是否是11位数字或者是空的（允许用户清空输入）
    const isValidLength = phone.length === 11 || phone.length === 0;
    
    // 设置验证状态
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
      // 如果有非法字符，不更新phone_num值，但仍然更新验证状态
      ...(!isNumeric ? {} : {'userInfo.phone_num': phone}),
      isPhoneChanged: isNumeric ? true : this.data.isPhoneChanged,
      isPhoneValid: isValid,
      phoneErrorMsg: errorMsg
    });
  },
  // 更改用户qq
  updateQQ(e) {
    this.setData(
      { 'userInfo.qq': e.detail.value,
      isQQChanged: true }
    )
  },
  // 更改用户学号
  updateStudentID(e) {
    this.setData(
      { 'userInfo.student_id': e.detail.value,
      isStudentIDChanged: true }
    )
  },
  // 更改用户学院
  bindCollegeChange(e) {
    const index = e.detail.value;
    
    this.setData({
      collegeIndex: index,
      'userInfo.college': this.data.collegeNames[index],
      isCollegeChanged: true,
    });
    
    console.log('选择的学院:', this.data.collegeNames[index]);
  },
  // 年级选择改变事件
  bindGradeChange(e) {
    const index = e.detail.value;
    const selectedGradeWithSuffix = this.data.gradeRange[index];
    const gradeNumberOnly = selectedGradeWithSuffix.replace('级', '');  // 提取纯数字 "2024"
    
    this.setData({
      gradeIndex: index,
      'userInfo.grade': gradeNumberOnly,
      isGradeChanged: true,
      displayGrade: selectedGradeWithSuffix,
    });
    
    console.log('选择的年级:', gradeNumberOnly);
  },
  // 更改用户座右铭
  updateMotto(e) {
    this.setData(
      { 'userInfo.motto': e.detail.value ,
       isMottoChanged: true }
    );
  },

  // 修改头像选择函数，只存储本地临时路径，暂不上传
  editAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath;
        this.setData({
          // oldAvatar: this.data.userInfo.avatar,
          'userInfo.avatar': path,
          tempAvatar: path // 保存临时文件路径
        });
        // 输出更新图片
        console.log("选择新头像临时路径: ", this.data.tempAvatar);
        // console.log("暂存老头像: ", this.data.oldAvatar);
      },
    });
  },

  saveChanges() {
    // 首先验证电话号码
    if (!this.data.isPhoneValid) {
      wx.showToast({ 
        title: "请输入正确的电话号码", 
        icon: "none" 
      });
      return; // 如果电话无效，不继续执行保存
    }
    const uploadAndSaveProfile = () => {
      // 准备更新的数据
      const updateData = {
        data: {}
      };
      // 收集所有变化的字段
      const changedFields = {};

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
      if (this.data.userInfo.avatar && !this.data.tempAvatar) {
        updateData.data.profile_photo = this.data.userInfo.avatar;
      }

      console.log('[EditPage] 准备提交的数据:', updateData);
      console.log('[EditPage] 变化的字段:', changedFields);

      // 将更新好的用户除头像外的数据从/users/profile发出
      wx.request({
        url: config.users.profile,
        method: "PATCH",
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: updateData,
        success: (res) => {
          if (res.statusCode === 200) {
            // 保存成功后的操作
            // 更新本地缓存
            const cacheUpdateSuccess = this.updateLocalCache(changedFields);
            if (cacheUpdateSuccess) {
              wx.showToast({ 
                title: "保存成功",
                icon: "success"
              });
              
              // 延迟返回,让用户看到成功提示
              setTimeout(() => {
                wx.navigateBack({ delta: 1 });
              }, 1500);
            } else {
              wx.showToast({ 
                title: "保存成功但缓存更新失败",
                icon: "none"
              });
              
              setTimeout(() => {
                wx.navigateBack({ delta: 1 });
              }, 1500);
            }
          } else {
            wx.showToast({ 
              title: "保存失败", 
              icon: "error" 
            });
          }
        },
        fail: () => {
          console.error('[EditPage] 请求失败:', error);
          wx.showToast({ title: "保存失败", icon: "error" });
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
            // 更新头像URL并继续更新其他资料
            const newAvatarUrl = data.data.profile_photo;
            this.setData({ 
              'userInfo.avatar': newAvatarUrl
            });
            // 更新缓存中的头像
            this.updateLocalCache({
              profile_photo: newAvatarUrl
            });
            
            console.log('[EditPage] 头像上传成功,URL:', newAvatarUrl);
            
            // 继续更新其他资料
            uploadAndSaveProfile();
          } else {
            console.error('[EditPage] 头像上传失败:', error);
            wx.showToast({ title: "头像上传失败", icon: "error"});
          }
        },
        fail: () => {
          console.error('[EditPage] 头像上传失败:', error);
          wx.showToast({ title: "头像上传失败", icon: "error" });
        }
      });
    } else {
      // 没有新头像，直接更新其他资料
      uploadAndSaveProfile();
    }
  },

  handlerGobackClick() {
    wx.navigateBack({ delta: 1 });
  },
});
