// pages/my-orders/my-orders.js
const { getOrders, payOrder, cancelOrder, confirmReceipt } = require('../../api/order.js')
const { STATUS_TEXT, STATUS_COLOR, STATUS_TABS, normalizeStatus } = require('../../utils/status-map.js')

Page({
  data: {
    tabs: STATUS_TABS,
    currentTab: 0,
    currentStatus: '',
    orders: [],
    loading: false,
    STATUS_TEXT,
    STATUS_COLOR
  },

  onLoad(options) {
    // 支持从外部跳转时指定初始 tab
    if (options.status) {
      const idx = STATUS_TABS.findIndex(t => t.key === options.status)
      if (idx >= 0) {
        this.setData({ currentTab: idx, currentStatus: options.status })
      }
    }
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  // Tab 切换
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
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true })

    getOrders(this.data.currentStatus).then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        // 规范化状态字段，兼容后端旧字段
        const orders = (res.data || []).map(o => ({
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

  // 查看订单详情
  toOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` })
  },

  // 支付订单
  handlePay(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认支付',
      content: '确定支付该订单？',
      success: res => {
        if (!res.confirm) return
        wx.showLoading({ title: '支付中...' })
        payOrder(id).then(res => {
          wx.hideLoading()
          if (res.statusCode === 200) {
            wx.showToast({ title: '支付成功', icon: 'success' })
            this.loadOrders()
          } else {
            wx.showToast({ title: res.data?.detail || '支付失败', icon: 'none' })
          }
        }).catch(() => wx.hideLoading())
      }
    })
  },

  // 取消订单
  handleCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定取消该订单？取消后无法恢复。',
      success: res => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中...' })
        cancelOrder(id).then(res => {
          wx.hideLoading()
          if (res.statusCode === 200) {
            wx.showToast({ title: '订单已取消', icon: 'success' })
            this.loadOrders()
          } else {
            wx.showToast({ title: res.data?.detail || '取消失败', icon: 'none' })
          }
        }).catch(() => wx.hideLoading())
      }
    })
  },

  // 确认收货
  handleConfirm(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认收货',
      content: '确认已收到货物？',
      success: res => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中...' })
        confirmReceipt(id).then(res => {
          wx.hideLoading()
          if (res.statusCode === 200) {
            wx.showToast({ title: '确认收货成功', icon: 'success' })
            this.loadOrders()
          } else {
            wx.showToast({ title: res.data?.detail || '操作失败', icon: 'none' })
          }
        }).catch(() => wx.hideLoading())
      }
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
