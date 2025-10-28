const config = require("../../config");

var config = (wx.getStorageSync('config'));
const TOKEN_KEY = 'auth_token';

Page({
  data: {
    isEditing: false,
    tableData: []
  },

  onLoad() {
    const token = wx.getStorageSync(TOKEN_KEY);

    wx.request({
      url: config.arrange.get_arrangement,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        const allData = res.data?.data || {};
        const scriptList = allData[1] || [];
        const pushList = allData[2] || [];
        const newsList = allData[3] || [];

        const maxLen = Math.max(scriptList.length, pushList.length, newsList.length);
        const tableData = [];

        for (let i = 0; i < maxLen; i++) {
          tableData.push({
            script: {
              name: scriptList[i]?.name || '',
              current: scriptList[i]?.current || false
            },
            push: {
              name: pushList[i]?.name || '',
              current: pushList[i]?.current || false
            },
            news: {
              name: newsList[i]?.name || '',
              current: newsList[i]?.current || false
            }
          });
        }

        this.setData({ tableData });
      },
      fail: err => {
        console.error('[onLoad] 获取数据失败:', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  onCellInput(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`tableData[${index}].${field}.name`]: value
    });
  },

  toggleEdit() {
    this.setData({ isEditing: !this.data.isEditing });
  },

  submitEdit() {
    const token = wx.getStorageSync(TOKEN_KEY);
    const { tableData } = this.data;

    const requestData = {
      "1": [],
      "2": [],
      "3": []
    };

    tableData.forEach((row, index) => {
      requestData["1"].push({
        name: row.script.name,
        order: index + 1,
        current: row.script.current,
        maker_id: "MK_script_" + index
      });
      requestData["2"].push({
        name: row.push.name,
        order: index + 1,
        current: row.push.current,
        maker_id: "MK_push_" + index
      });
      requestData["3"].push({
        name: row.news.name,
        order: index + 1,
        current: row.news.current,
        maker_id: "MK_news_" + index
      });
    });

    wx.showModal({
      title: '确认提交',
      content: '是否提交编辑内容？',
      success: e => {
        if (e.confirm) {
          wx.request({
            url: config.arrange.batch,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: requestData,
            success: res => {
              wx.showToast({ title: res.data.message || '提交成功', icon: 'success' });
              this.setData({ isEditing: false });
            },
            fail: err => {
              wx.showToast({ title: '上传失败', icon: 'none' });
              console.error('[submitEdit] 上传失败:', err);
            }
          });
        }
      }
    });
  },

  cancelEdit() {
    wx.showModal({
      title: '取消确认',
      content: '是否放弃已修改内容？',
      success: e => {
        if (e.confirm) {
          this.setData({ isEditing: false });
          this.onLoad(); // 重载数据
        }
      }
    });
  },

  handlerGobackClick() {
    const pages = getCurrentPages();
    if (pages.length >= 2) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/publicity_work_page/publicity_work_page' });
    }
  },
});
