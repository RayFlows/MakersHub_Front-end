// pages/project_detail/project_detail.js

var config = wx.getStorageSync('config');
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
    stateTag: ["待审核", "进行中", "已打回", "已完成"],
    stateText: ['#FFFFFF', '#222831', '#FFFFFF', '#FFFFFF'],
    stateColors: {
      0: "#666",
      1: "#ffeaa7",
      2: "#E33C64",
      3: "#00adb5"
    },
    project_id: '',
    icons: {},

    // 成员搜索弹窗相关
    showModal: false,
    searchPhone: '',
    searchResults: [],
    selectedMember: null,
    searchTimer: null,
    hasSearched: false,

    // 删除模式相关
    deleteMode: false,              // 是否处于删除选择模式
    selectedDeleteIndexes: []       // 被勾选准备删除的成员索引
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("[Project Detail] 获取页面图标资源");
    this.loadIcons();

    const projectIdFromOption = options.project_id;

    if (!projectIdFromOption) {
      console.warn("[Project Detail] 未传 project_id，无法从后端加载");
      wx.showToast({
        title: '缺少项目ID',
        icon: 'none'
      });
      return;
    }

    this.setData({
      project_id: projectIdFromOption
    });

    // 正常从后端获取
    this.fetchProjectDetail(projectIdFromOption);
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
   * 获取项目详情（带简单 mock fallback）
   * 接口：GET /project/{project_id}
   */
  fetchProjectDetail(project_id, forceMock = false) {
    wx.showLoading({
      title: '加载中...',
    });

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
        { real_name: "李四", college: "电子信息学院", phone_num: "15500000000", maker_id: "MK_MOCK_1" },
        { real_name: "王五", college: "计算机学院", phone_num: "15600000000", maker_id: "MK_MOCK_2" }
      ],
      is_recruit: true
    };

    // DEBUG 或 强制使用 mock
    if (DEBUG || forceMock) {
      console.log("[Project Detail] DEBUG / forceMock 模式，使用 mockData");
      this.setData({
        apiData: mockData
      });
      wx.hideLoading();
      return;
    }

    if (!config || !config.project || !config.project.detail) {
      console.warn("[Project Detail] config.project.detail 未配置，使用 mockData");
      this.setData({
        apiData: mockData
      });
      wx.hideLoading();
      return;
    }

    console.log("[Project Detail] 使用 token:", token);

    wx.request({
      url: `${config.project.detail}/${project_id}`,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        console.log("[Project Detail] 接口返回：", res);
        if (res.data && res.data.code === 200) {
          const raw = res.data.data || {};
          console.log('[Project Detail] 原始项目详情数据:', raw);

          // ⭐ 统一成前端使用的 is_recruit 布尔字段
          const normalized = {
            ...raw,
            is_recruit: (() => {
              if (typeof raw.is_recruit !== 'undefined' && raw.is_recruit !== null) {
                return !!raw.is_recruit;
              }
              if (typeof raw.is_recruiting !== 'undefined' && raw.is_recruiting !== null) {
                return !!raw.is_recruiting;
              }
              return false;
            })()
          };

          this.setData({
            apiData: normalized
          });
        } else {
          console.warn("[Project Detail] 后端返回异常，使用 mockData:", res);
          this.setData({
            apiData: mockData
          });
          wx.showToast({
            title: res.data.msg || res.data.message || '使用示例数据',
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
   * 接口：PUT /project/{project_id}/action/toggle-recruit
   * body: { is_recruiting: true/false } （这里同时传 is_recruit，双保险）
   */
  toggleRecruitCustom() {
    const current = !!this.data.apiData.is_recruit;
    const next = !current;

    // DEBUG：本地切换
    if (DEBUG) {
      this.setData({
        'apiData.is_recruit': next
      });
      console.log("[DEBUG] 招募状态切换为：", next ? "招募中" : "未招募");
      return;
    }

    if (!config || !config.project || !config.project.toggle_recruit) {
      console.warn('[Project Detail] config.project.toggleRecruit 未配置，已本地切换');
      this.setData({
        'apiData.is_recruit': next
      });
      wx.showToast({
        title: next ? '本地：已开启招募' : '本地：已关闭招募',
        icon: 'none'
      });
      return;
    }

    if (!this.data.project_id) {
      wx.showToast({
        title: '缺少项目ID',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '提交中...',
    });

    wx.request({
      url: `${config.project.toggle_recruit}/${this.data.project_id}`,
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: {
        // ⭐ 两个字段一起传，兼容后端可能的命名
        is_recruiting: next,
        is_recruit: next
      },
      success: (res) => {
        console.log('[Project Detail] toggle-recruit 响应:', res);
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
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
   * 添加成员：弹出搜索弹窗 + 人数上限
   */
  addMember() {
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
   * 点击“删除”：进入删除选择模式
   */
  deleteMember() {
    const members = this.data.apiData.members || [];

    if (!members.length) {
      wx.showToast({
        title: '当前没有成员可删除',
        icon: 'none'
      });
      return;
    }

    // 进入删除模式，清空之前的选择
    this.setData({
      deleteMode: true,
      selectedDeleteIndexes: []
    });
  },

  /**
   * 删除模式下：点击勾选框，切换某个成员的选中状态
   */
  toggleMemberSelect(e) {
    const index = e.currentTarget.dataset.index;
    const apiData = this.data.apiData || {};
    const members = apiData.members || [];

    if (!members[index]) return;

    const current = !!members[index]._selected;
    members[index]._selected = !current;

    const selectedIndexes = members
      .map((m, idx) => (m._selected ? idx : -1))
      .filter(idx => idx !== -1);

    this.setData({
      apiData: {
        ...apiData,
        members
      },
      selectedDeleteIndexes: selectedIndexes
    });
  },

  /**
   * 删除模式：取消按钮
   */
  cancelDeleteMode() {
    const apiData = this.data.apiData || {};
    const members = (apiData.members || []).map(m => ({
      ...m,
      _selected: false
    }));

    this.setData({
      deleteMode: false,
      selectedDeleteIndexes: [],
      apiData: {
        ...apiData,
        members
      }
    });
  },

  /**
   * 删除模式：确认按钮 -> 弹窗确认并删除
   */
  confirmDeleteSelected() {
    const members = this.data.apiData.members || [];
    const indexes = this.data.selectedDeleteIndexes || [];

    if (!indexes.length) {
      wx.showToast({
        title: '请先选择要删除的成员',
        icon: 'none'
      });
      return;
    }

    const selectedMembers = indexes
      .sort((a, b) => a - b)
      .map(i => members[i])
      .filter(m => !!m);

    const lines = selectedMembers.map((m, idx) =>
      `${idx + 1}. ${m.real_name} - ${m.college} - ${m.phone_num}`
    );
    const content = `确认删除如下选中成员？\n${lines.join('\n')}`;

    wx.showModal({
      title: '确认删除',
      content,
      success: (modalRes) => {
        if (!modalRes.confirm) return;

        // 调试 or 未配置接口：本地删除
        if (DEBUG || !config || !config.project || !config.project.delete_mem) {
          console.warn('[Project Detail] 删除成员接口未配置或调试模式，本地删除');
          const updatedLocal = members.filter((_, idx) => !indexes.includes(idx));
          this.setData({
            'apiData.members': updatedLocal,
            deleteMode: false,
            selectedDeleteIndexes: []
          });
          wx.showToast({
            title: '成员已移除(本地)',
            icon: 'none'
          });
          return;
        }

        if (!this.data.project_id) {
          wx.showToast({
            title: '缺少项目ID',
            icon: 'none'
          });
          return;
        }

        const deleted_members = selectedMembers
          .filter(m => !!m.maker_id)
          .map(m => ({ maker_id: m.maker_id }));

        if (!deleted_members.length) {
          wx.showToast({
            title: '成员信息缺少 maker_id',
            icon: 'none'
          });
          return;
        }

        wx.showLoading({
          title: '移除中...'
        });

        wx.request({
          url: `${config.project.delete_mem}/${this.data.project_id}`,
          method: 'DELETE',
          header: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          data: {
            deleted_members
          },
          success: (resp) => {
            console.log('[Project Detail] 删除成员响应:', resp);
            if (resp.data && resp.data.code === 200) {
              const updated = members.filter((_, idx) => !indexes.includes(idx));
              this.setData({
                'apiData.members': updated,
                deleteMode: false,
                selectedDeleteIndexes: []
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
  },

  /**
   * 结束项目：不直接调接口，跳转到结项页面
   */
  finishProject() {
    const project_id = this.data.project_id;

    if (!project_id) {
      wx.showToast({
        title: '缺少项目ID',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/project_closure_material_submit/project_closure_material_submit?project_id=${project_id}`
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
    wx.navigateTo({
      url: 'pages/index/index'
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

  // ============== 成员搜索弹窗逻辑（与创建页类似） ==============

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

  clearSearch() {
    this.setData({
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false
    });
  },

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

    const exists = members.some(m => m.phone_num === selectedMember.phone_num);
    if (exists) {
      wx.showToast({
        title: '该成员已在团队中',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!config || !config.project || !config.project.add_mem) {
      console.warn('[Project Detail] config.project.add_mem 未配置，暂时只本地添加');
      const newMemberLocal = {
        real_name: selectedMember.real_name,
        college: selectedMember.college,
        phone_num: selectedMember.phone_num,
        maker_id: selectedMember.maker_id
      };
      const updatedLocal = [...members, newMemberLocal];
      this.setData({
        'apiData.members': updatedLocal
      });
      this.hideModal();
      return;
    }

    wx.showLoading({
      title: '添加中...'
    });

    const reqBody = {
      new_members: [
        {
          maker_id: selectedMember.maker_id
        }
      ]
    };
    console.log('[Project Detail] 添加成员请求体:', reqBody);

    wx.request({
      url: `${config.project.add_mem}/${this.data.project_id}`,   // /project/member/add/{project_id}
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: reqBody,
      success: (res) => {
        console.log('[Project Detail] 添加成员接口返回:', res.data);
        console.log('[Project Detail] 422 detail:', res.data && res.data.detail);

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          // 成功后从后端重新拉一遍，保证和数据库一致
          this.fetchProjectDetail(this.data.project_id);
          wx.showToast({
            title: '成员已添加',
            icon: 'success'
          });
          this.hideModal();
        } else {
          wx.showToast({
            title: (res.data && (res.data.msg || res.data.message)) || '添加失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('[Project Detail] 添加成员请求失败:', err);
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

  showMemberModal() {
    this.setData({
      showModal: true,
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false
    });
  },

  hideModal() {
    this.setData({
      showModal: false,
      searchPhone: '',
      searchResults: [],
      selectedMember: null,
      hasSearched: false
    });
  },

  stopPropagation() {},

  onSearchFocus() {
    console.log('[Project Detail] 搜索框获得焦点');
  },

  onSearchBlur() {}
});
