// pages/seller-orders/seller-orders.js
const app = getApp()
const { STATUS_TEXT, normalizeStatus } = require('../../utils/status-map.js')

Page({
  data: {
    orders: [],
    loading: true,
    tempData: {}  // 临时存储每个订单的物流输入
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      this.setData({ loading: false })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: app.globalData.baseUrl + 'store/orders/seller/',
      header: { 'Authorization': 'Token ' + token },
      success: res => {
        this.setData({ loading: false })
        if (res.statusCode === 200) {
          const orders = (res.data || []).map(o => ({
            ...o,
            _status: normalizeStatus(o.status),
            _statusText: STATUS_TEXT[normalizeStatus(o.status)] || o.status
          }))
          this.setData({ orders })
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

  // 输入物流信息（临时存本地）
  inputChange(e) {
    const id = e.currentTarget.dataset.id
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    this.setData({
      [`tempData.${id}.${field}`]: value
    })
  },

  // 确认发货
  shipOrder(e) {
    const id = e.currentTarget.dataset.id
    const temp = this.data.tempData[id] || {}
    const shipping_company = temp.shipping_company
    const tracking_number = temp.tracking_number

    if (!shipping_company || !tracking_number) {
      return wx.showToast({ title: '请填写物流公司和单号', icon: 'none' })
    }

    wx.showLoading({ title: '发货中...' })

    wx.request({
      url: app.globalData.baseUrl + `store/orders/${id}/`,
      method: 'PATCH',
      data: {
        action: 'ship',
        shipping_company,
        tracking_number
      },
      header: {
        'Authorization': 'Token ' + wx.getStorageSync('token'),
        'Content-Type': 'application/json'
      },
      success: res => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          wx.showToast({ title: '已确认发货', icon: 'success' })
          this.loadOrders()  // 刷新列表
          // 清空临时输入
          this.setData({ [`tempData.${id}`]: {} })
        } else {
          wx.showToast({ title: res.data.detail || '操作失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 确认完成
  completeOrder(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认完成',
      content: '确定买家已收到货并完成交易？',
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
                wx.showToast({ title: '订单已完成', icon: 'success' })
                this.loadOrders()
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

  // 取消订单
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' })

          wx.request({
            url: app.globalData.baseUrl + `store/orders/${id}/`,
            method: 'PATCH',
            data: { action: 'cancel' },
            header: {
              'Authorization': 'Token ' + wx.getStorageSync('token'),
              'Content-Type': 'application/json'
            },
            success: res => {
              wx.hideLoading()
              if (res.statusCode === 200) {
                wx.showToast({ title: '订单已取消', icon: 'success' })
                this.loadOrders()
              } else {
                wx.showToast({ title: res.data.detail || '取消失败', icon: 'none' })
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
  }
})