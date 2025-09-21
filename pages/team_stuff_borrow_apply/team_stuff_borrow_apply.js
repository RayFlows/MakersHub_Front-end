const API_BASE = "https://mini.makershub.cn";
const TOKEN_KEY = "auth_token";

Page({
  data: {
    // 表单数据
    isEditMode: false,
    sb_id: '',
    name: '',
    student_id: '',
    leaderPhone: '', 
    email: '', 
    grade: '', 
    major: '',
    project_number: '',
    supervisor_name: '',
    supervisor_phone: '',
    reason: '',

    // 焦点状态
    isLeaderNameFocused: false,
    isLeaderIdFocused: false,
    isLeaderPhoneFocused: false,
    isEmailFocused: false,
    isGradeFocused: false,
    isMajorFocused: false,
    isProjectNumberFocused: false,
    isSupervisorNameFocused: false,
    isSupervisorPhoneFocused: false,
    isDescriptionFocused: false,

    // 物资选择
    array: [{}],
    categories: [],
    namesMap: {},
    quantitiesMap: {},
    multiArrayList: [],
    multiIndexList: [],
    selectedTextList: [],

    // 时间选择
    years: [],
    months: [],
    days: [],
    selectedYear: '',
    selectedMonth: '',
    selectedDay: ''
  },

  onLoad(options) {
    this.initDatePickers();

    // 先设置编辑标记
    if (options.edit === 'true' && options.sb_id) {
      this.setData({
        isEditMode: true,
        sb_id: options.sb_id
      })
    }
    // 拉取可选项
    this.fetchStuffOptions()
  },

  loadFormDetail(sb_id) {
    const token = wx.getStorageSync(TOKEN_KEY);
    wx.request({
      url: `${API_BASE}/stuff-borrow/detail/${sb_id}`,
      method: 'GET',
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const detail = res.data.data;
          console.log("[loadFormDetail]", detail);
          // 解析日期
          const deadline = new Date(detail.deadline);
          const selectedYear = `${deadline.getFullYear()}年`;
          const selectedMonth = `${deadline.getMonth() + 1}月`;
          const selectedDay = `${deadline.getDate()}日`;
  
          // 设置基本字段
          this.setData({
            name: detail.name,
            student_id: detail.student_id,
            leaderPhone: detail.phone_num,
            email: detail.email,
            grade: detail.grade,
            major: detail.major,
            reason: detail.reason,
            project_number: detail.project_number,
            supervisor_name: detail.supervisor_name,
            supervisor_phone: detail.supervisor_phone,
            selectedYear,
            selectedMonth,
            selectedDay
          });
  
          // 构造物资借用条目
          const stuffList = detail.stuff_list || [];
          const array = stuffList.map(() => ({}));
          const multiArrayList = [];
          const multiIndexList = [];
          const selectedTextList = [];
  
          for (let item of stuffList) {
            const catIndex = this.data.categories.indexOf(item.category);
            const nameList = this.data.namesMap[item.category] || [];
            const nameIndex = nameList.indexOf(item.stuff);
            const quantityList = this.data.quantitiesMap[item.stuff] || [];
            const quantityIndex = 0; // 默认数量索引为0（可根据业务调整）
  
            const arrayItem = [
              this.data.categories,
              nameList,
              quantityList
            ];
  
            multiArrayList.push(arrayItem);
            multiIndexList.push([
              catIndex >= 0 ? catIndex : 0,
              nameIndex >= 0 ? nameIndex : 0,
              quantityIndex
            ]);
            selectedTextList.push(
              `${item.stuff}`
            );
          }
  
          this.setData({
            array,
            multiArrayList,     // 添加这行
          multiIndexList,     // 添加这行
            selectedTextList
          });
        } else {
          wx.showToast({ title: '加载表单失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '无法连接服务器', icon: 'none' });
      }
    });
  },

  fetchStuffOptions() {
    const token = wx.getStorageSync(TOKEN_KEY);
    wx.request({
      url: `${API_BASE}/stuff/get-all`,
      method: 'GET',
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('[fetchStuffOptions] 接口响应:', res);
        if (res.statusCode === 200 && res.data) {
          console.log('[后端接口数据]', res.data);
          const grouped = res.data.types;
          const categories = grouped.map(item => item.type);
          const namesMap = {};
          const quantitiesMap = {};

          for (const typeObj of grouped) {
            const type = typeObj.type;
            const details = typeObj.details || [];
            namesMap[type] = details.map(d => d.stuff_name);
            for (const item of details) {
              quantitiesMap[item.stuff_name] = Array.from({ length: item.number_remain }, (_, i) => `${i + 1}`);
            }
          }

          this.setData({
            categories,
            namesMap,
            quantitiesMap
          }, () => {
            this.initMaterialOptions();
            if (this.data.isEditMode && this.data.sb_id) {
              // 这时 categories 等已经就绪，loadFormDetail 能正确地映射 index
              this.loadFormDetail(this.data.sb_id)
            }
          });
        } else {
          wx.showToast({ title: '物资加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '物资加载失败', icon: 'none' });
      }
    });
  },

  initDatePickers() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => `${currentYear + i}年`);
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    const days = Array.from({ length: 31 }, (_, i) => `${i + 1}日`);
    this.setData({ years, months, days });
  },

  initMaterialOptions() {
    const { categories, namesMap, quantitiesMap } = this.data;
    if (!categories.length) return;
    const firstCol = categories;
    const secondCol = namesMap[firstCol[0]] || [];
    const thirdCol = secondCol.length ? (quantitiesMap[secondCol[0]] || []) : [];

    this.setData({
      multiArrayList: [[firstCol, secondCol, thirdCol]],
      multiIndexList: [[0, 0, 0]],
      selectedTextList: ['']
    });
  },
  
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

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
  onProjectNumberFocus() { this.setData({ isProjectNumberFocused: true }); },
  onProjectNumberBlur() { this.setData({ isProjectNumberFocused: false }); },
  onSupervisorNameFocus() { this.setData({ isSupervisorNameFocused: true }); },
  onSupervisorNameBlur() { this.setData({ isSupervisorNameFocused: false }); },
  onSupervisorPhoneFocus() { this.setData({ isSupervisorPhoneFocused: true }); },
  onSupervisorPhoneBlur() { this.setData({ isSupervisorPhoneFocused: false }); },
  onDescriptionFocus() { this.setData({ isDescriptionFocused: true }); },
  onDescriptionBlur() { this.setData({ isDescriptionFocused: false }); },

  onYearChange(e) { this.setData({ selectedYear: this.data.years[e.detail.value] }); },
  onMonthChange(e) { this.setData({ selectedMonth: this.data.months[e.detail.value] }); },
  onDayChange(e) { this.setData({ selectedDay: this.data.days[e.detail.value] }); },

  bindMultiPickerChange(e) {
    const idx = e.currentTarget.dataset.idx;
    const [i, j, k] = e.detail.value;
    const arr = this.data.multiArrayList[idx];
    const cat = arr[0][i];
    const name = arr[1][j];
    const qty = arr[2][k];

    this.setData({
      [`multiIndexList[${idx}]`]: [i, j, k],
      [`selectedTextList[${idx}]`]: `${cat} - ${name} - ${qty}`
    });
  },

  bindMultiPickerColumnChange(e) {
    const idx = e.currentTarget.dataset.idx;
    const col = e.detail.column;
    const val = e.detail.value;
    let arr = this.data.multiArrayList[idx];
    let indices = this.data.multiIndexList[idx];
    const { categories, namesMap, quantitiesMap } = this.data;
  
    if (col === 0) {
      const newCat = categories[val];
      const newNames = namesMap[newCat] || [];
      const newQtys = newNames.length ? (quantitiesMap[newNames[0]] || []) : [];
      arr = [categories, newNames, newQtys];
      indices = [val, 0, 0];
    } else if (col === 1) {
      const catIdx = indices[0];
      const cat = categories[catIdx];
      const name = namesMap[cat][val];
      const newQtys = quantitiesMap[name] || [];
      arr[1] = namesMap[cat];
      arr[2] = newQtys;
      indices[1] = val;
      indices[2] = 0;
    } else if (col === 2) {
      // 👇 正确设置数量索引
      indices[2] = val;
    }
  
    this.setData({
      [`multiArrayList[${idx}]`]: arr,
      [`multiIndexList[${idx}]`]: indices
    });
  },

  addInput() {
    const { categories, namesMap, quantitiesMap } = this.data;
    
    // 创建新条目的默认选择器数据
    const defaultFirstCol = categories;
    const defaultSecondCol = namesMap[defaultFirstCol[0]] || [];
    const defaultThirdCol = defaultSecondCol.length ? (quantitiesMap[defaultSecondCol[0]] || []) : [];
    
    const newArrayItem = [defaultFirstCol, defaultSecondCol, defaultThirdCol];
    
    this.setData({
      array: [...this.data.array, {}],
      multiArrayList: [...this.data.multiArrayList, newArrayItem],
      multiIndexList: [...this.data.multiIndexList, [0, 0, 0]],
      selectedTextList: [...this.data.selectedTextList, '']
    });
  },
  

  handlerGobackClick() {
    wx.showModal({
      title: '确认返回',
      content: '是否确认返回？未保存的数据将丢失',
      cancelColor:'#00adb5',
      success: e => {
        if (e.confirm) {
          const pages = getCurrentPages();
          if (pages.length >= 2) wx.navigateBack({ delta: 1 });
          else wx.reLaunch({ url: '/pages/index/index' });
        }
      }
    });
  },

  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  confirmAndSubmit() {
    wx.showModal({
      title: '借物规定',
      content: '请阅读并同意借物规定：\n1. 借用物品需按时归还；\n2. 严禁转借他人；\n3. 如有损坏，需赔偿；\n\n是否同意以上规定？',
      showCancel: true,
      cancelText: '不同意',
      confirmText: '同意',
      success: (res) => {
        if (res.confirm) this.onSubmit();
        else wx.showToast({ title: '您必须同意借物规定才能提交', icon: 'none' });
      }
    });
  },

  onSubmit() {
    const {
      name, student_id, leaderPhone, email, grade, major,
      project_number, supervisor_name, supervisor_phone,
      reason, selectedYear, selectedMonth, selectedDay, selectedTextList,
      isEditMode, sb_id
    } = this.data;
  
    if (!student_id || !name || !leaderPhone || !email || !grade || !major || !reason) {
      wx.showToast({ title: '请填写完整基本信息', icon: 'none' }); return;
    }
    if (!project_number || !supervisor_name || !supervisor_phone) {
      wx.showToast({ title: '请填写完整团队信息', icon: 'none' }); return;
    }
    if (!selectedYear || !selectedMonth || !selectedDay) {
      wx.showToast({ title: '请选择归还日期', icon: 'none' }); return;
    }
  
    const validMaterials = selectedTextList.filter(item => item && item.trim() !== '');
    if (validMaterials.length === 0) {
      wx.showToast({ title: '请至少选择一项物资', icon: 'none' }); return;
    }
  
    const deadline = isEditMode ? `${selectedYear.replace('年', '')}-${selectedMonth.replace('月', '').padStart(2, '0')}-${selectedDay.replace('日', '').padStart(2, '0')}`:`${selectedYear.replace('年', '')}-${selectedMonth.replace('月', '').padStart(2, '0')}-${selectedDay.replace('日', '').padStart(2, '0')} 00:00:00`;
  
    // 构造提交数据
    const submitData = {
      name,
      student_id,
      phone: leaderPhone,  // 注意：后端期望的字段名是 phone
      email,
      grade,
      major,
      reason,
      deadline,
      materials: validMaterials,
      type: 1,  // 根据你的数据格式，这里固定为1（团队借用）
      supervisor_name,
      supervisor_phone,
      project_number
    };
  
    const token = wx.getStorageSync(TOKEN_KEY);
    wx.showLoading({ title: isEditMode ? '更新提交中...' : '提交中...' });
  
    // 根据编辑模式选择不同的接口和方法
    const apiUrl = isEditMode ? `${API_BASE}/stuff-borrow/update/${sb_id}` : `${API_BASE}/stuff-borrow/apply`;
    const httpMethod = isEditMode ? 'PATCH' : 'POST';
  
    wx.request({
      url: apiUrl,
      method: httpMethod,
      data: submitData,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.showToast({ 
            title: isEditMode ? '更新成功' : '提交成功', 
            icon: 'success' 
          });
          setTimeout(() => {
            if (isEditMode) {
              // 编辑模式：返回上一个页面
              const pages = getCurrentPages();
              if (pages.length >= 2) {
                wx.navigateBack({ delta: 1 });
              } else {
                // 如果没有上一个页面，跳转到首页
                wx.switchTab({
                  url: '/pages/index/index',
                  fail: () => {
                    wx.redirectTo({
                      url: '/pages/index/index'
                    });
                  }
                });
              }
            } else {
              // 新建模式：重置表单并跳转到首页
              this.resetForm();
              wx.switchTab({
                url: '/pages/index/index',
                fail: () => {
                  wx.redirectTo({
                    url: '/pages/index/index'
                  });
                }
              });
            }
          }, 1500);
        } else {
          wx.showToast({ 
            title: res.data?.detail || (isEditMode ? '更新失败' : '提交失败'), 
            icon: 'none' 
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请检查网络连接', icon: 'none' });
      }
    });
  },

  resetForm() {
    this.setData({
      name: '', student_id: '', leaderPhone: '', email: '', grade: '',
      major: '', project_number: '', supervisor_name: '', supervisor_phone: '',
      reason: '', selectedYear: '', selectedMonth: '', selectedDay: '',
      array: [{}], multiIndexList: [[0, 0, 0]], selectedTextList: [''],
      isLeaderNameFocused: false, isLeaderIdFocused: false,
      isLeaderPhoneFocused: false, isEmailFocused: false,
      isGradeFocused: false, isMajorFocused: false,
      isProjectNumberFocused: false, isSupervisorNameFocused: false,
      isSupervisorPhoneFocused: false, isDescriptionFocused: false
    });
    this.initMaterialOptions();
  }
});
