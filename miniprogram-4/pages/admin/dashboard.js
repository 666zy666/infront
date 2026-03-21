// pages/admin/dashboard.js - 管理员后台仪表盘
const app = getApp()
const { getAdminStats } = require('../../api/admin.js')
const { normalizeStatus, STATUS_TEXT, STATUS_COLOR } = require('../../utils/status-map.js')

Page({
  data: {
    stats: {
      userCount: '--',
      productCount: '--',
      orderCount: '--',
      totalSales: '--',
      isMock: false
    },
    recentOrders: [],
    loading: true
  },

  onLoad() {
    if (!this.checkAdmin()) return
    this.loadData()
  },

  onShow() {
    if (!this._isAdmin) return
    this.loadData()
  },

  onPullDownRefresh() {
    if (!this._isAdmin) {
      wx.stopPullDownRefresh()
      return
    }
    this.loadData().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  checkAdmin() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      this._isAdmin = false
      return false
    }
    const userInfo = wx.getStorageSync('userInfo') || {}
    if (!userInfo.is_staff) {
      wx.showToast({ title: '需要管理员权限', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      this._isAdmin = false
      return false
    }
    this._isAdmin = true
    return true
  },

  loadData() {
    this.setData({ loading: true })
    const statsPromise = getAdminStats().then(stats => {
      this.setData({ stats, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })

    // 加载最近订单（卖家视图）
    const token = wx.getStorageSync('token')
    const ordersPromise = token ? new Promise(resolve => {
      wx.request({
        url: app.globalData.baseUrl + 'store/orders/seller/',
        header: { Authorization: 'Token ' + token },
        success: res => {
          if (res.statusCode === 200) {
            const orders = (res.data || []).slice(0, 5).map(o => ({
              ...o,
              _status: normalizeStatus(o.status),
              _statusText: STATUS_TEXT[normalizeStatus(o.status)] || o.status,
              _statusColor: STATUS_COLOR[normalizeStatus(o.status)] || '#999'
            }))
            this.setData({ recentOrders: orders })
          }
          resolve()
        },
        fail: resolve
      })
    }) : Promise.resolve()

    return Promise.all([statsPromise, ordersPromise])
  },

  toUsers() { wx.navigateTo({ url: '/pages/admin/users' }) },
  toProducts() { wx.navigateTo({ url: '/pages/admin/products' }) },
  toOrders() { wx.navigateTo({ url: '/pages/admin/orders' }) },
  toOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` })
  }
})
