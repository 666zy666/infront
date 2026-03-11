// pages/detail/detail.js
const app = getApp()

Page({
  data: {
    id: null,
    product: {},
    images: [],
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this.loadDetail()
  },

  loadDetail() {
    wx.showLoading({ title: '加载中...' })

    wx.request({
      url: app.globalData.baseUrl + `store/products/${this.data.id}/`,
      header: {
        'Authorization': 'Token ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          const product = res.data
          this.setData({
            product: product,
            images: product.images || [],
            loading: false
          })
        } else {
          wx.showToast({ title: '商品不存在或加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 拨打电话
  callSeller() {
    const phone = this.data.product.contact_value
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone })
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' })
    }
  },

  // 复制微信号
  copyContact() {
    const wechat = this.data.product.contact_value
    if (wechat) {
      wx.setClipboardData({
        data: wechat,
        success: () => {
          wx.showToast({ title: '已复制微信号' })
        }
      })
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' })
    }
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.url
    const urls = this.data.images.map(item => item.image)
    wx.previewImage({
      current: current,
      urls: urls
    })
  },
// pages/detail/detail.js - 添加完整购买 + 模拟支付
buyNow() {
  if (!wx.getStorageSync('token')) {
    wx.showToast({ title: '请先登录', icon: 'none' })
    wx.navigateTo({ url: '/pages/login/login' })
    return
  }

  wx.showModal({
    title: '确认购买',
    content: `确定以 ¥${this.data.product.price} 购买 ${this.data.product.title} ？`,
    success: (res) => {
      if (res.confirm) {
        wx.showLoading({ title: '创建订单...' })

        wx.request({
          url: app.globalData.baseUrl + 'store/orders/',
          method: 'POST',
          data: { product_id: this.data.id },
          header: {
            'Authorization': 'Token ' + wx.getStorageSync('token'),
            'Content-Type': 'application/json'
          },
          success: (res) => {
            wx.hideLoading()
            if (res.statusCode === 201) {
              const orderId = res.data.id
              this.simulatePayment(orderId)
            } else {
              wx.showToast({ title: res.data.detail || '创建订单失败', icon: 'none' })
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

simulatePayment(orderId) {
  wx.showLoading({ title: '支付中...' })

  wx.request({
    url: app.globalData.baseUrl + 'store/orders/simulate-pay/',
    method: 'POST',
    data: { order_id: orderId },
    header: {
      'Authorization': 'Token ' + wx.getStorageSync('token'),
      'Content-Type': 'application/json'
    },
    success: (res) => {
      wx.hideLoading()
      if (res.statusCode === 200 && res.data.code === 0) {
        wx.showModal({
          title: '支付成功（模拟）',
          content: '订单已支付成功！\n交易号：' + res.data.data.transaction_id,
          showCancel: false,
          success: () => {
            // 支付成功后可跳转订单列表或刷新当前页
            wx.navigateTo({ url: '/pages/my-orders/my-orders' })
          }
        })
      } else {
        wx.showToast({ title: res.data.msg || '支付失败', icon: 'none' })
      }
    },
    fail: () => {
      wx.hideLoading()
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  })
}
})