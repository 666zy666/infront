// pages/my-orders/my-orders.js
const app = getApp()

Page({
  data: {
    orders: [],
    loading: true
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()  // 每次进入页面刷新
  },

  loadOrders() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      this.setData({ loading: false })
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: app.globalData.baseUrl + 'store/orders/my/',
      header: { 'Authorization': 'Token ' + token },
      success: res => {
        this.setData({ loading: false })
        if (res.statusCode === 200) {
          this.setData({ orders: res.data })
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 查看订单详情（可扩展为新页面）
  toOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    })
  },

  // 查看物流（示例，可对接物流查询接口）
  viewTracking(e) {
    const id = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o.id === id)
    if (order.tracking_number) {
      wx.showModal({
        title: '物流信息',
        content: `物流公司：${order.shipping_company || '未知'}\n单号：${order.tracking_number}`,
        showCancel: false
      })
    } else {
      wx.showToast({ title: '暂无物流信息', icon: 'none' })
    }
  },

  // 确认收货
  confirmReceive(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认收货',
      content: '确认已收到货物并完成交易？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          wx.request({
            url: app.globalData.baseUrl + `store/orders/${id}/`,
            method: 'PATCH',
            data: { action: 'complete' },
            header: {
              'Authorization': 'Token ' + wx.getStorageSync('token'),
              'Content-Type': 'application/json'
            },
            success: res => {
              wx.hideLoading()
              if (res.statusCode === 200) {
                wx.showToast({ title: '已确认收货', icon: 'success' })
                this.loadOrders()  // 刷新列表
              } else {
                wx.showToast({ title: res.data.detail || '操作失败', icon: 'none' })
              }
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})