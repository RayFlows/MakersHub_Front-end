// pages/project_detail/project_detail.js

var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const DEBUG = false; // 调试模式标志
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    apiData: {},
    stateTag: ["待审核", "已打回", "进行中", "已完成"],
    stateText: ['#FFFFFF', '#FFFFFF', '#222831', '#FFFFFF'],
    stateColors: {
      0: "#666",
      1: "#E33C64",
      2: "#ffeaa7",
      3: "#00adb5"
    },
    project_id: '',
    icons: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("[Project Detail] 获取页面图标资源");
    this.loadIcons();

    // ✅ 无论有没有传 project_id，都给一个 id，然后一律调用 fetchProjectDetail
    const projectIdFromOption = options.project_id;
    const finalProjectId = projectIdFromOption || "MOCK_PROJECT_ID";

    if (!projectIdFromOption) {
      console.warn("[Project Detail] 未传 project_id，使用 MOCK_PROJECT_ID + mock 数据");
    }

    this.setData({
      project_id: finalProjectId
    });

    this.fetchProjectDetail(finalProjectId);
  },

  /**
   * 加载图标资源
   */
  loadIcons() {
    const resources = app.globalData.publicResources;

    if (resources) {
      this.setData({
        icons: {
          grayCopy: resources.grayCopy,
          blackCat: resources.blackCat
        }
      });
    }
  },

  /**
   * 获取项目详情（带 mock fallback）
   * 预留后端接口：config.projects.detail
   */
  fetchProjectDetail(project_id) {
    wx.showLoading({
      title: '加载中...',
    });

    // 统一 mock 数据
    const mockData = {
      project_id: project_id,
      project_name: "示例项目名称（Mock）",
      leader_name: "张三",
      leader_college: "计算机学院",
      leader_grade: "2023级",
      leader_student_id: "2023000000000",
      leader_phone: "13800000000",
      leader_qq: "1000000000",
      introduction: "这里是项目简介（mock 数据），因为后端未返回有效数据。",
      mentor_name: "李老师",
      mentor_phone: "13900000000",
      state: 2,
      members: [
        { name: "李四", college: "电子信息学院", phone: "15500000000" },
        { name: "王五", college: "计算机学院", phone: "15600000000" }
      ],
      is_recruit: true // 是否招募，用于开关
    };

    // 1）DEBUG 模式：直接用 mockData
    if (DEBUG) {
      console.log("[Project Detail] DEBUG 模式，使用 mockData");
      this.setData({
        apiData: mockData
      });
      wx.hideLoading();
      return;
    }

    // 2）接口未配置：直接用 mockData
    if (!config || !config.projects || !config.projects.detail) {
      console.warn("[Project Detail] config.projects.detail 未配置，使用 mockData");
      this.setData({
        apiData: mockData
      });
      wx.hideLoading();
      return;
    }

    // 3）请求后端，失败 / 非 200 也 fallback 到 mockData
    wx.request({
      url: config.projects.detail + `/${project_id}`,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': token
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          this.setData({
            apiData: res.data.data
          });
        } else {
          console.warn("[Project Detail] 后端返回异常，使用 mockData:", res);
          this.setData({
            apiData: mockData
          });
          wx.showToast({
            title: '使用示例数据',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error("[Project Detail] 请求失败，使用 mockData:", err);
        this.setData({
          apiData: mockData
        });
        wx.showToast({
          title: '连接失败，显示示例数据',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 自定义招募开关点击事件
   * 保留原本前端切换逻辑 + 安全接口预留
   */
  toggleRecruitCustom() {
    const current = !!this.data.apiData.is_recruit;
    const next = !current;

    // 1）DEBUG：本地直接切换
    if (DEBUG) {
      this.setData({
        'apiData.is_recruit': next
      });
      console.log("[DEBUG] 招募状态切换为：", next ? "招募中" : "未招募");
      return;
    }

    // 2）接口未配置：本地切换 + 提示
    if (!config || !config.projects || !config.projects.toggleRecruit) {
      console.warn('[Project Detail] config.projects.toggleRecruit 未配置，已本地切换，不调用后端');
      this.setData({
        'apiData.is_recruit': next
      });
      wx.showToast({
        title: next ? '本地：已开启招募' : '本地：已关闭招募',
        icon: 'none'
      });
      return;
    }

    // 3）正常调用后端
    wx.showLoading({
      title: '提交中...',
    });

    wx.request({
      url: config.projects.toggleRecruit + `/${this.data.project_id}`,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': token
      },
      data: {
        is_recruit: next
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          this.setData({
            'apiData.is_recruit': next
          });
          wx.showToast({
            title: next ? '已开启招募' : '已关闭招募',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: (res.data && res.data.message) || '修改招募状态失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('[Project Detail] 招募状态修改失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 复制项目名称
   */
  copyProjectName() {
    wx.setClipboardData({
      data: this.data.apiData.project_name || '',
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 复制项目编号
   */
  copyProjectId() {
    wx.setClipboardData({
      data: this.data.apiData.project_id || '',
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 复制负责人电话
   */
  copyLeaderPhone() {
    wx.setClipboardData({
      data: this.data.apiData.leader_phone || '',
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 复制负责人 QQ
   */
  copyLeaderQQ() {
    wx.setClipboardData({
      data: this.data.apiData.leader_qq || '',
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 添加成员（占位）
   */
  addMember() {
    if (DEBUG) {
      wx.showToast({
        title: '调试模式：添加成员',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '添加成员接口待接入',
      icon: 'none'
    });
  },

  /**
   * 删除成员（占位）
   */
  deleteMember() {
    if (DEBUG) {
      wx.showToast({
        title: '调试模式：删除成员',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '删除成员接口待接入',
      icon: 'none'
    });
  },

  /**
   * 结束项目（占位接口）
   */
  finishProject() {
    const that = this;
    wx.showModal({
      title: '确认结束项目',
      content: '结束后项目状态将不可再修改，确认结束？',
      success(res) {
        if (res.confirm) {
          if (DEBUG) {
            wx.showToast({
              title: '调试模式：已结束项目',
              icon: 'success'
            });
            return;
          }

          if (!config || !config.projects || !config.projects.finish) {
            console.warn('[Project Detail] config.projects.finish 未配置');
            wx.showToast({
              title: '结束项目接口未配置',
              icon: 'none'
            });
            return;
          }

          wx.showLoading({
            title: '提交中...',
          });

          wx.request({
            url: config.projects.finish + `/${that.data.project_id}`,
            method: 'POST',
            header: {
              'content-type': 'application/json',
              'Authorization': token
            },
            success: (res) => {
              if (res.data && res.data.code === 200) {
                wx.showToast({
                  title: '项目已结束',
                  icon: 'success',
                  duration: 1500,
                  success: () => {
                    setTimeout(() => {
                      wx.navigateBack();
                    }, 1500);
                  }
                });
              } else {
                wx.showToast({
                  title: (res.data && res.data.message) || '结束项目失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              console.error('[Project Detail] 结束项目失败:', err);
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
    });
  },

  /**
   * 返回上一页
   */
  handlerGobackClick() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 返回首页
   */
  handlerGohomeClick() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 下拉刷新：同样走带 mock fallback 的 fetchProjectDetail
   */
  onPullDownRefresh() {
    if (this.data.project_id) {
      this.fetchProjectDetail(this.data.project_id);
    }
    wx.stopPullDownRefresh();
  }
});
