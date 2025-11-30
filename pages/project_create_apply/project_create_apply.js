// pages/project_create_apply.js
const app = getApp();
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const { getUserProfile, USER_PROFILE_KEY } = require('../index/index.js');

// ============ 调试模式开关 ============
const DEBUG_MODE = false; // 设置为 false 时使用真实接口
// ====================================

Page({

  /**
   * 页面的初始数据
   */
  data: {
    formData: {
      personal_info: {
        name: '',
        college: '',
        grade: '', 
        student_id: '',
        phone_num: '',
        qq: '',
      },
      project_info: {
        project_name: '',
        project_type: '',
        description: '',
        is_recruiting: '',
        mentor_name: '',
        mentor_phone: '',
        start_time: '',
        ent_time: ''
      },
      participants: []
    },
    isEdit: false,
    isRecruiting: ['否', '是'],
    projectType: ['个人项目', '比赛项目'],
    projectTypeIndex: 0,
    isRecruitingIndex: 0,
    selectedProjectType: '',
    selectedIsRecruiting: '',
    // 交互特效相关变量
    isProjectNameFocused: false,
    isDescriptionFocused: false,
    isMentorNameFocused: false,
    isMentorPhoneFocused: false,
    // 弹窗相关
    showModal: false,
    searchPhone: '',
    searchResults: [],
    selectedMember: null,
    searchTimer: null,
    hasSearched: false, // 新增:标记是否已执行过搜索
    // 当前日期信息
    currentYear: 0,
    currentMonth: 0,
    currentDay: 0,
    
    // 选择器选项
    startYearOptions: [],
    startMonthOptions: [],
    startDayOptions: [],
    
    endYearOptions: [],
    endMonthOptions: [],
    endDayOptions: [],

    // 起借日期选择相关
    startSelectedYear: '',
    startSelectedMonth: '',
    startSelectedDay: '',
    startCurrentDays: [], // 根据月份动态调整
    
    // 归还日期选择相关
    endSelectedYear: '',
    endSelectedMonth: '',
    endSelectedDay: '',
    endCurrentDays: [], // 根据月份动态调整
    icons: {}
  },

  bindTypeChange: function (e) {
    this.setData({
      selectedProjectType: this.data.projectType[e.detail.value],
      projectTypeIndex: e.detail.value
    })
    console.log('项目类型选择改变，携带值为', this.data.selectedProjectType)
    console.log('当前index值：', this.data.projectTypeIndex)
    this.setData({
      'formData.project_info.project_type': e.detail.value
    });
  },

  bindIsRecruitingChange: function (e) {
    this.setData({
      selectedIsRecruiting: this.data.isRecruiting[e.detail.value],
      isRecruitingIndex: e.detail.value
    })
    console.log('项目是否选择招募改变，携带值为', this.data.selectedIsRecruiting)
    console.log('当前index值：', this.data.isRecruitingIndex)
    this.setData({
      'formData.project_info.is_recruiting': e.detail.value
    });
  },

  loadIcons() {
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
      icons: {
        whiteCat: resources.whiteCat,
        cancel: resources.cancel,
        find: resources.find
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
        'formData.personal_info': {  // ✅ 只更新 personal_info
          name: cachedProfile.real_name || '',
          phone_num: cachedProfile.phone_num || '',
          qq: cachedProfile.qq || '',
          student_id: cachedProfile.student_id || '',
          college: cachedProfile.college || '',
          grade: cachedProfile.grade || '',
        }
      });
      
      console.log('[Me] 用户信息已加载:', this.data.formData.personal_info);
    } else {
      console.warn('[Me] 缓存中没有用户信息,使用默认值');
      wx.showToast({
        title: '用户信息加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  onProjectNameFocus() {
    this.setData({ isProjectNameFocused: true });
  },
  onProjectNameBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isProjectNameFocused: false,
      'formData.project_info.project_name': value
    });
    console.log("更新项目名: ", value);
  },
  
  onDescriptionFocused() {
    this.setData({ isDescriptionFocused: true });
  },
  onDescriptionBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isDescriptionFocused: false,
      'formData.project_info.description': value
    });
    console.log("更新项目描述：", value);
  },

  onMentorNameFocused() {
    this.setData({ isMentorNameFocused: true });
  },
  onMentorNameBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isMentorNameFocused: false,
      'formData.project_info.mentor_name': value
    });
    console.log("更新指导导师姓名：", value);
  },

  onMentorPhoneFocused() {
    this.setData({ isMentorPhoneFocused: true });
  },
  onMentorPhoneBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isMentorPhoneFocused: false,
      'formData.project_info.mentor_phone': value
    });
    console.log("更新指导导师电话：", value);
  },

  // ========== Mock 数据 ==========
  getMockSearchResults(phone) {
    // 模拟后端返回的数据
    const allMockUsers = [
      { real_name: "张三", college: "计算机学院", phone_num: "13800138000", maker_id: "MK20251123225706077_863" },
      { real_name: "张小明", college: "软件学院", phone_num: "13855556666", maker_id: "MK20251123225706077_862" },
      { real_name: "李四", college: "电子信息学院", phone_num: "13912345678", maker_id: "MK20251123225706077_861" },
      { real_name: "王五", college: "数学学院", phone_num: "13923456789", maker_id: "MK20251123225706077_860" },
      { real_name: "赵六", college: "物理学院", phone_num: "13934567890", maker_id: "MK20251123225706077_859" },
      { real_name: "钱七", college: "化学学院", phone_num: "13945678901", maker_id: "MK20251123225706077_858" },
      { real_name: "孙八", college: "生物学院", phone_num: "13956789012", maker_id: "MK20251123225706077_857" }
    ];

    // 根据输入的 phone 过滤匹配的结果
    const filtered = allMockUsers.filter(user => 
      user.phone_num.includes(phone)
    );

    // 返回前5个结果
    return filtered.slice(0, 5);
  },

  // ========== 搜索输入处理 ==========
  onSearchInput(e) {
    const phone = e.detail.value;
    this.setData({
      searchPhone: phone,
      selectedMember: null,
      hasSearched: false // 输入时重置搜索状态
    });
  
    // 清除之前的定时器
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }
  
    // 如果输入为空,清空结果
    if (!phone || phone.length === 0) {
      this.setData({
        searchResults: [],
        hasSearched: false
      });
      return;
    }
  
    // 防抖搜索 - 150ms 后执行
    const timer = setTimeout(() => {
      this.searchMembers(phone);
    }, 150);
  
    this.setData({
      searchTimer: timer
    });
  },

  // ========== 搜索成员 ==========
  searchMembers(phone) {
    console.log('开始搜索:', phone);
  
    if (DEBUG_MODE) {
      // ====== 调试模式:使用 Mock 数据 ======
      console.log('[DEBUG] 使用 Mock 数据');
      
      setTimeout(() => {
        const mockResults = this.getMockSearchResults(phone);
        console.log('[DEBUG] Mock 结果:', mockResults);
        
        this.setData({
          searchResults: mockResults,
          hasSearched: true // 标记已完成搜索
        });
      }, 300); // 模拟网络延迟
      
    } else {
      // ====== 生产模式:调用真实接口 ======
      wx.request({
        url: config.users.find_by_phonenum,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        data: {
          phone_num: phone
        },
        success: (res) => {
          console.log('接口返回:', res);
          
          if (res.statusCode === 200 && res.data.code === 200) {
            // 取前5个结果
            const results = (res.data.data || []).slice(0, 5);
            this.setData({
              searchResults: results,
              hasSearched: true // 标记已完成搜索
            });
          } else {
            console.error('接口返回错误:', res.data.msg);
            this.setData({
              searchResults: [],
              hasSearched: true // 标记已完成搜索
            });
            wx.showToast({
              title: res.data.msg || '搜索失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('搜索失败:', err);
          this.setData({
            searchResults: [],
            hasSearched: true // 标记已完成搜索
          });
          wx.showToast({
            title: '网络错误,请重试',
            icon: 'none'
          });
        }
      });
    }
  },

  // ========== 清空搜索 ==========
  clearSearch() {
    this.setData({
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false // 清空时重置搜索状态
    });
  },

  // ========== 选择成员 ==========
  selectMember(e) {
    const index = e.currentTarget.dataset.index;
    const member = this.data.searchResults[index];
    
    console.log('选择成员:', member);
    
    // 格式化显示文本
    const displayText = `${member.real_name} - ${member.phone_num} - ${member.college}`;
    
    this.setData({
      selectedMember: member,
      searchPhone: displayText,
      searchResults: [],
      hasSearched: false // 选择后重置搜索状态
    });
  },

  // ========== 确认添加成员 ==========
  confirmAddMember() {
    if (!this.data.selectedMember) {
      wx.showToast({
        title: '请先选择一个成员',
        icon: 'none'
      });
      return;
    }

    const selectedMember = this.data.selectedMember;
    
    // 检查是否已存在该成员
    const exists = this.data.formData.participants.some(
      p => p.phone_num === selectedMember.phone_num
    );

    if (exists) {
      wx.showToast({
        title: '该成员已是成员!',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 添加到成员列表
    const newMember = {
      real_name: selectedMember.real_name,
      phone_num: selectedMember.phone_num,
      college: selectedMember.college,
      maker_id: selectedMember.maker_id
    };

    const participants = [...this.data.formData.participants, newMember];
    
    this.setData({
      'formData.participants': participants
    });

    console.log('添加成员成功:', newMember);
    console.log('当前成员列表:', participants);

    // 显示成功提示
    // wx.showToast({
    //   title: '添加成功',
    //   icon: 'success'
    // });

    // 关闭弹窗
    this.hideModal();
  },

  // ========== 删除成员 ==========
  deleteMember(e) {
    const index = e.currentTarget.dataset.index;
    const member = this.data.formData.participants[index];
    
    wx.showModal({
      title: '提示',
      content: `确定移除 ${member.real_name} 吗?`,
      success: (res) => {
        if (res.confirm) {
          const participants = this.data.formData.participants.filter((_, i) => i !== index);
          this.setData({
            'formData.participants': participants
          });
          console.log('删除成员后列表:', participants);
          
          // wx.showToast({
          //   title: '已移除',
          //   icon: 'success'
          // });
        }
      }
    });
  },

  // ========== 显示/隐藏弹窗 ==========
  showMemberModal() {
    console.log('当前项目成员数：', this.data.formData.participants.length)
    if(this.data.formData.participants.length === 15) {
      wx.showToast({
        title:'已达成员人数上限',
        icon: 'none',
        duration: 2000
      })
    } 
    else {
      this.setData({
        showModal: true,
        searchPhone: '',
        searchResults: [],
        selectedMember: null,
        hasSearched: false
      });
    }
  },

  hideModal() {
    this.setData({
      showModal: false,
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false
    });
  },

  // ========== 阻止事件冒泡 ==========
  stopPropagation() {},

  // ========== 搜索框焦点事件 ==========
  onSearchFocus() {
    console.log('搜索框获得焦点');
  },


  // 初始化日期选择器
  initDatePickers() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    this.setData({
      currentYear: currentYear,
      currentMonth: currentMonth,
      currentDay: currentDay
    });
    
    // 初始化起始日期选择器(从当前日期开始)
    this.updateStartYearOptions();
    this.updateStartMonthOptions();
    this.updateStartDayOptions();
    
    // 设置起始日期默认值为当前日期
    this.setData({
      startSelectedYear: currentYear + '年',
      startSelectedMonth: currentMonth + '月',
      startSelectedDay: currentDay + '日'
    });
    
    // 初始化结束日期选择器(从当前日期开始)
    this.updateEndYearOptions();
    this.updateEndMonthOptions();
    this.updateEndDayOptions();
    
    // 更新formData
    this.updateStartTimeInFormData();
  },

  // 更新起始日期的年份选项(从当前年份开始)
  updateStartYearOptions() {
    const years = Array.from({ length: 10 }, (_, i) => (this.data.currentYear + i) + '年');
    this.setData({
      startYearOptions: years
    });
  },

  // 更新起始日期的月份选项
  updateStartMonthOptions() {
    if (!this.data.startSelectedYear) return;
    
    const selectedYear = parseInt(this.data.startSelectedYear.replace('年', ''));
    let months = [];
    
    // 如果选择的是当前年份,月份从当前月份开始
    if (selectedYear === this.data.currentYear) {
      const monthCount = 12 - this.data.currentMonth + 1;
      months = Array.from({ length: monthCount }, (_, i) => (this.data.currentMonth + i) + '月');
    } else {
      // 如果是未来年份,显示全部12个月
      months = Array.from({ length: 12 }, (_, i) => (i + 1) + '月');
    }
    
    this.setData({
      startMonthOptions: months
    });
  },

  // 更新起始日期的日期选项
  updateStartDayOptions() {
    if (!this.data.startSelectedYear || !this.data.startSelectedMonth) return;
    
    const selectedYear = parseInt(this.data.startSelectedYear.replace('年', ''));
    const selectedMonth = parseInt(this.data.startSelectedMonth.replace('月', ''));
    
    // 获取当月天数
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    let days = [];
    
    // 如果选择的是当前年月,日期从当前日期开始
    if (selectedYear === this.data.currentYear && selectedMonth === this.data.currentMonth) {
      const dayCount = daysInMonth - this.data.currentDay + 1;
      days = Array.from({ length: dayCount }, (_, i) => (this.data.currentDay + i) + '日');
    } else {
      // 如果是未来年月,显示全部日期
      days = Array.from({ length: daysInMonth }, (_, i) => (i + 1) + '日');
    }
    
    this.setData({
      startDayOptions: days
    });
    
    // 如果当前选择的日期不在新的日期列表中,重置为第一个可选日期
    if (!days.includes(this.data.startSelectedDay)) {
      this.setData({
        startSelectedDay: days[0]
      });
    }
  },

  // 更新结束日期的年份选项(从起始日期的年份开始)
  updateEndYearOptions() {
    if (!this.data.startSelectedYear) {
      // 如果起始日期未选择,从当前年份开始
      const years = Array.from({ length: 10 }, (_, i) => (this.data.currentYear + i) + '年');
      this.setData({
        endYearOptions: years
      });
    } else {
      // 从起始日期的年份开始
      const startYear = parseInt(this.data.startSelectedYear.replace('年', ''));
      const years = Array.from({ length: 10 }, (_, i) => (startYear + i) + '年');
      this.setData({
        endYearOptions: years
      });
    }
  },

  // 更新结束日期的月份选项
  updateEndMonthOptions() {
    if (!this.data.endSelectedYear) return;
    
    const endYear = parseInt(this.data.endSelectedYear.replace('年', ''));
    const startYear = this.data.startSelectedYear ? parseInt(this.data.startSelectedYear.replace('年', '')) : this.data.currentYear;
    const startMonth = this.data.startSelectedMonth ? parseInt(this.data.startSelectedMonth.replace('月', '')) : this.data.currentMonth;
    
    let months = [];
    
    // 如果选择的是起始年份,月份从起始月份开始
    if (endYear === startYear) {
      const monthCount = 12 - startMonth + 1;
      months = Array.from({ length: monthCount }, (_, i) => (startMonth + i) + '月');
    } else {
      // 如果是未来年份,显示全部12个月
      months = Array.from({ length: 12 }, (_, i) => (i + 1) + '月');
    }
    
    this.setData({
      endMonthOptions: months
    });
  },

  // 更新结束日期的日期选项
  updateEndDayOptions() {
    if (!this.data.endSelectedYear || !this.data.endSelectedMonth) return;
    
    const endYear = parseInt(this.data.endSelectedYear.replace('年', ''));
    const endMonth = parseInt(this.data.endSelectedMonth.replace('月', ''));
    const startYear = this.data.startSelectedYear ? parseInt(this.data.startSelectedYear.replace('年', '')) : this.data.currentYear;
    const startMonth = this.data.startSelectedMonth ? parseInt(this.data.startSelectedMonth.replace('月', '')) : this.data.currentMonth;
    const startDay = this.data.startSelectedDay ? parseInt(this.data.startSelectedDay.replace('日', '')) : this.data.currentDay;
    
    // 获取当月天数
    const daysInMonth = new Date(endYear, endMonth, 0).getDate();
    let days = [];
    
    // 如果选择的是起始年月,日期从起始日期开始
    if (endYear === startYear && endMonth === startMonth) {
      const dayCount = daysInMonth - startDay + 1;
      days = Array.from({ length: dayCount }, (_, i) => (startDay + i) + '日');
    } else {
      // 如果是未来年月,显示全部日期
      days = Array.from({ length: daysInMonth }, (_, i) => (i + 1) + '日');
    }
    
    this.setData({
      endDayOptions: days
    });
    
    // 如果当前选择的日期不在新的日期列表中,重置为第一个可选日期
    if (!days.includes(this.data.endSelectedDay)) {
      this.setData({
        endSelectedDay: days[0]
      });
    }
  },

  // 年份选择处理
  onYearChange(e) {
    const target = e.currentTarget.dataset.type || 'start';
    const yearIndex = e.detail.value;
    
    if (target === 'end') {
      const year = this.data.endYearOptions[yearIndex];
      this.setData({ endSelectedYear: year });
      this.updateEndMonthOptions();
      this.updateEndDayOptions();
      this.updateEndTimeInFormData();
    } else {
      const year = this.data.startYearOptions[yearIndex];
      this.setData({ startSelectedYear: year });
      this.updateStartMonthOptions();
      this.updateStartDayOptions();
      this.updateStartTimeInFormData();
      
      // 起始日期变化时,需要更新结束日期的选项
      this.updateEndYearOptions();
      this.updateEndMonthOptions();
      this.updateEndDayOptions();
    }
  },

  // 月份选择处理
  onMonthChange(e) {
    const target = e.currentTarget.dataset.type || 'start';
    const monthIndex = e.detail.value;
    
    if (target === 'end') {
      const month = this.data.endMonthOptions[monthIndex];
      this.setData({ endSelectedMonth: month });
      this.updateEndDayOptions();
      this.updateEndTimeInFormData();
    } else {
      const month = this.data.startMonthOptions[monthIndex];
      this.setData({ startSelectedMonth: month });
      this.updateStartDayOptions();
      this.updateStartTimeInFormData();
      
      // 起始日期变化时,需要更新结束日期的选项
      this.updateEndMonthOptions();
      this.updateEndDayOptions();
    }
  },

  // 日期选择处理
  onDayChange(e) {
    const target = e.currentTarget.dataset.type || 'start';
    const dayIndex = e.detail.value;
    
    if (target === 'end') {
      const day = this.data.endDayOptions[dayIndex];
      this.setData({ endSelectedDay: day });
      this.updateEndTimeInFormData();
    } else {
      const day = this.data.startDayOptions[dayIndex];
      this.setData({ startSelectedDay: day });
      this.updateStartTimeInFormData();
      
      // 起始日期变化时,需要更新结束日期的选项
      this.updateEndDayOptions();
    }
  },

  // 更新formData中的start_time
  updateStartTimeInFormData() {
    if (!this.data.startSelectedYear || !this.data.startSelectedMonth || !this.data.startSelectedDay) return;
    
    const year = parseInt(this.data.startSelectedYear.replace('年', ''));
    const month = parseInt(this.data.startSelectedMonth.replace('月', ''));
    const day = parseInt(this.data.startSelectedDay.replace('日', ''));
    
    // 格式化为YYYY-MM-DD
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    this.setData({
      'formData.project_info.start_time': formattedDate
    });
    
    console.log('更新起始日期:', formattedDate);
  },

  // 更新formData中的end_time
  updateEndTimeInFormData() {
    if (!this.data.endSelectedYear || !this.data.endSelectedMonth || !this.data.endSelectedDay) return;
    
    const year = parseInt(this.data.endSelectedYear.replace('年', ''));
    const month = parseInt(this.data.endSelectedMonth.replace('月', ''));
    const day = parseInt(this.data.endSelectedDay.replace('日', ''));
    
    // 格式化为YYYY-MM-DD
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    this.setData({
      'formData.project_info.end_time': formattedDate
    });
    
    console.log('更新结束日期:', formattedDate);
  },

  // ========== 表单提交 ==========
onSubmit() {
  console.log('开始提交表单');
  
  // 1. 表单验证
  const validation = this.validateForm();
  if (!validation.valid) {
    wx.showToast({
      title: validation.message,
      icon: 'none',
      duration: 2000
    });
    return;
  }

  // 2. 构造提交数据
  const submitData = this.buildSubmitData();
  console.log('提交数据:', submitData);

  // 3. 显示加载提示
  wx.showLoading({
    title: '提交中...',
    mask: true
  });

  if (DEBUG_MODE) {
    // ====== 调试模式:模拟提交 ======
    console.log('[DEBUG] 模拟提交数据:', JSON.stringify(submitData, null, 2));
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '提交成功',
        content: '项目申请已提交(调试模式)',
        showCancel: false,
        success: () => {
          // 返回上一页或跳转到项目列表
          wx.navigateBack();
        }
      });
    }, 1000);
    
  } else {
    // ====== 生产模式:调用真实接口 ======
    wx.request({
      url: config.project.create,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      data: submitData,
      success: (res) => {
        wx.hideLoading();
        console.log('提交响应:', res);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({ 
            title: "提交成功",
            icon: "success"
          });
          
          // 延迟返回,让用户看到成功提示
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 1500);
        } else {
          wx.showModal({
            title: '提交失败',
            content: res.data.msg || '提交失败,请重试',
            showCancel: false
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('提交失败:', err);
        wx.showModal({
          title: '网络错误',
          content: '提交失败,请检查网络后重试',
          showCancel: false
        });
      }
    });
  }
},

// ========== 表单验证 ==========
validateForm() {
  const { project_info, participants } = this.data.formData;
  
  // 验证项目名称
  if (!project_info.project_name || project_info.project_name.trim() === '') {
    return { valid: false, message: '请输入项目名称' };
  }
  
  // 验证项目类型
  if (project_info.project_type === '' || project_info.project_type === null) {
    return { valid: false, message: '请选择项目类型' };
  }
  
  // 验证项目简介
  if (!project_info.description || project_info.description.trim() === '') {
    return { valid: false, message: '请输入项目简介' };
  }
  
  // 验证项目简介长度(建议至少20字)
  if (project_info.description.trim().length < 20) {
    return { valid: false, message: '项目简介至少需要20字' };
  }
  
  // 验证开始日期
  if (!project_info.start_time) {
    return { valid: false, message: '请选择开始日期' };
  }
  
  // 验证结束日期
  if (!project_info.end_time) {
    return { valid: false, message: '请选择结束日期' };
  }
  
  // 验证日期逻辑(结束日期必须晚于开始日期)
  const startDate = new Date(project_info.start_time);
  const endDate = new Date(project_info.end_time);
  if (endDate <= startDate) {
    return { valid: false, message: '结束日期必须晚于开始日期' };
  }
  
  // 验证是否招募成员
  if (project_info.is_recruiting === '' || project_info.is_recruiting === null) {
    return { valid: false, message: '请选择是否招募成员' };
  }
  
  // 验证指导老师姓名
  if (!project_info.mentor_name || project_info.mentor_name.trim() === '') {
    return { valid: false, message: '请输入指导老师姓名' };
  }
  
  // 验证指导老师电话
  if (!project_info.mentor_phone || project_info.mentor_phone.trim() === '') {
    return { valid: false, message: '请输入指导老师电话' };
  }
  
  // 验证电话格式(11位数字)
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(project_info.mentor_phone)) {
    return { valid: false, message: '指导老师电话格式不正确' };
  }
  
  return { valid: true, message: '验证通过' };
},

// ========== 构造提交数据 ==========
buildSubmitData() {
  const { project_info, participants } = this.data.formData;
  
  // 提取成员电话号码列表
  const member_maker_ids = participants.map(member => member.maker_id);
  
  // 转换 is_recruiting 为布尔值
  const is_recruiting = project_info.is_recruiting === '1' || project_info.is_recruiting === 1;
  
  // 转换 project_type 为数字
  const project_type = parseInt(project_info.project_type);
  
  // 构造提交数据(匹配后端接口格式)
  return {
    project_name: project_info.project_name.trim(),
    project_type: project_type,
    description: project_info.description.trim(),
    start_time: project_info.start_time + ' 00:00:00', // 添加时间部分
    end_time: project_info.end_time + ' 00:00:00',     // 添加时间部分
    mentor_name: project_info.mentor_name.trim(),
    mentor_phone: project_info.mentor_phone.trim(),
    is_recruiting: is_recruiting,
    member_maker_ids: member_maker_ids
  };
},

// 返回处理
handlerGobackClick() {
  wx.showModal({
    title: '确认返回',
    content: '返回将丢失已填写的内容，是否确认？',
    success: (res) => {
      if (res.confirm) {
        wx.navigateBack({ delta: 1 });
      }
    }
  });
},

// 返回首页
handlerGohomeClick() {
  wx.showModal({
    title: '返回首页',
    content: '返回首页将丢失已填写的内容，是否确认？',
    success: (res) => {
      if (res.confirm) {
        wx.switchTab({ url: '/pages/index/index' });
      }
    }
  });
},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("[Project Create Apply] 获取页面图标资源");
    this.loadIcons();
    this.initDatePickers();
    this.loadUserProfileFromCache();
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