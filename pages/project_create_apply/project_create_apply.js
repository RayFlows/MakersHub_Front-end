// pages/project_create_apply.js
const app = getApp();
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');

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
    modalHint: '',
    isSearchFocused: false,
    searchActiveIndex: -1,
    searchTimer: null,

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

  // 显示添加成员弹窗
  showMemberModal() {
    this.setData({
      showModal: true,
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      modalHint: ''
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({
      showModal: false,
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      modalHint: ''
    });
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 搜索输入处理
  onSearchInput(e) {
    const phone = e.detail.value;
    this.setData({
      searchPhone: phone,
      selectedMember: null,
      modalHint: ''
    });

    // 清除之前的定时器
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }

    // 如果输入为空,清空结果
    if (!phone || phone.length === 0) {
      this.setData({
        searchResults: []
      });
      return;
    }

    // 防抖搜索
    const timer = setTimeout(() => {
      this.searchMembers(phone);
    }, 300);

    this.setData({
      searchTimer: timer
    });
  },

  // 搜索成员(调用后端API)
  searchMembers(phone) {
    // TODO: 替换为实际的后端API调用
    wx.request({
      url: config.baseUrl + '/api/search_user',  // 替换为实际API
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      data: {
        phone: phone
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          this.setData({
            searchResults: res.data.data || []
          });
        } else {
          this.setData({
            searchResults: [],
            modalHint: '未找到相关用户'
          });
        }
      },
      fail: (err) => {
        console.error('搜索失败:', err);
        this.setData({
          searchResults: [],
          modalHint: '搜索失败,请重试'
        });
      }
    });

    // 临时模拟数据(实际使用时删除)
    
    setTimeout(() => {
      const mockResults = [
        { name: '张三', college: "计算机学院", phone_num: phone},
        { name: '李四', college: "电子信息学院", phone_num: phone}
      ];
      this.setData({
        searchResults: mockResults
      });
    }, 300);
    
  },

  // 搜索框聚焦
  onSearchFocus() {
    this.setData({
      isSearchFocused: true
    });
  },

  // 搜索框失焦
  onSearchBlur() {
    // 延迟失焦,避免影响点击结果项
    setTimeout(() => {
      this.setData({
        isSearchFocused: false
      });
    }, 200);
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      modalHint: ''
    });
  },

  // 选择成员
  selectMember(e) {
    const index = e.currentTarget.dataset.index;
    const member = this.data.searchResults[index];
    
    this.setData({
      selectedMember: member,
      searchPhone: member.phone,
      searchResults: [],
      modalHint: ''
    });
  },

  // 触摸开始
  onResultTouchStart(e) {
    const index = e.currentTarget.dataset.touchIndex;
    this.setData({
      searchActiveIndex: index
    });
  },

  // 触摸结束
  onResultTouchEnd() {
    setTimeout(() => {
      this.setData({
        searchActiveIndex: -1
      });
    }, 150);
  },

  // 确认添加成员
  confirmAddMember() {
    if (!this.data.selectedMember) {
      this.setData({
        modalHint: '请先选择一个搜索结果'
      });
      return;
    }

    // 检查是否已存在
    const exists = this.data.formData.participants.some(
      p => p.phone === this.data.selectedMember.phone
    );

    if (exists) {
      this.setData({
        modalHint: '该成员已在列表中'
      });
      return;
    }

    // 添加到成员列表
    const participants = [...this.data.formData.participants, this.data.selectedMember];
    
    this.setData({
      'formData.participants': participants
    });

    console.log('添加成员:', this.data.selectedMember);
    console.log('当前成员列表:', participants);

    // 关闭弹窗
    this.hideModal();
  },

  // 删除成员
  deleteMember(e) {
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '提示',
      content: '确定要移除该成员吗?',
      success: (res) => {
        if (res.confirm) {
          const participants = this.data.formData.participants.filter((_, i) => i !== index);
          this.setData({
            'formData.participants': participants
          });
          console.log('删除后成员列表:', participants);
        }
      }
    });
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

  onLoad(options) {
    console.log("[Project Create Apply] 获取页面图标资源");
    this.loadIcons();
    
    // 初始化日期选择器
    this.initDatePickers();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("[Project Create Apply] 获取页面图标资源");
    this.loadIcons();
    this.initDatePickers();
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