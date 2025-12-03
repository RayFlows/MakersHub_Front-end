// pages/my_project_list/my_project_list.js
const config = wx.getStorageSync('config');
const token = wx.getStorageSync('auth_token');
const utils = require("../../utils/util");
const app = getApp();

Page({
  data: {
    // 0: 待审核  1: 进行中  2: 已打回  3: 已结束
    tab: 0,
    stateTag: {
      0: "待审核",
      1: "进行中",
      2: "已打回",
      3: "已结束"
    },
    // 标签文字颜色
    stateText: {
      0: "#FFFFFF",
      1: "#FFFFFF",
      2: "#FFFFFF",
      3: "#FFFFFF"
    },
    // 标签底色（可按 UI 再调）
    stateColors: {
      0: "#666666",   // 待审核：深灰
      1: "#00adb5",   // 进行中：蓝绿色
      2: "#E33C64",   // 已打回：红色
      3: "#00ADB5"    // 已结束：和进行中同色，按需改
    },

    // 原始列表（全部项目）
    list: [],
    // 各状态拆分列表
    pendingList: [],   // 待审核
    ongoingList: [],   // 进行中
    rejectedList: [],  // 已打回
    finishedList: [],  // ✅ 已结束

    // 测试用 mock 数据（保留但不用也行）
    mockData: {
      code: 200,
      msg: "success",
      data: {
        project_id: "PJ20250615100000123",
        project_name: "基于视觉识别的自动喂猫机",
        project_type: 0,
        description: "本项目旨在利用树莓派和OpenCV开发一款...",
        start_time: "2025-09-01 00:00:00",
        end_time: "2025-12-30 00:00:00",
        leader_name: "旅行者",
        leader_phone: "13677778888",
        leader_qq: "897789202",
        college: "计算机学院",
        mentor_name: "张教授",
        mentor_phone: "13800138000",
        state: 0,
        is_recruiting: false,
        review: null,
        created_at: "2025-06-15 10:00:00",
        updated_at: "2025-06-15 10:00:00",
        members: [
          {
            real_name: "李四",
            phone_num: "13800138001",
            college: "计算机学院"
          },
          {
            real_name: "王五",
            phone_num: "13900139002",
            college: "软件学院"
          }
        ]
      }
    },

    icons: {}
  },

  onLoad() {
    console.log("[My Project List] 获取页面图标资源");
    this.loadIcons();
    this.loadData();
  },

  onShow() {
    // 页面回到前台时刷新一次
    this.loadData();
  },

  onReady() {
    // 如果从详情页返回希望强制刷新，可以用 eventChannel 通知
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.on('refreshProjectList', (data) => {
        console.log('收到项目列表刷新事件：', data);
        this.loadData();
      });
    }
  },

  // 载入底部装饰图标
  loadIcons() {
    const resources = app.globalData.publicResources;
    if (resources) {
      this.setData({
        icons: {
          // 如果有专门的项目图标可以换成 projectIcon，没有就继续复用 whiteCat
          projectDecoration: resources.projectIcon || resources.whiteCat,
          whiteCat: resources.whiteCat
        }
      });
    }
  },

  /**
   * 按状态拆分项目列表
   * @param {Array} dataList 后端返回的项目数组
   */
  filterData(dataList) {
    const formattedDataList = dataList.map(item => {
      // created_at / created_time / start_time 三选一兜底
      const rawTime = item.created_at || item.created_time || item.start_time;
      return {
        ...item,
        formatted_time: rawTime
          ? utils.formatDateTime(new Date(rawTime))
          : ""   // 没有时间就给个空字符串
      };
    });

    const pendingList  = formattedDataList.filter(item => item.state === 0); // 待审核
    const ongoingList  = formattedDataList.filter(item => item.state === 1); // 进行中
    const rejectedList = formattedDataList.filter(item => item.state === 2); // 已打回
    const finishedList = formattedDataList.filter(item => item.state === 3); // ✅ 已结束

    this.setData({
      list: formattedDataList,
      pendingList,
      ongoingList,
      rejectedList,
      finishedList
    });

    console.log("[My Project List] all projects: ", this.data.list);
    console.log("[My Project List] pendingList: ", this.data.pendingList);
    console.log("[My Project List] ongoingList: ", this.data.ongoingList);
    console.log("[My Project List] rejectedList: ", this.data.rejectedList);
    console.log("[My Project List] finishedList: ", this.data.finishedList);
  },

  /**
   * 从后端拉取“我的项目”
   */
  loadData() {
    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: config.project.view_my,   // 你的“查看我的项目”接口
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        console.log("[My Project List] apiData", JSON.stringify(res.data, null, 2));

        const raw = res.data;
        let list = null;

        if (raw && raw.code === 200 && raw.data) {
          // ① data 是数组：[{...}, {...}]
          if (Array.isArray(raw.data)) {
            list = raw.data;
          }
          // ② data.list 是数组：{ total: 2, list: [{...}, {...}] }
          else if (Array.isArray(raw.data.list)) {
            list = raw.data.list;
          }
          // ③ data 是单个对象：{ project_id: "...", ... }
          else {
            list = [raw.data];
          }
        }

        if (list && list.length > 0) {
          this.filterData(list);
        } else {
          wx.showToast({
            title: raw.msg || raw.message || '项目数据为空',
            icon: 'none'
          });
          console.warn('[My Project List] 项目列表为空或格式不匹配：', res);
          this.setData({
            list: [],
            pendingList: [],
            ongoingList: [],
            rejectedList: [],
            finishedList: []  // ✅ 清空已结束列表
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'error' });
        console.error('[My Project List] wx.request 调用失败：', err);

        // 本地调试时可以临时用 mock 数据
        // this.filterData([this.data.mockData.data]);
      }
    });
  },

  // 顶部 tab 点击切换
  changeItem(e) {
    const index = parseInt(e.currentTarget.dataset.item, 10);
    this.setData({ tab: index });
  },

  // swiper 滑动切换
  onSwiperChange(e) {
    const item = e.detail.current;
    this.setData({ tab: item });
  },

  // 返回按钮
  handlerGobackClick() {
    const pages = getCurrentPages();
    if (pages.length >= 2) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  // 首页按钮
  handlerGohomeClick() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  // 跳转到项目详情页
  navigateToDetail(e) {
    const projectId = e.currentTarget.dataset.projectId;
    const state = e.currentTarget.dataset.state;
    console.log("[My Project List] projectId:", projectId);

    wx.navigateTo({
      url: `/pages/project_detail/project_detail?project_id=${projectId}&state=${state}`
    });
  }
});
