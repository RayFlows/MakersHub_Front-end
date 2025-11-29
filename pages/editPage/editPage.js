// pages/editPage/editPage.js

var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync("auth_token");
const app = getApp();

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
    // oldAvatar: "",
    isNameFocused: false,
    isPhoneFocused: false,
    isQQFocused: false,
    isStudentIDFocused: false,
    isCollegeFocused: false,
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
    icons: {}
  },

  onLoad(options) {
    console.log("[Edit Page] 获取本页图标资源")
    this.loadIcons();

    // 初始化年级选项
    console.log("初始化年级选项")
    this.initGradeRange();
  
    // 加载从me页面传来的数据
    this.setData({
      userInfo: {
        real_name: options.real_name ? decodeURIComponent(options.real_name) : "",
        phone_num: options.phone_num ? decodeURIComponent(options.phone_num) : "",
        qq: options.qq ? decodeURIComponent(options.qq) : "",
        student_id: options.student_id ? decodeURIComponent(options.student_id) : "",
        college: options.college ? decodeURIComponent(options.college) : "",
        grade: options.grade ? decodeURIComponent(options.grade) : "",
        avatar: options.avatar ? decodeURIComponent(options.avatar) : "",
        motto: options.motto ? decodeURIComponent(options.motto) : ""
      }
    });

    if (this.data.userInfo.grade) {
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

    // 输出从me页面传送来的数据
    console.log('接收到的参数:', JSON.stringify(this.data.userInfo, null, 2));
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
  updateCollege(e) {
    this.setData(
      { 'userInfo.college': e.detail.value,
      isCollegeChanged: true }
    )
  },
  // 年级选择改变事件
  bindGradeChange(e) {
    const index = e.detail.value;
    const selectedGradeWithSuffix = this.data.gradeRange[index];
    const gradeNumberOnly = selectedGradeWithSuffix.replace('级', '');  // 提取纯数字 "2024"
    
    this.setData({
      gradeIndex: index,
      'userInfo.grade': selectedGradeWithSuffix,
      isGradeChanged: true,
    });
    
    console.log('选择的年级:', selectedGradeWithSuffix);
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
      if(this.data.userInfo.real_name) {
        updateData.data.real_name = this.data.userInfo.real_name;
      }
      if (this.data.userInfo.phone_num) {
        updateData.data.phone_num = this.data.userInfo.phone_num;
      }
      if(this.data.userInfo.qq) {
        updateData.data.qq = this.data.userInfo.qq;
      }
      if (this.data.userInfo.student_id) {
        updateData.data.student_id = this.data.userInfo.student_id;
      }
      if (this.data.userInfo.college) {
        updateData.data.college = this.data.userInfo.college;
      }
      if (this.data.userInfo.grade) {  
        updateData.data.grade = this.data.userInfo.grade;
      }
      if (this.data.userInfo.motto) {
        updateData.data.motto = this.data.userInfo.motto;
      }
      // 图片没有被更改过
      if(this.data.userInfo.avatar) {
        updateData.data.profile_photo = this.data.userInfo.avatar;
      }

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
            wx.showToast({ title: "保存成功" });
            // 直接返回上一页，让me页面重新获取数据
            // wx.setStorageSync('UserInfo', updateData);
            setTimeout(() => {
              wx.navigateBack({ delta: 1 });
            }, 1500);
          } else {
            wx.showToast({ title: "保存失败", icon: "error" });
          }
        },
        fail: () => {
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
          const data = JSON.parse(upRes.data);
          console.log("后端返回: ", data);
          if (upRes.statusCode === 200 && data.data.profile_photo) {
            // 更新头像URL并继续更新其他资料
            this.setData({ 
              'userInfo.avatar': data.data.profile_photo 
            });
            uploadAndSaveProfile();
          } else {
            wx.showToast({ title: "头像上传失败", icon: "error"});
          }
        },
        fail: () => {
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
