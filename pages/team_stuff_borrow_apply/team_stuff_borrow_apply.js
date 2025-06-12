// pages/stuff_borrow/stuff_borrow.js

const API_BASE = "http://146.56.227.73:8000";
const TOKEN_KEY = "auth_token";

Page({
  data: {
    // 表单数据
    task_name: '',
    name: '',
    leaderPhone: '',
    email: '',
    grade: '',
    major: '',
    project_number: '',         // 项目编号 (改名)
    supervisor_name: '',        // 指导老师姓名 (改名)
    supervisor_phone: '',       // 指导老师电话 (改名)
    content: '',

    // 焦点状态
    isTaskNameFocused: false,
    isLeaderNameFocused: false,
    isLeaderPhoneFocused: false,
    isEmailFocused: false,
    isGradeFocused: false,
    isMajorFocused: false,
    isProjectNumberFocused: false,     // 改名
    isSupervisorNameFocused: false,    // 改名
    isSupervisorPhoneFocused: false,   // 改名
    isDescriptionFocused: false,

    // 物资选择
    array: [{}],
    categories: ['电子设备', '办公用品', '其他'],
    namesMap: {
      '电子设备': ['笔记本', '摄像头', '鼠标', '投影仪', '音响'],
      '办公用品': ['笔', '本子', '订书机', '打印机', '计算器'],
      '其他': ['水杯', '钥匙扣', '文件夹', '移动硬盘', '充电器']
    },
    quantitiesMap: {
      '笔记本': ['1台', '2台', '3台', '4台', '5台'],
      '摄像头': ['1个', '2个', '3个', '4个', '5个'],
      '鼠标': ['1只', '2只', '3只', '4只', '5只'],
      '投影仪': ['1台', '2台', '3台'],
      '音响': ['1套', '2套', '3套'],
      '笔': ['1支', '5支', '10支', '20支'],
      '本子': ['1本', '2本', '5本', '10本'],
      '订书机': ['1个', '2个', '3个'],
      '打印机': ['1台', '2台'],
      '计算器': ['1个', '2个', '3个', '5个'],
      '水杯': ['1个', '2个', '3个'],
      '钥匙扣': ['1个', '2个', '3个', '5个'],
      '文件夹': ['1个', '2个', '3个', '5个'],
      '移动硬盘': ['1个', '2个'],
      '充电器': ['1个', '2个', '3个']
    },

    multiArrayList: [],       // 每个条目的三级联动选项数组
    multiIndexList: [],       // 每个条目的当前索引 [i,j,k]
    selectedTextList: [],     // 每个条目的已选文本

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
    const firstCol = this.data.categories;
    const secondCol = this.data.namesMap[firstCol[0]];
    const thirdCol = this.data.quantitiesMap[secondCol[0]];
    
    this.setData({
      multiArrayList: [
        [firstCol, secondCol, thirdCol]
      ],
      multiIndexList: [
        [0, 0, 0]
      ],
      selectedTextList: ['']
    });
  },

  // 输入框事件处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  // 焦点事件处理 - 任务名称
  onTaskNameFocus() { this.setData({ isTaskNameFocused: true }); },
  onTaskNameBlur() { this.setData({ isTaskNameFocused: false }); },

  // 焦点事件处理 - 负责人姓名
  onLeaderNameFocus() { this.setData({ isLeaderNameFocused: true }); },
  onLeaderNameBlur() { this.setData({ isLeaderNameFocused: false }); },

  // 焦点事件处理 - 负责人电话
  onLeaderPhoneFocus() { this.setData({ isLeaderPhoneFocused: true }); },
  onLeaderPhoneBlur() { this.setData({ isLeaderPhoneFocused: false }); },

  // 焦点事件处理 - 邮箱
  onEmailFocus() { this.setData({ isEmailFocused: true }); },
  onEmailBlur() { this.setData({ isEmailFocused: false }); },

  // 焦点事件处理 - 年级
  onGradeFocus() { this.setData({ isGradeFocused: true }); },
  onGradeBlur() { this.setData({ isGradeFocused: false }); },

  // 焦点事件处理 - 专业
  onMajorFocus() { this.setData({ isMajorFocused: true }); },
  onMajorBlur() { this.setData({ isMajorFocused: false }); },

  // 焦点事件处理 - 项目编号 (改名)
  onProjectNumberFocus() { this.setData({ isProjectNumberFocused: true }); },
  onProjectNumberBlur() { this.setData({ isProjectNumberFocused: false }); },

  // 焦点事件处理 - 指导老师姓名 (改名)
  onSupervisorNameFocus() { this.setData({ isSupervisorNameFocused: true }); },
  onSupervisorNameBlur() { this.setData({ isSupervisorNameFocused: false }); },

  // 焦点事件处理 - 指导老师电话 (改名)
  onSupervisorPhoneFocus() { this.setData({ isSupervisorPhoneFocused: true }); },
  onSupervisorPhoneBlur() { this.setData({ isSupervisorPhoneFocused: false }); },

  // 焦点事件处理 - 描述
  onDescriptionFocus() { this.setData({ isDescriptionFocused: true }); },
  onDescriptionBlur() { this.setData({ isDescriptionFocused: false }); },

  // 日期选择器事件
  onYearChange(e) { this.setData({ selectedYear: this.data.years[e.detail.value] }); },
  onMonthChange(e) { this.setData({ selectedMonth: this.data.months[e.detail.value] }); },
  onDayChange(e) { this.setData({ selectedDay: this.data.days[e.detail.value] }); },

  // 物资选择器事件 - 用户点击"确认"时触发
  bindMultiPickerChange(e) {
    const idx = e.currentTarget.dataset.idx;
    const [i, j, k] = e.detail.value;
    const arr = this.data.multiArrayList[idx];
    const cat = arr[0][i];
    const name = arr[1][j];
    const qty = arr[2][k];

    // 更新对应条目的索引和显示文本
    this.setData({
      [`multiIndexList[${idx}]`]: [i, j, k],
      [`selectedTextList[${idx}]`]: `${cat} - ${name} - ${qty}`
    });
  },

  // 物资选择器事件 - 用户滑动某一列时触发，用来联动后面列的数据
  bindMultiPickerColumnChange(e) {
    const idx = e.currentTarget.dataset.idx;
    const col = e.detail.column;
    const value = e.detail.value;

    // 拷贝出要操作的那条 multiArray
    let list = this.data.multiArrayList.slice();
    let sel = this.data.multiIndexList.slice();

    const categories = this.data.categories;
    const namesMap = this.data.namesMap;
    const quantitiesMap = this.data.quantitiesMap;

    let multiArray = list[idx];
    let multiIndex = sel[idx];

    if (col === 0) {
      // 第一列改变，联动更新第二列和第三列
      const newCat = categories[value];
      const newNames = namesMap[newCat];
      const newQtys = quantitiesMap[newNames[0]];
      multiArray = [categories, newNames, newQtys];
      multiIndex = [value, 0, 0];
    } else if (col === 1) {
      // 第二列改变，联动更新第三列
      const cat = multiArray[0][multiIndex[0]];
      const name = multiArray[1][value];
      const newQtys = quantitiesMap[name];
      multiArray[1] = namesMap[cat];
      multiArray[2] = newQtys;
      multiIndex[1] = value;
      multiIndex[2] = 0;
    }

    // 写回对应条目的数据
    this.setData({
      [`multiArrayList[${idx}]`]: multiArray,
      [`multiIndexList[${idx}]`]: multiIndex
    });
  },

  // 添加物资条目
  addInput() {
    // 复制第一个条目的初始结构
    const first = this.data.multiArrayList[0];
    this.setData({
      array: [...this.data.array, {}],
      multiArrayList: [...this.data.multiArrayList, JSON.parse(JSON.stringify(first))],
      multiIndexList: [...this.data.multiIndexList, [0, 0, 0]],
      selectedTextList: [...this.data.selectedTextList, '']
    });
  },

  // 删除物资条目
  delInput(e) {
    const idx = e.currentTarget.dataset.idx;
    if (this.data.array.length <= 1) {
      wx.showToast({
        title: '至少保留一个借用条目',
        icon: 'none'
      });
      return;
    }

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

  // 返回按钮事件
  handlerGobackClick() {
    wx.showModal({
      title: '确认返回',
      content: '是否确认返回？未保存的数据将丢失',
      success: e => {
        if (e.confirm) {
          const pages = getCurrentPages();
          if (pages.length >= 2) {
            wx.navigateBack({ delta: 1 });
          } else {
            wx.reLaunch({ url: '/pages/index/index' });
          }
        }
      }
    });
  },

  // 首页按钮事件
  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  // 弹窗确认 + 调用真正提交逻辑
confirmAndSubmit() {
  wx.showModal({
    title: '借物规定',
    content: '请阅读并同意借物规定：\n1. 借用物品需按时归还；\n2. 严禁转借他人；\n3. 如有损坏，需赔偿；\n\n是否同意以上规定？',
    showCancel: true,
    cancelText: '不同意',
    confirmText: '同意',
    success: (res) => {
      if (res.confirm) {
        this.onSubmit();  // ✅ 同意后执行真正提交
      } else {
        wx.showToast({
          title: '您必须同意借物规定才能提交',
          icon: 'none'
        });
      }
    }
  });
},

// 真正提交逻辑
onSubmit() {
  const {
    task_name,
    name,
    leaderPhone,
    email,
    grade,
    major,
    project_number,
    supervisor_name,
    supervisor_phone,
    content,
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedTextList
  } = this.data;

  if (!task_name || !name || !leaderPhone || !email || !grade || !major || !content) {
    wx.showToast({ title: '请填写完整基本信息', icon: 'none' });
    return;
  }

  if (!project_number || !supervisor_name || !supervisor_phone) {
    wx.showToast({ title: '请填写完整团队信息', icon: 'none' });
    return;
  }

  if (!selectedYear || !selectedMonth || !selectedDay) {
    wx.showToast({ title: '请选择归还日期', icon: 'none' });
    return;
  }

  const validMaterials = selectedTextList.filter(item => item && item.trim() !== '');
  if (validMaterials.length === 0) {
    wx.showToast({ title: '请至少选择一项物资', icon: 'none' });
    return;
  }

  const deadline = `${selectedYear.replace('年', '')}-${selectedMonth.replace('月', '').padStart(2, '0')}-${selectedDay.replace('日', '').padStart(2, '0')} 00:00:00`;

  const submitData = {
    task_name,
    name,
    phone: leaderPhone,
    email,
    grade,
    major,
    content,
    deadline,
    materials: validMaterials,
    type: 1,
    supervisor_name,
    supervisor_phone,
    project_number
  };

  const token = wx.getStorageSync('auth_token');

  wx.showLoading({ title: '提交中...' });

  wx.request({
    url: `${API_BASE}/borrow/apply`,
    method: 'POST',
    data: submitData,
    header: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    success: (res) => {
      wx.hideLoading();
      if (res.statusCode === 200 || res.statusCode === 201) {
        wx.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => { this.resetForm(); }, 1500);
      } else {
        wx.showToast({
          title: res.data?.detail || res.data?.message || '提交失败，请稍后重试',
          icon: 'none'
        });
      }
    },
    fail: (err) => {
      wx.hideLoading();
      console.error('提交失败:', err);
      wx.showToast({
        title: '网络错误，请检查网络连接',
        icon: 'none'
      });
    }
  });
},

  // 重置表单
  resetForm() {
    this.setData({
      task_name: '',
      name: '',
      leaderPhone: '',
      email: '',
      grade: '',
      major: '',
      project_number: '',        // 改名
      supervisor_name: '',       // 改名
      supervisor_phone: '',      // 改名
      content: '',
      selectedYear: '',
      selectedMonth: '',
      selectedDay: '',
      array: [{}],
      multiIndexList: [[0, 0, 0]],
      selectedTextList: [''],
      
      // 重置焦点状态
      isTaskNameFocused: false,
      isLeaderNameFocused: false,
      isLeaderPhoneFocused: false,
      isEmailFocused: false,
      isGradeFocused: false,
      isMajorFocused: false,
      isProjectNumberFocused: false,     // 改名
      isSupervisorNameFocused: false,    // 改名
      isSupervisorPhoneFocused: false,   // 改名
      isDescriptionFocused: false
    });

    // 重新初始化物资选择器
    this.initMaterialOptions();
  }
});