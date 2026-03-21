// pages/admin/orders.js - 订单管理
const { getAllOrders, updateOrderStatus } = require('../../api/admin.js')
const { STATUS_TEXT, STATUS_COLOR, STATUS_TABS, normalizeStatus } = require('../../utils/status-map.js')

Page({
  data: {
    tabs: STATUS_TABS,
    currentTab: 0,
    currentStatus: '',
    orders: [],
    loading: false,
    keyword: '',
    STATUS_TEXT,
    STATUS_COLOR
  },

  onShow() {
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  inputKeyword(e) {
    this.setData({ keyword: e.detail.value })
  },

  search() {
    this.loadOrders()
  },

  clearSearch() {
    this.setData({ keyword: '' })
    this.loadOrders()
  },

  switchTab(e) {
    const idx = e.currentTarget.dataset.index
    const status = STATUS_TABS[idx].key
    this.setData({ currentTab: idx, currentStatus: status })
    this.loadOrders()
  },

  loadOrders() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.setData({ loading: true })
    return getAllOrders(this.data.currentStatus, this.data.keyword).then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        let orders = Array.isArray(res.data) ? res.data : (res.data.results || [])
        // 关键词本地过滤
        if (this.data.keyword) {
          const kw = this.data.keyword.toLowerCase()
          orders = orders.filter(o =>
            String(o.id).includes(kw) ||
            (o.buyer || o.buyer_username || '').toLowerCase().includes(kw) ||
            (o.product_title || o.product_name || '').toLowerCase().includes(kw)
          )
        }
        orders = orders.map(o => ({
          ...o,
          _status: normalizeStatus(o.status),
          _statusText: STATUS_TEXT[normalizeStatus(o.status)] || o.status,
          _statusColor: STATUS_COLOR[normalizeStatus(o.status)] || '#999'
        }))
        this.setData({ orders })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` })
  },

  handleAction(e) {
    const id = e.currentTarget.dataset.id
    const action = e.currentTarget.dataset.action
    const actionNames = { cancel: '取消订单', complete: '完成订单' }
    const actionName = actionNames[action] || action

    wx.showModal({
      title: actionName,
      content: `确定执行"${actionName}"操作？`,
      confirmColor: action === 'cancel' ? '#ff5000' : '#07c160',
      success: res => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中...' })
        updateOrderStatus(id, action).then(res => {
          wx.hideLoading()
          if (res.statusCode === 200) {
            wx.showToast({ title: '操作成功', icon: 'success' })
            this.loadOrders()
          } else {
            wx.showToast({ title: res.data?.detail || '操作失败', icon: 'none' })
          }
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    })
  }
})
