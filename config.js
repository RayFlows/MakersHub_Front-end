var host = "https://dev-api.makershub.cn"
var minIO = "https://dev-s3.makershub.cn"
var config = {
  host,
  minIO,
  public_resources: minIO + "/makershub-public",
  users: {
    login: host + "/users/wx-login",
    profile: host + "/users/profile",
    profile_photo: host + "/users/profile-photo",
    get_makers: host + "/users/get-makers",
    find_by_phonenum: host + "/users/find-by-phonenum",
  },
  events: {
    view: host + "/events/view",
    poster: host + "/events/poster",
    precreate_event: host + "/events/precreate-event",
    post: host + "/events/post",
    details: host + "/events/details"
  },
  sites_borrow: {
    view: host + "/sites-borrow/view",
    view_all: host + "/sites-borrow/view-all",
    post: host + "/sites-borrow/post",
    update: host + "/sites-borrow/update",
    cancel: host + "/sites-borrow/cancel",
    detail: host + "/sites-borrow/detail",
    review: host + "/sites-borrow/review",
    return: host + "/sites-borrow/return"
  },
  stuff_borrow: {
    view: host + "/stuff-borrow/view",
    view_all: host + "/stuff-borrow/view-all",
    update: host + "/stuff-borrow/update",
    apply: host + "/stuff-borrow/apply",
    detail: host + "/stuff-borrow/detail",
    cancel: host + "/stuff-borrow/cancel",
    return: host + "/stuff-borrow/return",
    review: host + "/stuff-borrow/review",
    auto_update_quantity: host + "/stuff-this.sites_borrow/auto-update-quantity"
  },
  stuff: {
    get_all: host + "/stuff/get-all"
  },
  site: {
    get_all: host + "/site/get-all"
  },
  tasks: {
    view_my: host + "/tasks/view-my",
    view_all: host + "/tasks/view-all",
    detail: host + "/tasks/detail",
    post: host + "/tasks/post",
    update: host + "/tasks/update",
    cancel: host + "/tasks/cancel",
    finish: host + "/tasks/finish"
  },
  publicity_link: {
    view_my: host + "/publicity-link/view-my",
    view_all: host + "/publicity-link/view-all",
    post: host + "/publicity-link/post",
    update: host + "/publicity-link/update",
    review: host + "/publicity-link/review"
  },
  arrange: {
    get_arrangement: host + "/arrange/get-arrangement",
    get_current: host + "/arrange/get-current",
    batch: host + "/arrange/arrangements/batch"
  },
  project: {
    create: host + "/project/create",
    detail: host + "/project/detail",
    update: host + "/project/update",               
    member: host + "/project",    
    submit_closure: host + "/project",    
    toggle_recruit: host + "/project/action/toggle-recruit",
    material_upload: host + "/project/material/upload",
    material_delete: host + "/project/material",
    submit_closure: host + "/project/action/submit-closure",    
    delete_mem: host + "/project/member",     
    view_my: host + "/project/list/view-my",
    add_mem: host + "/project/member/add"
  }
}
module.exports = config;