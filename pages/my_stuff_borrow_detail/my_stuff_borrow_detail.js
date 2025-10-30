var config = (wx.getStorageSync('config'));
const token = wx.getStorageSync('auth_token');
const DEBUG = false;
function parseStuff(data) {
  console.log('[parseStuff] 解析 stuff_list:', data.stuff_list);
  if (data.stuff_list && Array.isArray(data.stuff_list)) {
    // 解析所有物资，而不只是第一个
    data.stuffList = data.stuff_list.map(item => {
      const stuffStr = item.stuff || "";
      const parts = stuffStr.split(" - ");
      if (parts.length === 3) {
        return {
          type: parts[0],
          name: parts[1],
          number: parts[2]
        };
      } else {
        return {
          type: '未知',
          name: '未知',
          number: '未知'
        };
      }
    });
    
    // 保持原有的 stuff 属性用于兼容性（如果其他地方有用到）
    if (data.stuffList.length > 0) {
      data.stuff = data.stuffList[0];
    }
  } else {
    data.stuffList = [];
    data.stuff = {
      type: '未知',
      name: '未知',
      number: '未知'
    };
  }
  
  console.log('[parseStuff] 处理结果 stuffList:', data.stuffList);
  console.log('[parseStuff] 处理结果 data:', data);
  return data;
}


Page({
  data: {
    apiData: {},
    stateTag: ["待审核", "已打回", "借用中", "已归还"],
    stateText: ['#FFFFFF', '#FFFFFF', '#222831', '#FFFFFF'],
    stateColors: {
      0: "#666",
      1: "#E33C64",
      2: "#ffeaa7",
      3: "#00adb5"
    },
    sb_id: ''
  },

  onLoad(options) {
    console.log('[onLoad] 页面参数:', options);
    const sb_id = options.sb_id;
    if (sb_id) {
      console.log(`[onLoad] 获取到 sb_id: ${sb_id}`);
      this.setData({ sb_id });
      this.fetchStuffBorrowDetail(sb_id);
    } else if (DEBUG) {
      const mockId = "SB1749636004000";
      console.warn('[onLoad] 使用 DEBUG 模式下的 mockId:', mockId);
      this.setData({ sb_id: mockId });
      this.fetchStuffBorrowDetail(mockId);
    } else {
      console.error('[onLoad] 未获取到 sb_id');
      wx.showToast({
        title: '获取申请ID失败',
        icon: 'error'
      });
    }
  },

  fetchStuffBorrowDetail(sb_id) {
    console.log(`[fetchStuffBorrowDetail] 请求详情: ${sb_id}`);
    wx.showLoading({ title: '加载中...' });

    if (DEBUG) {
      setTimeout(() => {
        console.log('[DEBUG] 加载 mock 数据');
        const mockData = {
          sb_id: sb_id,
          name: "张三",
          student_id: "2023141460079",
          phone_num: "13800138000",
          email: "student@example.com",
          grade: "大三",
          major: "计算机",
          purpose: "创新项目展示与研讨",
          project_id: "PJ1749636004000",
          mentor_name: "李华",
          mentor_phone_num: "13900139000",
          site: "二基楼B101",
          number: 1,
          start_time: "2024-02-15",
          end_time: "2024-02-25",
          state: 0,
          review: "",
          stuff_list: [
            { stuff: "开发板 - ESP-32-WROOM - 1" }
          ]
        };

        const parsed = this.parseStuff(mockData);
        console.log('[DEBUG] 解析后的数据:', parsed);
        this.setData({ apiData: parsed });
        wx.hideLoading();
      }, 500);
    } else {
      wx.request({
        url: config.stuff_borrow.detail + `/${sb_id}`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'Authorization': token
        },
        success: (res) => {
          console.log('[fetchStuffBorrowDetail] 接口返回:', res);
          if (res.data.code === 200) {
            const data = res.data.data;
            console.log('[fetchStuffBorrowDetail] 原始数据:', data);
            if (data.start_time) data.start_time = data.start_time.replace('T', ' ').replace(/\.\d+Z$/, '');
            if (data.deadline) data.deadline = data.deadline.replace('T', ' ').replace('Z','').replace(/\.\d+Z$/, '');
            const parsedData = parseStuff(data);
            console.log('[fetchStuffBorrowDetail] 解析后数据:', parsedData);
            this.setData({ apiData: parsedData });
          } else {
            console.warn('[fetchStuffBorrowDetail] 获取失败:', res.data.message);
            wx.showToast({
              title: res.data.message || '获取详情失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('[fetchStuffBorrowDetail] 请求失败:', err);
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

  // parseStuff(data) {
  //   console.log('[parseStuff] 解析 stuff_list:', data.stuff_list);
  //   if (data.stuff_list && Array.isArray(data.stuff_list)) {
  //     const firstStuffStr = data.stuff_list[0]?.stuff || "";
  //     const parts = firstStuffStr.split(" - ");
  //     if (parts.length === 3) {
  //       data.stuff = {
  //         type: parts[0],
  //         name: parts[1],
  //         number: parts[2]
  //       };
  //     } else {
  //       data.stuff = {
  //         type: '未知',
  //         name: '未知',
  //         number: '未知'
  //       };
  //     }
  //   }
  //   console.log('[parseStuff] 处理结果:', data.stuff);
  //   console.log('[parseStuff] 处理结果data:', data);
  //   return data;
  // },

  copyLink() {
    wx.setClipboardData({
      data: this.data.apiData.project_id || '',
      success: () => {
        console.log('[copyLink] 项目编号已复制:', this.data.apiData.project_id);
        wx.showToast({
          title: '已复制',
          icon: 'none'
        });
      }
    });
  },

  cancelApplication() {
    console.log('[cancelApplication] 用户点击取消申请');
    wx.showModal({
      title: '确认取消',
      content: '取消后不可再次申请，是否确认取消？',
      success: (res) => {
        if (res.confirm) {
          console.log('[cancelApplication] 用户确认取消');
          wx.showLoading({ title: '取消中...' });

          wx.request({
            url: config.stuff_borrow.cancel + `/${this.data.sb_id}`,
            method: 'POST',
            header: {
              'content-type': 'application/json',
              'Authorization': token
            },
            success: (res) => {
              console.log('[cancelApplication] 接口返回:', res);
              if (res.data.code === 200) {
                wx.showToast({
                  title: '申请已取消',
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
                  title: res.data.message || '取消失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              console.error('[cancelApplication] 网络错误:', err);
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        } else {
          console.log('[cancelApplication] 用户取消操作');
        }
      }
    });
  },

  modifyApplication() {
    console.log('[modifyApplication] 跳转修改页面');
    
    const { type } = this.data.apiData; // 0: 个人, 1: 团队
    const pagePath = type === 0 
      ? 'personal_stuff_borrow_apply' 
      : 'team_stuff_borrow_apply';
  
    wx.navigateTo({
      url: `/pages/${pagePath}/${pagePath}?edit=true&sb_id=${this.data.sb_id}`
    });
  },

  handlerGobackClick() {
    console.log('[handlerGobackClick] 返回上一页');
    wx.navigateBack({ delta: 1 });
  },

  handlerGohomeClick() {
    console.log('[handlerGohomeClick] 返回首页');
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onPullDownRefresh() {
    console.log('[onPullDownRefresh] 用户下拉刷新');
    if (this.data.sb_id) {
      this.fetchStuffBorrowDetail(this.data.sb_id);
    }
    wx.stopPullDownRefresh();
  }
});
