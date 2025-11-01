// pages/site_borrow_apply/site_borrow_apply.js
var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const DEBUG = false;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,
    apply_id: '',
    formData: {
      name: '',
      student_id: '',
      phone_num: '',
      email: '',
      purpose: '',
      project_id: '',
      mentor_name: '',
      mentor_phone_num: '',
      site_id: '',
      site: '',
      number: '',
      start_time: '',
      end_time: '',
    },
    options: {
      years: Array.from({ length: 10 }, (_, i) => 2024 + i + '年'),
      months: Array.from({ length: 12 }, (_, i) => i + 1 + '月'),
      days: Array.from({ length: 31 }, (_, i) => i + 1 + '日'),
    },
    siteNames: [], // 将在onLoad中初始化
    selectedSiteIndex: -1,
    selectedSiteName: '',
    currentNumbers: [],
    displayNumbers: [], // Numbers with "(已占用)" for occupied ones
    selectedNumber: '',
    numberOptions: [], // 新增：存储完整的编号选项信息
    
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
    
    // 表单焦点状态
    isLeaderNameFocused: false,
    isGradeFocused: false,
    isLeaderPhoneFocused: false,
    isEmailFocused: false,
    isDescriptionFocused: false,
    isProjectIdFocused: false,
    isAdvisorNameFocused: false,
    isAdvisorPhoneFocused: false,

    // 表单可提交验证
    isValid: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("token", token);
    // 获取所有场地
    this.fetchSites();
    
    // 检查是否是编辑模式
    if (options.edit === 'true' && options.apply_id) {
      this.setData({
        isEdit: true,
        apply_id: options.apply_id
      });
      
      // 从后端获取申请数据
      this.fetchApplyData(options.apply_id);
    } else {
      // 非编辑模式，默认设置起借时间为当前日期
      const today = new Date();
      const year = today.getFullYear() + '年';
      const month = (today.getMonth() + 1) + '月';
      const day = today.getDate() + '日';
      
      this.setData({
        startSelectedYear: year,
        startSelectedMonth: month,
        startSelectedDay: day
      });
      
      this.updateStartDays();
      this.updateStartTimeInFormData();
    }
  },

  fetchSites() {
    wx.showLoading({ title: '加载中...' });
    if (DEBUG) {
      // Simulate API response
      setTimeout(() => {
        const mockData = {
          code: 200,
          message: "successfully get all sites",
          sites: [
            {
              site_id: "ST001",
              site: "二基楼B208+",
              details: [
                { number: 1, is_occupied: 0 },
                { number: 2, is_occupied: 0 },
                { number: 3, is_occupied: 1 }
              ]
            },
            {
              site_id: "ST002",
              site: "二基楼B101",
              details: [
                { number: 1, is_occupied: 1 },
                { number: 2, is_occupied: 0 },
                { number: 3, is_occupied: 1 }
              ]
            }
          ]
        };
        this.processSiteData(mockData);
        wx.hideLoading();
      }, 500);
    } else {
      wx.request({
        url: config.site.get_all,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'Authorization': token
        },
        success: (res) => {
          if (res.data.code === 200 && res.data.sites) {
            this.processSiteData(res.data);
          } else {
            wx.showToast({
              title: res.data.message || '获取场地数据失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
  },

  // Process site data from API
  processSiteData(data) {
    const siteNames = data.sites.map(item => item.site);
    // 初始化 numberOptions
    const initialNumbers = data.sites[0]?.details || [];
    const numberOptions = initialNumbers.map(detail => ({
      number: detail.number,
      isOccupied: detail.is_occupied === true,
      displayText: detail.is_occupied === true ? `${detail.number} (已占用)` : `${detail.number}`
    }));
    
    this.setData({
      siteData: data.sites,
      siteNames: siteNames,
      numberOptions: numberOptions, // 初始化
      displayNumbers: numberOptions.map(opt => opt.displayText)
    });
  },
  
  // 从后端获取申请数据
  fetchApplyData(apply_id) {
    wx.showLoading({
      title: '加载数据...'
    });
    if(DEBUG) {
      // 模拟API调用
      setTimeout(() => {
        // 模拟数据
        const mockData = {
          code: 200,
          message: "successfully get site-application detail",
          data: {
            apply_id: "LB1749636004000",
            name: "张三",
            student_id: "2023141460079",
            phone_num: "13800138000",
            email: "student@example.com",
            purpose: "创新项目展示与研讨",
            project_id: "PJ1749636004000",
            mentor_name: "李华",
            mentor_phone_num: "13900139000",
            site_id: "ST001",
            site: "二基楼B101",
            number: 2,
            start_time: "2024-02-15",
            end_time: "2024-02-25",
            state: 0,
            review: ""
          }
        };
        
        // 处理模拟响应
        if (mockData.code === 200 && mockData.data) {
          this.loadApplyData(mockData.data);
        } else {
          wx.showToast({
            title: mockData.message || '获取申请数据失败',
            icon: 'none'
          });
        }
        
        wx.hideLoading();
      }, 500); // 模拟网络延迟
    } else {
      wx.request({
        url: config.sites_borrow.detail + `/${apply_id}`,
        method:'GET',
        header: {
          'content-type': 'application/json',
          'Authorization': token
        },
        success: (res) => {
          if (res.data.code === 200 && res.data.data) {
            // 加载申请数据到表单
            this.loadApplyData(res.data.data);
          } else {
            wx.showToast({
              title: res.data.message || '获取申请数据失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
  },
  
  // 加载申请数据到表单
  loadApplyData(applyData) {
    const formData = {
      name: applyData.name,
      student_id: applyData.student_id,
      phone_num: applyData.phone_num,
      email: applyData.email,
      purpose: applyData.purpose,
      project_id: applyData.project_id,
      mentor_name: applyData.mentor_name,
      mentor_phone_num: applyData.mentor_phone_num,
      site: applyData.site,
      site_id: applyData.site_id || '', // Ensure site_id is included
      number: applyData.number,
      start_time: applyData.start_time,
      end_time: applyData.end_time
    };
    
    this.setData({ formData });
    
    // Set site information
    const siteIndex = this.data.siteNames.findIndex(site => site === applyData.site);
    if (siteIndex !== -1) {
      const site = this.data.siteData[siteIndex];
      
      // 生成带状态的编号选项
      // const numberOptions = site.details.map(detail => ({
      //   number: detail.number,
      //   isOccupied: detail.is_occupied === true,
      //   displayText: detail.is_occupied === true ? `${detail.number} (已占用)` : `${detail.number}`
      // }));
          // 关键修复：生成带状态的编号选项时排除自身占用
      const numberOptions = site.details.map(detail => {
        // 检查是否是当前申请占用的工位
        const isSelfOccupied = this.data.isEdit && 
                              this.data.apply_id === applyData.apply_id && 
                              detail.number === applyData.number;
        
        // 如果是自身占用的工位，不标记为已占用
        const isOccupied = detail.is_occupied && !isSelfOccupied;
        
        return {
          number: detail.number,
          isOccupied: isOccupied,
          displayText: isOccupied ? 
            `${detail.number} (已占用)` : 
            `${detail.number}`
        };
      });
      // 筛选可用编号
      const availableNumbers = numberOptions
        .filter(opt => !opt.isOccupied)
        .map(opt => opt.number);
      
      this.setData({
        selectedSiteIndex: siteIndex,
        selectedSiteName: applyData.site,
        selectedSiteId: site.site_id,
        numberOptions: numberOptions,
        displayNumbers: numberOptions.map(opt => opt.displayText),
        currentNumbers: availableNumbers
      });
      
      // 保留原选中编号（如果可用）
      if (availableNumbers.includes(applyData.number)) {
        this.setData({
          selectedNumber: applyData.number,
          'formData.number': applyData.number
        });
      } else if (applyData.number) {
        // 如果原编号已被占用，显示但不允许选择
        this.setData({
          selectedNumber: applyData.number
        });
      }
      this.updateSelectedNumberDisplay();
    }
    
    // Set dates
    if (applyData.start_time) {
      const startDate = new Date(applyData.start_time);
      this.setData({
        startSelectedYear: startDate.getFullYear() + '年',
        startSelectedMonth: (startDate.getMonth() + 1) + '月',
        startSelectedDay: startDate.getDate() + '日'
      });
      this.updateStartDays();
      this.updateStartTimeInFormData();
    }
    
    if (applyData.end_time) {
      const endDate = new Date(applyData.end_time);
      this.setData({
        endSelectedYear: endDate.getFullYear() + '年',
        endSelectedMonth: (endDate.getMonth() + 1) + '月',
        endSelectedDay: endDate.getDate() + '日'
      });
      this.updateEndDays();
      this.updateEndTimeInFormData();
    }
  },

  // 更新selectedNumber
  updateSelectedNumberDisplay() {
    if (!this.data.selectedNumber) {
      this.setData({
        selectedNumberDisplay: '请选择',
        isSelectedOccupied: false
      });
      return;
    }
    
    // 在 numberOptions 中查找当前选中的选项
    const selectedOption = this.data.numberOptions.find(
      opt => opt.number === this.data.selectedNumber
    );
    
    if (selectedOption) {
      this.setData({
        selectedNumberDisplay: selectedOption.displayText,
        isSelectedOccupied: selectedOption.isOccupied
      });
    } else {
      // 如果没找到（如编辑模式中的历史数据），检查是否被占用
      const isOccupied = this.data.displayNumbers.some(
        text => text.includes(`${this.data.selectedNumber} (已占用)`)
      );
      
      this.setData({
        selectedNumberDisplay: isOccupied ? 
          `${this.data.selectedNumber} (已占用)` : 
          this.data.selectedNumber.toString(),
        isSelectedOccupied: isOccupied
      });
    }
  },
  
   // 表单焦点处理函数
   onLeaderNameFocus() {
    this.setData({ isLeaderNameFocused: true });
  },
  onLeaderNameBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isLeaderNameFocused: false,
      'formData.name': value
    });
    console.log("newLeaderName: ", value);
    if (this.data.isEdit) {
      this.updateChangedField('name', value);
    }
  },
  
  onGradeFocus() {
    this.setData({ isGradeFocused: true });
  },
  onGradeBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isGradeFocused: false,
      'formData.student_id': value
    });
    if (this.data.isEdit) {
      this.updateChangedField('student_id', value);
    }
  },
  
  onLeaderPhoneFocus() {
    this.setData({ isLeaderPhoneFocused: true });
  },
  onLeaderPhoneBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isLeaderPhoneFocused: false,
      'formData.phone_num': value
    });
    console.log("new_phone_num: ", value);
  },

  onEmailFocus() {
    this.setData({ isEmailFocused: true });
  },
  onEmailBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isEmailFocused: false,
      'formData.email': value
    });
    console.log("new_email: ", value);
  },
  
  onDescriptionFocused() {
    this.setData({ isDescriptionFocused: true });
  },
  onDescriptionBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isDescriptionFocused: false,
      'formData.purpose': value
    });
    console.log("new_purpose: ", value);
  },
  
 onProjectIdFocus() {
    this.setData({ isProjectIdFocused: true });
  },
  onProjectIdBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isProjectIdFocused: false,
      'formData.project_id': value
    });
    console.log("newProjectId: ", value);
  },

  onAdvisorNameFocus() {
    this.setData({ isAdvisorNameFocused: true });
  },
  onAdvisorNameBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isAdvisorNameFocused: false,
      'formData.mentor_name': value
    });
    console.log("new_mentor_name: ", value);
  },
  
  onAdvisorPhoneFocus() {
    this.setData({ isAdvisorPhoneFocused: true });
  },
  onAdvisorPhoneBlur(e) {
    const value = e.detail.value;
    this.setData({ 
      isAdvisorPhoneFocused: false,
      'formData.mentor_phone_num': value
    });
    console.log("new_mentor_phone_num: ", value);
  },

  // 场地选择处理
  onSiteChange(e) {
    const siteIndex = e.detail.value;
    const site = this.data.siteData[siteIndex];
    
    // 生成带状态的编号选项
    const numberOptions = site.details.map(detail => {
      // number: detail.number,
      // isOccupied: detail.is_occupied === true,
      // displayText: detail.is_occupied === true ? `${detail.number} (已占用)` : `${detail.number}
      const isSelfOccupied = this.data.isEdit && 
                          this.data.apply_id && 
                          detail.number === this.data.formData.number;
      
      const isOccupied = detail.is_occupied && !isSelfOccupied;
      
      return {
        number: detail.number,
        isOccupied: isOccupied,
        displayText: isOccupied ? 
          `${detail.number} (已占用)` : 
          `${detail.number}`
      };
    });
    
    // 筛选可用编号
    const availableNumbers = numberOptions
      .filter(opt => !opt.isOccupied)
      .map(opt => opt.number);
    
    this.setData({
      selectedSiteIndex: siteIndex,
      selectedSiteName: site.site,
      selectedSiteId: site.site_id,
      numberOptions: numberOptions,
      displayNumbers: numberOptions.map(opt => opt.displayText),
      currentNumbers: availableNumbers,
      selectedNumber: '', // 重置编号选择
      'formData.site': site.site,
      'formData.site_id': site.site_id,
      'formData.number': ''
    });
    this.updateSelectedNumberDisplay(); 
  },
  
  // 场地编号选择处理
  onSiteNumberChange(e) {
    const selectedIndex = e.detail.value;
    const selectedOption = this.data.numberOptions[selectedIndex];
    
    // 总是更新选中的编号和显示文本，但根据占用状态决定是否更新表单数据
    this.setData({
      selectedNumber: selectedOption.number,
    });
    this.updateSelectedNumberDisplay();
    
    if (selectedOption.isOccupied) {
      wx.showToast({
        title: '该工位已被占用，请选择其他编号',
        icon: 'none'
      });
      // 清空表单中的场地编号（不更新表单数据）
      this.setData({
        'formData.number': ''
      });
      console.log("formatData.number", this.data.formData.number);
    } else {
      // 更新表单数据
      this.setData({
        'formData.number': selectedOption.number
      });
    }
  },
 
  // 起借日期 - 年份选择处理
  onYearChange(e) {
    // 确定是哪个日期选择器触发的事件
    const target = e.currentTarget.dataset.type || 'start';
    const yearIndex = e.detail.value;
    const year = this.data.options.years[yearIndex];
    
    if (target === 'end') {
      this.setData({
        endSelectedYear: year
      });
      this.updateEndDays();
      this.updateEndTimeInFormData();
    } else {
      this.setData({
        startSelectedYear: year
      });
      this.updateStartDays();
      this.updateStartTimeInFormData();
    }
  },

  // 月份选择处理
  onMonthChange(e) {
    // 确定是哪个日期选择器触发的事件
    const target = e.currentTarget.dataset.type || 'start';
    const monthIndex = e.detail.value;
    const month = this.data.options.months[monthIndex];
    
    if (target === 'end') {
      this.setData({
        endSelectedMonth: month
      });
      this.updateEndDays();
      this.updateEndTimeInFormData();
    } else {
      this.setData({
        startSelectedMonth: month
      });
      this.updateStartDays();
      this.updateStartTimeInFormData();
    }
  },

  // 日期选择处理
  onDayChange(e) {
    // 确定是哪个日期选择器触发的事件
    const target = e.currentTarget.dataset.type || 'start';
    const dayIndex = e.detail.value;
    const day = this.data.options.days[dayIndex];
    
    if (target === 'end') {
      this.setData({
        endSelectedDay: day
      });
      this.updateEndTimeInFormData();
    } else {
      this.setData({
        startSelectedDay: day
      });
      this.updateStartTimeInFormData();
    }
  },

  // 更新起借日期数组，根据选择的年月调整天数
  updateStartDays() {
    if (!this.data.startSelectedYear || !this.data.startSelectedMonth) return;
    
    const year = parseInt(this.data.startSelectedYear.replace('年', ''));
    const month = parseInt(this.data.startSelectedMonth.replace('月', ''));
    
    // 获取当月天数
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1 + '日');
    
    this.setData({
      'options.days': days,
      startSelectedDay: this.data.startSelectedDay && parseInt(this.data.startSelectedDay) <= daysInMonth ? 
                    this.data.startSelectedDay : days[0]
    });
  },
  
  // 更新归还日期数组，根据选择的年月调整天数
  updateEndDays() {
    if (!this.data.endSelectedYear || !this.data.endSelectedMonth) return;
    
    const year = parseInt(this.data.endSelectedYear.replace('年', ''));
    const month = parseInt(this.data.endSelectedMonth.replace('月', ''));
    
    // 获取当月天数
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1 + '日');
    
    this.setData({
      'options.days': days,
      endSelectedDay: this.data.endSelectedDay && parseInt(this.data.endSelectedDay) <= daysInMonth ? 
                  this.data.endSelectedDay : days[0]
    });
  },

  updateStartTimeInFormData() {
    if (!this.data.startSelectedYear || !this.data.startSelectedMonth || !this.data.startSelectedDay) return;
    
    const year = parseInt(this.data.startSelectedYear.replace('年', ''));
    const month = parseInt(this.data.startSelectedMonth.replace('月', ''));
    const day = parseInt(this.data.startSelectedDay.replace('日', ''));
    
    // 格式化为YYYY-MM-DD
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    this.setData({
      'formData.start_time': formattedDate
    });
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
        'formData.end_time': formattedDate
      });
  },

  // 显示场地编号规则
  showSiteNumberRule() {
    wx.showModal({
      title: '场地编号规则',
      content: '每个场地有不同数量的编号，请根据需求选择合适的场地和编号。',
      showCancel: false
    });
  },
  
  // 表单验证
  validateForm() {
    // 重置验证状态
    this.setData({ isValid: true });

    // 1. 借用人姓名
    if (!this.data.formData.name) {
      wx.showToast({ title: '请输入借用人姓名', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 2. 借用人学号
    if (!this.data.formData.student_id) {
      wx.showToast({ title: '请输入借用人学号', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 3. 借用人电话
    if (!this.data.formData.phone_num) {
      wx.showToast({ title: '请输入借用人电话', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 4. 借用人邮箱
    if (!this.data.formData.email) {
      wx.showToast({ title: '请输入借用人邮箱', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 5. 借用用途
    if (!this.data.formData.purpose) {
      wx.showToast({ title: '请输入借用用途', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 6. 指导老师姓名
    if (!this.data.formData.mentor_name) {
      wx.showToast({ title: '请输入指导老师姓名', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 7. 指导老师电话
    if (!this.data.formData.mentor_phone_num) {
      wx.showToast({ title: '请输入指导老师电话', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 8. 场地
    if (!this.data.selectedSiteName) {
      wx.showToast({ title: '请选择场地', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 9. 场地编号
    if (!this.data.selectedNumber) {
      wx.showToast({ title: '请选择工位编号', icon: 'none' });
      this.setData({ isValid: false });
    } else if (this.data.isSelectedOccupied) {
      wx.showToast({ title: '所选工位已被占用，请选择其他工位编号', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 10. 起借日期
    if (!this.data.formData.start_time) {
      wx.showToast({ title: '请选择起借日期', icon: 'none' });
      this.setData({ isValid: false });
    }
    // 11. 归还日期
    if (!this.data.formData.end_time) {
      wx.showToast({ title: '请选择归还日期', icon: 'none' });
      this.setData({ isValid: false });
    }

    // 12. 归还日期必须晚于起借日期
    if (this.data.formData.start_time && this.data.formData.end_time) {
      if (this.data.formData.end_time <= this.data.formData.start_time) {
        wx.showToast({
          title: `归还日期(${this.data.formData.end_time})必须晚于起借日期(${this.data.formData.start_time})`,
          icon: 'none'
        });
        this.setData({ isValid: false });
      }
    }

    // 最终返回验证结果（虽然微信小程序里 return 值可能无效，但这里可以让逻辑更清晰）
    return this.data.isValid;
  },
  
  // 提交表单
  onSubmit() {
    // 验证表单
    this.validateForm();
    console.log("isValid: ", this.data.isValid);
    if (!this.data.isValid) {
      wx.hideLoading();
      return;
    }
    
    wx.showLoading({ title: '提交中...' });
    
    // 准备提交的数据，统一格式
    const submitData = {
      name: this.data.formData.name,
      student_id: this.data.formData.student_id,
      phone_num: this.data.formData.phone_num,
      email: this.data.formData.email,
      purpose: this.data.formData.purpose,
      project_id: this.data.formData.project_id || '',
      mentor_name: this.data.formData.mentor_name,
      mentor_phone_num: this.data.formData.mentor_phone_num,
      site_id: this.data.formData.site_id,
      site: this.data.selectedSiteName,
      number: this.data.selectedNumber,
      start_time: this.data.formData.start_time,
      end_time: this.data.formData.end_time
    };
    
    // 根据是否是编辑模式选择不同的API
    if (this.data.isEdit) {
      // 编辑模式，发送完整表单数据
      console.log('提交的编辑数据:', submitData);
      
      if (DEBUG) {
        // 模拟API调用
        setTimeout(() => {
          const mockResponse = {
            code: 400,
            message: "successfully update application",
            data: {
              apply_id: this.data.apply_id
            }
          };
          
          if (mockResponse.code === 200) {
            wx.showToast({
              title: '修改成功',
              icon: 'success',
              duration: 1500,
              success: () => {
                setTimeout(() => {
                  wx.navigateBack({ delta: 1 });
                }, 1500);
              }
            });
            console.log('修改成功，提交数据:', submitData);
          } else if (mockResponse.code === 400) {
            wx.showModal({
              content: '所选场地已被他人申请，请重新选择并提交',
              showCancel: false,
              confirmColor: '#00ADB5'
            });
            this.fetchSites();
          } else {
            wx.showToast({
              title: mockResponse.message || '修改失败',
              icon: 'none'
            });
          } 
          wx.hideLoading();
        }, 1000); // 模拟网络延迟
      } else {
        wx.request({
          url: config.sites_borrow.update + `/${this.data.apply_id}`,
          method: 'PATCH',
          header: {
            'content-type': 'application/json',
            'Authorization': token
          },
          data: submitData,
          success: (res) => {
            if (res.data.code === 200) {
              wx.showToast({
                title: '修改成功',
                icon: 'success',
                duration: 1500,
                success: () => {
                  setTimeout(() => {
                    wx.navigateBack({ delta: 1 });
                  }, 1500);
                }
              });
              console.log("修改成功，提交数据:", submitData);
            } else if(res.data.code === 400) {
              wx.showModal({
                content: '所选场地已被他人申请，请重新选择并提交',
                showCancel: false,
                confirmColor: '#00ADB5',
                success: () => {
                  // 重新加载场地状态
                  this.fetchSites();
                }
              });
              this.fetchSites();
            } else {
              wx.showToast({
                title: res.data.message || '修改失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            console.error('请求失败:', err);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      }
    } else {
      // 新申请模式，发送完整表单
      console.log('提交的新申请数据:', submitData);
      
      if (DEBUG) {
        // 模拟API调用
        setTimeout(() => {
          const mockResponse = {
            code: 400,
            message: "successfully create new site-application",
            data: {
              event_id: "LB" + Date.now()
            }
          };
          
          if (mockResponse.code === 200) {
            wx.showToast({
              title: '申请成功',
              icon: 'success',
              duration: 1500,
              success: () => {
                setTimeout(() => {
                  wx.navigateBack({ delta: 1 });
                }, 1500);
              }
            });
            console.log('提交的新申请数据:', submitData);
          } else if (mockResponse.code === 400) {
            wx.showToast({
              title: '所选场地已被他人申请',
              icon: 'error'
            });
            this.fetchSites();
          } else {
            wx.showToast({
              title: mockResponse.message || '申请失败',
              icon: 'none'
            });
          }
          
          wx.hideLoading();
        }, 1000); // 模拟网络延迟
      } else {
        wx.request({
          url: config.sites_borrow.post,
          method: 'POST',
          header: {
            'content-type': 'application/json',
            'Authorization': token
          },
          data: submitData,
          success: (res) => {
            if (res.data.code === 200) {
              wx.showToast({
                title: '申请成功',
                icon: 'success',
                duration: 1500,
                success: () => {
                  setTimeout(() => {
                    wx.navigateBack({ delta: 1 });
                  }, 1500);
                }
              });
            } else if(res.data.code === 400) {
              wx.showModal({
                content: '所选工位已被他人申请，请重新选择并提交',
                showCancel: false,
                confirmColor: '#00ADB5'
              });
              this.fetchSites();
            } else {
              wx.showToast({
                title: res.data.message || '申请失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            console.error('请求失败:', err);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      }
    }
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
  }
})
