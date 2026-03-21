// pages/admin/users.js - 用户管理
const { getUsers } = require('../../api/admin.js')

Page({
  data: {
    users: [],
    loading: false,
    keyword: '',
    isMock: false,
    nextUrl: null,
    hasMore: false,
    loadingMore: false
  },

  onShow() {
    this.loadUsers()
  },

  onPullDownRefresh() {
    this.loadUsers().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore()
    }
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
      return Promise.resolve()
    }

    this.setData({ loading: true, nextUrl: null, hasMore: false })
    return getUsers(this.data.keyword).then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        const body = res.data
        let users = Array.isArray(body) ? body : (body.results || [])
        const nextUrl = (!Array.isArray(body) && body.next) ? body.next : null
        // 关键词本地过滤（后端不支持搜索时）
        if (res._isMock && this.data.keyword && users.length > 0) {
          const kw = this.data.keyword.toLowerCase()
          users = users.filter(u =>
            (u.username || '').toLowerCase().includes(kw) ||
            (u.email || '').toLowerCase().includes(kw) ||
            (u.phone || '').includes(kw)
          )
        }
        this.setData({ users, isMock: !!res._isMock, nextUrl, hasMore: !!nextUrl })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  loadMore() {
    if (!this.data.nextUrl || this.data.loadingMore) return
    this.setData({ loadingMore: true })
    const token = wx.getStorageSync('token')
    wx.request({
      url: this.data.nextUrl,
      header: { Authorization: token ? 'Token ' + token : '' },
      success: res => {
        if (res.statusCode === 200) {
          const body = res.data
          const raw = Array.isArray(body) ? body : (body.results || [])
          const nextUrl = (!Array.isArray(body) && body.next) ? body.next : null
          this.setData({
            users: this.data.users.concat(raw),
            nextUrl,
            hasMore: !!nextUrl,
            loadingMore: false
          })
        } else {
          this.setData({ loadingMore: false })
        }
      },
      fail: () => this.setData({ loadingMore: false })
    })
  }
})
