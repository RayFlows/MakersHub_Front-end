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

    // 审核反馈
    feedback: "",

    // 弹窗控制
    showRejectModal: false,
    showPassModal: false,
    showErrorModal: false,
    showResult: false,
    resultType: ""
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
    this.setData({ feedback: e.detail.value });
  },

  /* 点击“打回” */
  onTapReject() {
    if (!this.data.feedback.trim()) {
      wx.showToast({
        title: "请输入反馈信息",
        icon: "none"
      });
      return;
    }
    this.setData({ showRejectModal: true });
  },

  /* 点击“通过” */
  onTapPass() {
    this.setData({ showPassModal: true });
  },

  /* 关闭弹窗 */
  onCancelModal() {
    this.setData({
      showRejectModal: false,
      showPassModal: false
    });
  },

  /* ======================
     审核接口提交（按你给的可运行代码风格改写）
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

    if (state !== 1 && state !== 2) {
      console.error('非法 state 值:', state);
      return;
    }

    // 先 showLoading
    wx.showLoading({
      title: state === 1 ? '提交通过中...' : '提交打回中...',
      mask: true
    });

    const apiUrl = `${host}/project/action/audit/${projectId}`;
    const submitData = {
      state,
      review: this.data.feedback
    };

    console.log('[POST] 请求地址:', apiUrl);
    console.log('[POST] 请求数据:', submitData);

    wx.request({
      url: apiUrl,
      method: 'PUT',   // ✅ 从 POST 改为 PUT
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      data: submitData,
      success: (res) => {
        wx.hideLoading();
        console.log('审核响应:', res);
    
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          if (state === 1) {
            this.setData({
              status: 'approved',
              showResult: true,
              resultType: 'pass'
            });
          } else {
            this.setData({
              status: 'rejected',
              showResult: true,
              resultType: 'reject'
            });
          }
    
          setTimeout(() => {
            this.setData({ showResult: false });
          }, 1500);
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

  /* 点击“确认打回” */
  onConfirmReject() {
    this.setData({ showRejectModal: false });
    this.submitAudit(2);  // 已打回
  },

  /* 点击“确认通过” */
  onConfirmPass() {
    this.setData({ showPassModal: false });
    this.submitAudit(1);  // 通过 / 进行中
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

  /* 映射后端数据到前端字段 */
  mapProjectData(d) {
    // 1. 成员显示逻辑：没有成员时显示“暂无成员”
    const membersArr = d.members || [];
    const membersStr = membersArr.length
      ? membersArr
          .map((m) => `${m.real_name} - ${m.college} - ${m.phone_num}`)
          .join("\n")
      : "暂无成员";
  
    // 2. 项目类型文案
    const typeText =
      d.project_type === 0
        ? "个人项目"
        : d.project_type === 1
        ? "比赛项目"
        : String(d.project_type);
  
    // 3. 项目周期（起止日期）
    const startDate = (d.start_time || "").split(" ")[0];
    const endDate = (d.end_time || "").split(" ")[0];
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
        // ✅ 用后端的 leader_student_id，而不是 student_id
        studentId: d.leader_student_id || "",
        phone: d.leader_phone,
        qq: d.leader_qq,
        name: d.project_name,
        type: typeText,
        intro: d.description,
        // ✅ 成员字符串（可能是“暂无成员”）
        members: membersStr,
        recruitText: d.is_recruiting ? "是" : "否",
        mentorName: d.mentor_name,
        mentorPhone: d.mentor_phone,
        duration
      },
      status,
      // 已有审核意见的话也带出来
      feedback: d.review || ""
    });
  },

  /* ======================
     生命周期
  ====================== */
  onLoad(options) {
    console.log("[Detail] 页面加载, options:", options);

    this.loadIcons();  // 保留你的图标逻辑

    const projectId = options.project_id || options.id || '';
    this.setData({ projectId });

    this.loadProjectDetail(projectId);
  }
});
