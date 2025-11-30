// pages/project_detail/project_detail.js

var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const DEBUG = false; // 调试模式标志
const app = getApp();

// 成员人数上限
const MAX_MEMBERS = 15;

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
    icons: {},

    // ====== 成员搜索弹窗相关 ======
    showModal: false,
    searchPhone: '',
    searchResults: [],
    selectedMember: null,
    searchTimer: null,
    hasSearched: false
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
          blackCat: resources.blackCat,
          whiteCat: resources.whiteCat,
          cancel: resources.cancel,
          find: resources.find
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
        { name: "李四", college: "电子信息学院", phone: "15500000000", maker_id: "MK_MOCK_1" },
        { name: "王五", college: "计算机学院", phone: "15600000000", maker_id: "MK_MOCK_2" }
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
      url: config.project.detail + `/${project_id}`,
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
      url: config.project.toggleRecruit + `/${this.data.project_id}`,
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
   * 添加成员（弹出搜索弹窗 + 人数上限）
   */
  addMember() {
    if (DEBUG) {
      wx.showToast({
        title: '调试模式：添加成员',
        icon: 'none'
      });
      return;
    }

    const members = (this.data.apiData.members || []);
    if (members.length >= MAX_MEMBERS) {
      wx.showToast({
        title: '已达成员人数上限',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.showMemberModal();
  },

  /**
   * 删除成员：弹出列表选择要删除的成员，然后调用后端 DELETE 接口
   * DELETE  /project/{project_id}/member
   * Body:
   * {
   *   "deleted_members": [
   *     { "maker_id": "XXX" }
   *   ]
   * }
   */
  deleteMember() {
    const members = this.data.apiData.members || [];

    if (DEBUG) {
      if (!members.length) {
        wx.showToast({
          title: '当前没有成员可删除',
          icon: 'none'
        });
        return;
      }

      const itemList = members.map(m => `${m.name} - ${m.phone}`);
      wx.showActionSheet({
        itemList,
        success: (res) => {
          const index = res.tapIndex;
          const updated = members.filter((_, i) => i !== index);
          this.setData({
            'apiData.members': updated
          });
          wx.showToast({
            title: '已本地删除(调试模式)',
            icon: 'none'
          });
        }
      });
      return;
    }

    if (!members.length) {
      wx.showToast({
        title: '当前没有成员可删除',
        icon: 'none'
      });
      return;
    }

    if (!config || !config.project || !config.project.member) {
      console.warn('[Project Detail] config.projects.member 未配置');
      wx.showToast({
        title: '删除成员接口未配置',
        icon: 'none'
      });
      return;
    }

    const itemList = members.map(m => `${m.name} - ${m.phone}`);

    wx.showActionSheet({
      itemList,
      success: (res) => {
        const index = res.tapIndex;
        const member = members[index];

        if (!member || !member.maker_id) {
          wx.showToast({
            title: '成员信息缺少 maker_id',
            icon: 'none'
          });
          return;
        }

        wx.showModal({
          title: '确认删除',
          content: `确定将 ${member.name} 移出项目吗？`,
          success: (modalRes) => {
            if (!modalRes.confirm) return;

            wx.showLoading({
              title: '移除中...'
            });

            wx.request({
              url: `${config.project.member}/${this.data.project_id}/member`,
              method: 'DELETE',
              header: {
                'content-type': 'application/json',
                'Authorization': token
              },
              data: {
                deleted_members: [
                  { maker_id: member.maker_id }
                ]
              },
              success: (resp) => {
                console.log('[Project Detail] 删除成员响应:', resp);
                if (resp.data && resp.data.code === 200) {
                  const updated = members.filter((_, i) => i !== index);
                  this.setData({
                    'apiData.members': updated
                  });
                  wx.showToast({
                    title: '成员已移除',
                    icon: 'success'
                  });
                } else {
                  wx.showToast({
                    title: (resp.data && resp.data.message) || '移除失败',
                    icon: 'none'
                  });
                }
              },
              fail: (err) => {
                console.error('[Project Detail] 删除成员失败:', err);
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
        });
      }
    });
  },

  /**
   * 结束项目
   */
  finishProject() {
    const that = this;

    // 先弹确认框（防止误触）
    wx.showModal({
      title: '确认提交结项',
      content: '提交结项后，项目状态将进入结项审批流程，确认现在提交吗？',
      success(res) {
        if (!res.confirm) return;

        // 调试模式：仅提示，不调后端
        if (DEBUG) {
          wx.showToast({
            title: '调试模式：已提交结项',
            icon: 'success'
          });
          return;
        }

        // 配置检查
        if (!config || !config.project || !config.project.submitClosure) {
          console.warn('[Project Detail] config.project.submitClosure 未配置');
          wx.showToast({
            title: '结项接口未配置',
            icon: 'none'
          });
          return;
        }

        if (!that.data.project_id) {
          wx.showToast({
            title: '缺少项目ID',
            icon: 'none'
          });
          return;
        }

        // 这里先用一个简单的描述，你后面可以改成从输入框获取
        const finishDesc =
          (that.data.apiData && that.data.apiData.finish_description) ||
          '项目已圆满完成，相关成果材料已提交。';

        wx.showLoading({
          title: '提交中...',
        });

        wx.request({
          url: `${config.project.submitClosure}/${that.data.project_id}/action/submit-closure`,
          method: 'PUT',
          header: {
            'content-type': 'application/json',
            'Authorization': token
          },
          data: {
            finish_description: finishDesc
          },
          success: (res) => {
            console.log('[Project Detail] 提交结项响应:', res);
            if (res.data && res.data.code === 200) {
              wx.showToast({
                title: '结项申请已提交',
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
                title: (res.data && res.data.message) || '提交结项失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            console.error('[Project Detail] 提交结项失败:', err);
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
   * 下拉刷新
   */
  onPullDownRefresh() {
    if (this.data.project_id) {
      this.fetchProjectDetail(this.data.project_id);
    }
    wx.stopPullDownRefresh();
  },

  // ============== 成员搜索弹窗逻辑（与创建页对齐） ==============

  // Mock 搜索结果
  getMockSearchResults(phone) {
    const allMockUsers = [
      { real_name: "张三", college: "计算机学院", phone_num: "13800138000", maker_id: "MK20251123225706077_863" },
      { real_name: "张小明", college: "软件学院", phone_num: "13855556666", maker_id: "MK20251123225706077_862" },
      { real_name: "李四", college: "电子信息学院", phone_num: "13912345678", maker_id: "MK20251123225706077_861" },
      { real_name: "王五", college: "数学学院", phone_num: "13923456789", maker_id: "MK20251123225706077_860" },
      { real_name: "赵六", college: "物理学院", phone_num: "13934567890", maker_id: "MK20251123225706077_859" },
      { real_name: "钱七", college: "化学学院", phone_num: "13945678901", maker_id: "MK20251123225706077_858" },
      { real_name: "孙八", college: "生物学院", phone_num: "13956789012", maker_id: "MK20251123225706077_857" }
    ];

    const filtered = allMockUsers.filter(user =>
      user.phone_num.includes(phone)
    );

    return filtered.slice(0, 5);
  },

  // 搜索输入
  onSearchInput(e) {
    const phone = e.detail.value;
    this.setData({
      searchPhone: phone,
      selectedMember: null,
      hasSearched: false
    });

    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }

    if (!phone || phone.length === 0) {
      this.setData({
        searchResults: [],
        hasSearched: false
      });
      return;
    }

    const timer = setTimeout(() => {
      this.searchMembers(phone);
    }, 150);

    this.setData({
      searchTimer: timer
    });
  },

  // 搜索接口调用
  searchMembers(phone) {
    console.log('[Project Detail] 开始搜索成员:', phone);

    if (DEBUG) {
      console.log('[DEBUG] 使用 Mock 数据搜索成员');
      setTimeout(() => {
        const mockResults = this.getMockSearchResults(phone);
        console.log('[DEBUG] Mock 结果:', mockResults);

        this.setData({
          searchResults: mockResults,
          hasSearched: true
        });
      }, 300);
      return;
    }

    if (!config || !config.users || !config.users.find_by_phonenum) {
      console.warn('[Project Detail] config.users.find_by_phonenum 未配置，使用 Mock 数据');
      const mockResults = this.getMockSearchResults(phone);
      this.setData({
        searchResults: mockResults,
        hasSearched: true
      });
      return;
    }

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
        console.log('[Project Detail] 搜索接口返回:', res);

        if (res.statusCode === 200 && res.data.code === 200) {
          const results = (res.data.data || []).slice(0, 5);
          this.setData({
            searchResults: results,
            hasSearched: true
          });
        } else {
          console.error('[Project Detail] 搜索接口返回错误:', res.data.msg);
          this.setData({
            searchResults: [],
            hasSearched: true
          });
          wx.showToast({
            title: res.data.msg || '搜索失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('[Project Detail] 搜索失败:', err);
        this.setData({
          searchResults: [],
          hasSearched: true
        });
        wx.showToast({
          title: '网络错误,请重试',
          icon: 'none'
        });
      }
    });
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false
    });
  },

  // 选择成员
  selectMember(e) {
    const index = e.currentTarget.dataset.index;
    const member = this.data.searchResults[index];

    console.log('[Project Detail] 选择成员:', member);

    const displayText = `${member.real_name} - ${member.phone_num} - ${member.college}`;

    this.setData({
      selectedMember: member,
      searchPhone: displayText,
      searchResults: [],
      hasSearched: false
    });
  },

  // 确认添加成员（更新前端列表，后端可按需接入）
  confirmAddMember() {
    if (!this.data.selectedMember) {
      wx.showToast({
        title: '请先选择一个成员',
        icon: 'none'
      });
      return;
    }

    const members = this.data.apiData.members || [];
    if (members.length >= MAX_MEMBERS) {
      wx.showToast({
        title: '已达成员人数上限',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const selectedMember = this.data.selectedMember;

    // 检查是否已存在
    const exists = members.some(m => m.phone === selectedMember.phone_num);
    if (exists) {
      wx.showToast({
        title: '该成员已在团队中',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const newMember = {
      name: selectedMember.real_name,
      college: selectedMember.college,
      phone: selectedMember.phone_num,
      maker_id: selectedMember.maker_id
    };

    const updatedMembers = [...members, newMember];

    this.setData({
      'apiData.members': updatedMembers
    });

    console.log('[Project Detail] 添加成员成功:', newMember);
    console.log('[Project Detail] 当前成员列表:', updatedMembers);

    this.hideModal();
  },

  // 显示成员弹窗
  showMemberModal() {
    this.setData({
      showModal: true,
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false
    });
  },

  // 隐藏成员弹窗
  hideModal() {
    this.setData({
      showModal: false,
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false
    });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 搜索框获得焦点（可选）
  onSearchFocus() {
    console.log('[Project Detail] 搜索框获得焦点');
  },

  // 搜索框失焦（可选）
  onSearchBlur() {}
});
