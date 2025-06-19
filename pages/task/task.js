const API_BASE = 'http://146.56.227.73:8000';
const TOKEN_KEY = 'auth_token';
const token = wx.getStorageSync(TOKEN_KEY);

Page({
  data: {
    apiData: {
      task_type: null,
      name: '',
      department: null,
      maker_id: '',
      content: '',
      deadline: ''
    },
    taskTypes: [
      { label: '其他', value: 0 },
      { label: '活动文案', value: 1 },
      { label: '推文', value: 2 },
      { label: '新闻稿', value: 3 }
    ],
    departments: [
      { label: '基管部', value: 0 },
      { label: '宣传部', value: 1 },
      { label: '运维部', value: 2 },
      { label: '项目部', value: 3 },
      { label: '副会', value: 4 },
      { label: '会长', value: 5 }
    ],
    makersData: [],
    currentMakersData: [],
    currentMakers: [],
    selectedTaskType: '',
    selectedTaskTypeIndex: null,
    selectedDepartment: '',
    selectedMaker: '',
    years: Array.from({ length: 10 }, (_, i) => `${2024 + i}年`),
    months: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
    days: Array.from({ length: 31 }, (_, i) => `${i + 1}日`),
    hours: Array.from({ length: 24 }, (_, i) => `${i}时`),
    minutes: Array.from({ length: 60 }, (_, i) => `${i}分`),
    selectedYear: '',
    selectedMonth: '',
    selectedDay: '',
    selectedHour: '',
    selectedMinute: '',
    isDescriptionFocused: false,
    isDirectorFocused: false,
    task_id: null,
    isEditMode: false,
    optionsCache: null
  },

  handlerGobackClick() {
    wx.showModal({
      title: '你点击了返回',
      content: '是否确认返回',
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

  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onLoad(options) {
    this.setData({ optionsCache: options });
    this.initializeData();
  },

  async initializeData() {
    try {
      await Promise.all([this.getMakersData(), this.getCurrentMakersData()]);
      const options = this.data.optionsCache;
      console.log("options: ", options);
      if (!options) return;

      if (options.taskData) {
        const parsed = JSON.parse(decodeURIComponent(options.taskData));
        if (parsed.code === 200 && parsed.data) {
          this.setData({
            task_id: parsed.data.task_id,
            isEditMode: true
          });
          this.populateFormData(parsed.data);
        }
      } else if (options.task_id) {
        const task_type = parseInt(decodeURIComponent(options.task_type || ''));
        const department = parseInt(decodeURIComponent(options.department || ''));
        const maker_id = decodeURIComponent(options.maker_id || '');
        const name = decodeURIComponent(options.name || '');
        const content = decodeURIComponent(options.content || '');
        const deadlineStr = decodeURIComponent(options.deadline || '');
        const deadline = new Date(deadlineStr);

        const isValidDate = d => d instanceof Date && !isNaN(d);

        this.setData({
          task_id: decodeURIComponent(options.task_id),
          isEditMode: true,
          // taskTypeIndex = this.data.taskTypes.findIndex(t => t.value === task_type) || '',
          selectedTaskType: this.data.taskTypes.find(t => t.value === task_type)?.label || '',
          selectedDepartment: this.data.departments.find(d => d.value === department)?.label || '',
          selectedMaker: name,
          selectedYear: isValidDate(deadline) ? `${deadline.getFullYear()}年` : '',
          selectedMonth: isValidDate(deadline) ? `${deadline.getMonth() + 1}月` : '',
          selectedDay: isValidDate(deadline) ? `${deadline.getDate()}日` : '',
          selectedHour: isValidDate(deadline) ? `${deadline.getHours()}时` : '',
          selectedMinute: isValidDate(deadline) ? `${deadline.getMinutes()}分` : '',
          apiData: {
            task_type,
            department,
            maker_id,
            name,
            content,
            deadline: deadlineStr
          }
        });

        this.updateCurrentMakersByDepartment(department);
      }
    } catch (error) {
      console.error('初始化数据失败:', error);
      wx.showToast({ title: '数据加载失败', icon: 'none' });
    }
  },

  getMakersData() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE}/users/get-makers`,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        success: res => {
          if (res.data.code === 200 && res.data.list) {
            this.setData({ makersData: res.data.list });
            resolve(res.data.list);
          } else {
            reject('获取部门成员数据失败');
          }
        },
        fail: reject
      });
    });
  },

  getCurrentMakersData() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE}/arrange/get-current`,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        success: res => {
          if (res.data.code === 200 && res.data.data) {
            this.setData({ currentMakersData: res.data.data });
            resolve(res.data.data);
          } else {
            reject('获取当前负责人数据失败');
          }
        },
        fail: reject
      });
    });
  },

  getTaskDetail(taskId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE}/tasks/detail/${taskId}`,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        success: res => {
          if (res.data) {
            this.populateFormData(res.data);
            resolve(res.data);
          } else {
            reject('获取任务详情失败');
          }
        },
        fail: reject
      });
    });
  },

  populateFormData(data) {
    let { task_type, department, maker_id, name, content, deadline } = data;
  
    // ✅ 补充兼容处理：如果 task_type 是字符串如 “其他”，转换为数字
    if (typeof task_type === 'string') {
      const matched = this.data.taskTypes.find(t => t.label === task_type);
      task_type = matched?.value ?? null;
    }
  
    const taskTypeIndex = this.data.taskTypes.findIndex(t => t.value === task_type);
    const deadlineDate = new Date(deadline);
    const isValidDate = d => d instanceof Date && !isNaN(d);
  
    this.setData({
      selectedTaskType: this.data.taskTypes[taskTypeIndex]?.label || '',
      selectedTaskTypeIndex: taskTypeIndex,
      selectedDepartment: this.data.departments.find(d => d.value === department)?.label || '',
      selectedMaker: name,
      selectedYear: isValidDate(deadlineDate) ? `${deadlineDate.getFullYear()}年` : '',
      selectedMonth: isValidDate(deadlineDate) ? `${deadlineDate.getMonth() + 1}月` : '',
      selectedDay: isValidDate(deadlineDate) ? `${deadlineDate.getDate()}日` : '',
      selectedHour: isValidDate(deadlineDate) ? `${deadlineDate.getHours()}时` : '',
      selectedMinute: isValidDate(deadlineDate) ? `${deadlineDate.getMinutes()}分` : '',
      apiData: {
        task_type,
        department,
        maker_id,
        name,
        content,
        deadline
      }
    });
  
    this.updateCurrentMakersByDepartment(department);
  },  

  onTaskTypeChange(e) {
    const taskTypeIndex = parseInt(e.detail.value);
    const taskType = this.data.taskTypes[taskTypeIndex];
    this.setData({
      selectedTaskType: taskType.label,
      selectedTaskTypeIndex: taskTypeIndex,
      apiData: { ...this.data.apiData, task_type: taskType.value }
    });
    this.loadCurrentMakerByTaskType(taskType.value);
  },
  

  loadCurrentMakerByTaskType(taskType) {
    const currentMaker = this.data.currentMakersData.find(m => m.task_type === taskType);
    if (currentMaker) {
      const departmentObj = this.data.departments.find(dept =>
        this.data.makersData.some(d =>
          d.department === dept.value &&
          d.makers.some(m => m.maker_id === currentMaker.maker_id)
        )
      );
      if (departmentObj) {
        this.setData({
          selectedDepartment: departmentObj.label,
          selectedMaker: currentMaker.name,
          apiData: {
            ...this.data.apiData,
            department: departmentObj.value,
            name: currentMaker.name,
            maker_id: currentMaker.maker_id
          }
        });
        this.updateCurrentMakersByDepartment(departmentObj.value);
      }
    }
  },

  onDepartmentChange(e) {
    const index = parseInt(e.detail.value);
    const dept = this.data.departments[index];
    this.setData({
      selectedDepartment: dept.label,
      selectedMaker: '',
      apiData: {
        ...this.data.apiData,
        department: dept.value,
        name: '',
        maker_id: ''
      }
    });
    this.updateCurrentMakersByDepartment(dept.value);
  },

  updateCurrentMakersByDepartment(deptValue) {
    const deptData = this.data.makersData.find(item => item.department === deptValue);
    this.setData({
      currentMakers: deptData?.makers || []
    });
  },

  onMakerChange(e) {
    const index = parseInt(e.detail.value);
    const selected = this.data.currentMakers[index];
    if (selected) {
      this.setData({
        selectedMaker: selected.name,
        apiData: {
          ...this.data.apiData,
          name: selected.name,
          maker_id: selected.maker_id
        }
      });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      apiData: { ...this.data.apiData, [field]: e.detail.value }
    });
  },

  onYearChange(e) { this.setData({ selectedYear: this.data.years[e.detail.value] }); },
  onMonthChange(e) { this.setData({ selectedMonth: this.data.months[e.detail.value] }); },
  onDayChange(e) { this.setData({ selectedDay: this.data.days[e.detail.value] }); },
  onHourChange(e) { this.setData({ selectedHour: this.data.hours[e.detail.value] }); },
  onMinuteChange(e) { this.setData({ selectedMinute: this.data.minutes[e.detail.value] }); },

  onDescriptionFocused() { this.setData({ isDescriptionFocused: true }); },
  onDescriptionBlur() { this.setData({ isDescriptionFocused: false }); },

  onSubmit() {
    const { name, maker_id, content } = this.data.apiData;
    const { selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute } = this.data;

    if (!name || !maker_id || !content || !selectedYear || !selectedMonth || !selectedDay || !selectedHour || !selectedMinute) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    const strip = s => s.replace(/[^\d]/g, '').padStart(2, '0');
    const deadline = `${selectedYear.replace('年', '')}-${strip(selectedMonth)}-${strip(selectedDay)} ${strip(selectedHour)}:${strip(selectedMinute)}`;
    const finalData = { ...this.data.apiData, deadline };

    this.setData({ apiData: finalData });

    wx.request({
      url: `${API_BASE}/tasks/post`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: { ...finalData, priority: 2 },
      success: res => {
        wx.showToast({ title: '任务创建成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      },
      fail: err => {
        console.error('任务提交失败:', err);
        wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
      }
    });
  }
});
