const API_BASE = "http://146.56.227.73:8000";
const TOKEN_KEY = "auth_token";
const token = wx.getStorageSync(TOKEN_KEY);

Page({
  data: {
    // 表单数据
    name: '',
    student_id: '',
    leaderPhone: '', 
    email: '', 
    grade: '', 
    major: '',
    content: '',

    // 焦点状态
    isLeaderNameFocused: false,
    isLeaderIdFocused: false,
    isLeaderPhoneFocused: false,
    isEmailFocused: false,
    isGradeFocused: false,
    isMajorFocused: false,
    isDescriptionFocused: false,

    // 物资选择
    array: [{}],
    multiArrayList: [[]],
    multiIndexList: [[]],
    selectedTextList: [],

    // 时间选择
    years: [],
    months: [],
    days: [],
    selectedYear: '',
    selectedMonth: '',
    selectedDay: ''
  },

  onLoad() {
    this.initDatePickers();
    this.initMaterialOptions();
  },

  // 初始化日期选择器
  initDatePickers() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 5; i++) {
      years.push(i + '年');
    }

    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(i + '月');
    }

    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i + '日');
    }

    this.setData({ years, months, days });
  },

  // 初始化物资选择器选项
  initMaterialOptions() {
    const materialOptions = [
      ['电子设备', '办公用品', '体育用品', '工具', '开发板'],
      ['笔记本电脑', '投影仪', '音响', '打印机', '扫描仪'],
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    ];
    this.setData({
      'multiArrayList[0]': materialOptions
    });
  },

  // 输入框事件处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  // 焦点事件处理
  onLeaderNameFocus() { this.setData({ isLeaderNameFocused: true }); },
  onLeaderNameBlur() { this.setData({ isLeaderNameFocused: false }); },
  onleaderIdFocus() { this.setData({ isLeaderIdFocused: true }); },
  onLeaderIdBlur() { this.setData({ isLeaderIdFocused: false }); },
  onLeaderPhoneFocus() { this.setData({ isLeaderPhoneFocused: true }); },
  onLeaderPhoneBlur() { this.setData({ isLeaderPhoneFocused: false }); },
  onEmailFocus() { this.setData({ isEmailFocused: true }); },
  onEmailBlur() { this.setData({ isEmailFocused: false }); },
  onGradeFocus() { this.setData({ isGradeFocused: true }); },
  onGradeBlur() { this.setData({ isGradeFocused: false }); },
  onMajorFocus() { this.setData({ isMajorFocused: true }); },
  onMajorBlur() { this.setData({ isMajorFocused: false }); },
  onDescriptionFocus() { this.setData({ isDescriptionFocused: true }); },
  onDescriptionBlur() { this.setData({ isDescriptionFocused: false }); },

  // 日期选择器事件
  onYearChange(e) { this.setData({ selectedYear: this.data.years[e.detail.value] }); },
  onMonthChange(e) { this.setData({ selectedMonth: this.data.months[e.detail.value] }); },
  onDayChange(e) { this.setData({ selectedDay: this.data.days[e.detail.value] }); },

  // 物资选择器事件
  bindMultiPickerChange(e) {
    const idx = e.currentTarget.dataset.idx;
    const values = e.detail.value;
    const selectedText = values.map((val, i) => this.data.multiArrayList[idx][i][val]).join(' - ');
    this.setData({
      [`multiIndexList[${idx}]`]: values,
      [`selectedTextList[${idx}]`]: selectedText
    });
  },

  bindMultiPickerColumnChange(e) {
    // 处理级联选择逻辑（如果需要的话）
  },

  addInput() {
    const newArray = [...this.data.array, {}];
    const newMultiArrayList = [...this.data.multiArrayList, this.data.multiArrayList[0]];
    const newMultiIndexList = [...this.data.multiIndexList, []];
    const newSelectedTextList = [...this.data.selectedTextList, ''];
    this.setData({
      array: newArray,
      multiArrayList: newMultiArrayList,
      multiIndexList: newMultiIndexList,
      selectedTextList: newSelectedTextList
    });
  },

  delInput(e) {
    const idx = e.currentTarget.dataset.idx;
    if (this.data.array.length <= 1) return;
    const newArray = this.data.array.filter((_, i) => i !== idx);
    const newMultiArrayList = this.data.multiArrayList.filter((_, i) => i !== idx);
    const newMultiIndexList = this.data.multiIndexList.filter((_, i) => i !== idx);
    const newSelectedTextList = this.data.selectedTextList.filter((_, i) => i !== idx);
    this.setData({
      array: newArray,
      multiArrayList: newMultiArrayList,
      multiIndexList: newMultiIndexList,
      selectedTextList: newSelectedTextList
    });
  },

  handlerGobackClick() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ 
          url: '/pages/base_management_work_page/base_management_work_page', 
          fail: () => wx.navigateTo({ url: '/pages/index/index' }) 
        });
      }
    });
  },

  handlerGohomeClick() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: () => {
        wx.navigateTo({ 
          url: '/pages/index/index', 
          fail: () => wx.showToast({ title: '跳转失败', icon: 'none' }) 
        });
      }
    });
  },

  onSubmit(e) {
    const { name, student_id, leaderPhone, email, grade, major, content, selectedYear, selectedMonth, selectedDay, selectedTextList } = this.data;
    
    // 验证必填字段
    if (!name || !student_id || !leaderPhone || !email || !grade || !major || !content) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    
    if (!selectedYear || !selectedMonth || !selectedDay) {
      wx.showToast({ title: '请选择归还日期', icon: 'none' });
      return;
    }
    
    if (selectedTextList.filter(item => item).length === 0) {
      wx.showToast({ title: '请至少选择一项物资', icon: 'none' });
      return;
    }

    // 构建截止日期
    const deadline = `${selectedYear.replace('年', '')}-${selectedMonth.replace('月', '').padStart(2, '0')}-${selectedDay.replace('日', '').padStart(2, '0')} 00:00:00`;
    
    // 过滤有效的物资选择
    const materials = selectedTextList.filter(item => item);
    
    // 构建提交数据
    const submitData = {
      name,
      student_id,
      phone: leaderPhone,
      email,
      grade,
      major,
      content,
      deadline,
      materials,
      type: 0  // 0表示个人借物
    };

    wx.showLoading({ title: '提交中...' });
    
    // 调用新的API接口
    wx.request({
      url: `${API_BASE}/stuff-borrow/apply`,
      method: 'POST',
      data: submitData,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        wx.hideLoading();
        console.log('提交响应:', res);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({ 
            title: '提交成功', 
            icon: 'success',
            duration: 2000
          });
          setTimeout(() => {
            this.resetForm();
          }, 2000);
        } else {
          wx.showToast({ 
            title: res.data.message || '提交失败，请稍后重试', 
            icon: 'none',
            duration: 3000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('提交失败:', err);
        wx.showToast({ 
          title: '网络错误，请检查网络连接', 
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  resetForm() {
    this.setData({ 
      name: '',
      student_id: '',
      leaderPhone: '',
      email: '',
      grade: '',
      major: '',
      content: '',
      selectedYear: '',
      selectedMonth: '',
      selectedDay: '',
      array: [{}],
      multiArrayList: [[]],
      multiIndexList: [[]],
      selectedTextList: [],
      isLeaderNameFocused: false,
      isLeaderIdFocused: false,
      isLeaderPhoneFocused: false,
      isEmailFocused: false,
      isGradeFocused: false,
      isMajorFocused: false,
      isDescriptionFocused: false
    });
    this.initMaterialOptions();
  }
});