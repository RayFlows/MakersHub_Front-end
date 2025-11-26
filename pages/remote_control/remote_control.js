const app = getApp();

Page({
  data: {
    rooms: [
      { name: '二基楼B101', online: true },
      { name: 'i创街工坊', online: false }
    ],
    icons: {}
  },

  onLoad() {
    console.log("[Remote Control] 获取页面图标资源");
    this.loadIcons();
  },

  loadIcons() {
    const resources = app.globalData.publicResources;

    if(resources) {
      this.setData({
      icons: {
        pushDoor: resources.pushDoor,
        whiteCat: resources.whiteCat
      }
      })
    }
  },

  toggleStatus(e) {
    const index = e.currentTarget.dataset.index;
    const updated = this.data.rooms;
    updated[index].online = !updated[index].online;
    this.setData({ rooms: updated });
  }
});
