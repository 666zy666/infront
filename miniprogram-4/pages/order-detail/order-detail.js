// pages/order-detail/order-detail.js
const { getOrderDetail, payOrder, cancelOrder, confirmReceipt } = require('../../api/order.js')
const { STATUS_TEXT, STATUS_COLOR, normalizeStatus } = require('../../utils/status-map.js')

Page({
  data: {
    id: null,
    order: null,
    loading: true,
    operating: false
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this.loadDetail()
  },

  onShow() {
    if (this.data.id) this.loadDetail()
  },

  loadDetail() {
    this.setData({ loading: true })
    getOrderDetail(this.data.id).then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        const o = res.data
        const _status = normalizeStatus(o.status)
        this.setData({
          order: {
            ...o,
            _status,
            _statusText: STATUS_TEXT[_status] || o.status,
            _statusColor: STATUS_COLOR[_status] || '#999'
          }
        })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(() => this.setData({ loading: false }))
  },

  handlePay() {
    wx.showModal({
      title: '确认支付',
      content: '确定支付该订单？',
      success: res => {
        if (!res.confirm) return
        this.setData({ operating: true })
        wx.showLoading({ title: '支付中...' })
        payOrder(this.data.id).then(res => {
          wx.hideLoading()
          this.setData({ operating: false })
          if (res.statusCode === 200) {
            wx.showToast({ title: '支付成功', icon: 'success' })
            this.loadDetail()
          } else {
            wx.showToast({ title: res.data?.detail || '支付失败', icon: 'none' })
          }
        }).catch(() => { wx.hideLoading(); this.setData({ operating: false }) })
      }
    })
  },

  handleCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定取消该订单？',
      success: res => {
        if (!res.confirm) return
        this.setData({ operating: true })
        wx.showLoading({ title: '处理中...' })
        cancelOrder(this.data.id).then(res => {
          wx.hideLoading()
          this.setData({ operating: false })
          if (res.statusCode === 200) {
            wx.showToast({ title: '订单已取消', icon: 'success' })
            this.loadDetail()
          } else {
            wx.showToast({ title: res.data?.detail || '取消失败', icon: 'none' })
          }
        }).catch(() => { wx.hideLoading(); this.setData({ operating: false }) })
      }
    })
  },

  handleConfirm() {
    wx.showModal({
      title: '确认收货',
      content: '确认已收到货物？',
      success: res => {
        if (!res.confirm) return
        this.setData({ operating: true })
        wx.showLoading({ title: '处理中...' })
        confirmReceipt(this.data.id).then(res => {
          wx.hideLoading()
          this.setData({ operating: false })
          if (res.statusCode === 200) {
            wx.showToast({ title: '确认收货成功', icon: 'success' })
            this.loadDetail()
          } else {
            wx.showToast({ title: res.data?.detail || '操作失败', icon: 'none' })
          }
        }).catch(() => { wx.hideLoading(); this.setData({ operating: false }) })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
