const app = getApp();
const config = wx.getStorageSync('config') || {};
const token = wx.getStorageSync('auth_token') || '';
const host = config.host || '';

Page({
  data: {
    // 资源图标
    icons: {},

    // 当前项目 ID
    projectId: "",

    // 项目详情（展示用）
    project: {
      owner: "",
      college: "",
      studentId: "",
      phone: "",
      qq: "",
      name: "",
      type: "",
      intro: "",
      members: "",
      recruitText: "",
      mentorName: "",
      mentorPhone: "",
      duration: ""
    },

    // 项目状态：pending / approved / rejected
    status: "pending",

    // 审核反馈内容
    feedback: ""
  },

  /* ======================
     生命周期
  ====================== */
  onLoad(options) {
    console.log("[Detail] 页面加载, options:", options);

    this.loadIcons();

    const projectId = options.project_id || options.id || '';
    this.setData({
      projectId
    });

    this.loadProjectDetail(projectId);
  },

  loadIcons() {
    const resources = app.globalData.publicResources;
    if (resources) {
      this.setData({
        icons: {
          whiteCat: resources.whiteCat,
          cancel: resources.cancel,
          find: resources.find
        }
      });
    }
  },

  /* ======================
     审核反馈输入
  ====================== */
  onFeedbackInput(e) {
    this.setData({
      feedback: e.detail.value
    });
  },

  /* 点击“打回” - 使用原生 wx.showModal */
  onTapReject() {
    if (!this.data.feedback.trim()) {
      wx.showToast({
        title: "请输入反馈信息",
        icon: "none"
      });
      return;
    }

    wx.showModal({
      title: '确认打回',
      content: '确定要打回该项目申请吗？',
      confirmColor: '#ff4b7d', // 红色警示
      success: (res) => {
        if (res.confirm) {
          this.submitAudit(2); // 2 = 已打回
        }
      }
    });
  },

  /* 点击“通过” - 使用原生 wx.showModal */
  onTapPass() {
    wx.showModal({
      title: '确认通过',
      content: '确定要通过该项目并立项吗？',
      confirmColor: '#00B8A9',
      success: (res) => {
        if (res.confirm) {
          this.submitAudit(1); // 1 = 通过/进行中
        }
      }
    });
  },

  /* ======================
     审核接口提交
     state: 1 = 通过/进行中, 2 = 已打回
  ====================== */
  submitAudit(state) {
    const projectId = this.data.projectId;

    if (!projectId) {
      wx.showToast({
        title: '缺少项目 ID',
        icon: 'none'
      });
      return;
    }

    // 显示 Loading
    wx.showLoading({
      title: state === 1 ? '提交通过中...' : '提交打回中...',
      mask: true
    });

    const apiUrl = `${host}/project/action/audit/${projectId}`;
    const submitData = {
      state,
      review: this.data.feedback
    };

    console.log('[PUT] 请求地址:', apiUrl);
    console.log('[PUT] 请求数据:', submitData);

    wx.request({
      url: apiUrl,
      method: 'PUT',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      data: submitData,
      success: (res) => {
        wx.hideLoading();
        console.log('审核响应:', res);

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          // 成功逻辑
          if (state === 1) {
            this.setData({
              status: 'approved'
            });
            wx.showToast({
              title: '审核已通过',
              icon: 'success'
            });
          } else {
            this.setData({
              status: 'rejected'
            });
            wx.showToast({
              title: '项目已打回',
              icon: 'success'
            });
          }
        } else {
          wx.showModal({
            title: state === 1 ? '通过失败' : '打回失败',
            content: (res.data && res.data.msg) || '操作失败,请重试',
            showCancel: false
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('审核提交失败:', err);

        wx.showModal({
          title: '网络错误',
          content: '提交失败,请检查网络后重试',
          showCancel: false
        });
      }
    });
  },

  /* ======================
     获取项目详情
  ====================== */
  loadProjectDetail(projectId) {
    const apiUrl = `${host}/project/detail/${projectId}`;
    console.log('[GET] 项目详情请求:', apiUrl);

    wx.showLoading({
      title: "加载中...",
      mask: true
    });

    wx.request({
      url: apiUrl,
      method: "GET",
      header: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      success: (res) => {
        wx.hideLoading();
        console.log("[项目详情返回]:", res);

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          this.mapProjectData(res.data.data);
        } else {
          wx.showModal({
            title: "加载失败",
            content: (res.data && res.data.msg) || "无法加载项目信息",
            showCancel: false,
            success: () => wx.navigateBack()
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("加载项目详情失败:", err);
        wx.showModal({
          title: "网络错误",
          content: "无法加载项目信息，请检查网络",
          showCancel: false,
          success: () => wx.navigateBack()
        });
      }
    });
  },

  /* 顶部导航事件 */
  handlerGobackClick() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  },

  handlerGohomeClick() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /* ======================
     数据映射与处理
  ====================== */
  mapProjectData(d) {
    // 1. 成员显示逻辑
    const membersArr = d.members || [];
    const membersStr = membersArr.length ?
      membersArr
      .map((m) => `${m.real_name} - ${m.college} - ${m.phone_num}`)
      .join("\n") :
      "暂无成员";

    // 2. 项目类型文案
    const typeText =
      d.project_type === 0 ?
      "个人项目" :
      d.project_type === 1 ?
      "比赛项目" :
      String(d.project_type);

    // 3. 日期处理逻辑
    // 需求：显示格式为 "2023/01/01 - 2023/05/01"
    let startDate = (d.start_time || "").split(" ")[0]; // 取出 "2023-01-01"
    let endDate = (d.end_time || "").split(" ")[0];

    // 将 "-" 替换为 "/"
    if (startDate) startDate = startDate.replace(/-/g, '/');
    if (endDate) endDate = endDate.replace(/-/g, '/');

    // 拼接，保留中间的 " - "
    const duration =
      startDate && endDate ? `${startDate} - ${endDate}` : startDate || "";

    // 4. 审核状态
    const status =
      d.state === 1 ? "approved" :
      d.state === 2 ? "rejected" :
      "pending";

    // 5. 写入页面数据
    this.setData({
      project: {
        owner: d.leader_name,
        college: d.college,
        studentId: d.leader_student_id || "",
        phone: d.leader_phone,
        qq: d.leader_qq,
        name: d.project_name,
        type: typeText,
        intro: d.description,
        members: membersStr,
        recruitText: d.is_recruiting ? "是" : "否",
        mentorName: d.mentor_name,
        mentorPhone: d.mentor_phone,
        duration: duration // 直接使用处理好的字符串
      },
      status,
      // 这里的 review 是后端返回的历史审核意见
      feedback: d.review || ""
    });
  }
});