// pages/my/my.js
const app = getApp()

Page({
  data: {
    hasLogin: false,
    userInfo: {
      nickName: '未登录',
      avatarUrl: '/images/default-avatar.png'
    },
    stats: {
      published: 0,
      favorites: 0,
      orders: 0,        // 我的订单（买家视角）
      sellerOrders: 0   // 待处理订单（卖家视角）
    }
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token') || app.globalData.token
    const userInfo = wx.getStorageSync('userInfo') || {}

    if (token) {
      this.setData({
        hasLogin: true,
        userInfo: {
          nickName: userInfo.nickName || '用户',
          avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png'
        }
      })
      this.loadStats()
    } else {
      this.setData({
        hasLogin: false,
        userInfo: {
          nickName: '未登录',
          avatarUrl: '/images/default-avatar.png'
        },
        stats: { published: 0, favorites: 0, orders: 0, sellerOrders: 0 }
      })
    }
  },

  // 加载所有统计数据
  loadStats() {
    const token = wx.getStorageSync('token')
    if (!token) return

    // 我的发布数量
    wx.request({
      url: app.globalData.baseUrl + 'store/my-products/',
      header: { 'Authorization': 'Token ' + token },
      success: res => {
        if (res.statusCode === 200) {
          this.setData({ 'stats.published': res.data.length || 0 })
        }
      }
    })

    // 我的收藏数量
    wx.request({
      url: app.globalData.baseUrl + 'store/favorites/',
      header: { 'Authorization': 'Token ' + token },
      success: res => {
        if (res.statusCode === 200) {
          this.setData({ 'stats.favorites': res.data.length || 0 })
        }
      }
    })

    // 我的订单数量（买家视角）
    wx.request({
      url: app.globalData.baseUrl + 'store/orders/my/',
      header: { 'Authorization': 'Token ' + token },
      success: res => {
        if (res.statusCode === 200) {
          this.setData({ 'stats.orders': res.data.length || 0 })
        }
      }
    })

    // 待处理订单数量（卖家视角）
    wx.request({
      url: app.globalData.baseUrl + 'store/orders/seller/',
      header: { 'Authorization': 'Token ' + token },
      success: res => {
        if (res.statusCode === 200) {
          this.setData({ 'stats.sellerOrders': res.data.length || 0 })
        }
      }
    })
  },

  // 跳转登录
  toLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          app.globalData.token = ''
          app.globalData.userInfo = null
          this.checkLoginStatus()
        }
      }
    })
  },

  // 跳转页面
  toMyPublish() {
    wx.navigateTo({ url: '/pages/my-publish/my-publish' })
  },

  toMyFavorites() {
    wx.navigateTo({ url: '/pages/my-favorites/my-favorites' })
  },

  toMyOrders() {
    wx.navigateTo({ url: '/pages/my-orders/my-orders' })
  },

  toSellerOrders() {
    wx.navigateTo({ url: '/pages/seller-orders/seller-orders' })
  },

  toSettings() {
    wx.showToast({ title: '设置功能开发中', icon: 'none' })
  }
})