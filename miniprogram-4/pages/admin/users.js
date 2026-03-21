// pages/admin/users.js - 用户管理
const { getUsers } = require('../../api/admin.js')

Page({
  data: {
    users: [],
    loading: false,
    keyword: '',
    isMock: false
  },

  onShow() {
    this.loadUsers()
  },

  inputKeyword(e) {
    this.setData({ keyword: e.detail.value })
  },

  search() {
    this.loadUsers()
  },

  clearSearch() {
    this.setData({ keyword: '' })
    this.loadUsers()
  },

  loadUsers() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.setData({ loading: true })
    getUsers(this.data.keyword).then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        let users = Array.isArray(res.data) ? res.data : (res.data.results || [])
        // 关键词本地过滤（后端不支持搜索时）
        if (this.data.keyword && users.length > 0) {
          const kw = this.data.keyword.toLowerCase()
          users = users.filter(u =>
            (u.username || '').toLowerCase().includes(kw) ||
            (u.email || '').toLowerCase().includes(kw) ||
            (u.phone || '').includes(kw)
          )
        }
        this.setData({ users, isMock: !!res._isMock })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
    })
  }
})
