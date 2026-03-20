// pages/my/my.js
const { request } = require('../../utils/request.js')   // ← 必须加上这行！
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
      orders: 0,
      sellerOrders: 0
    }
  },

  onShow() {
    this.checkLoginStatus()
    this.loadStats()
  },

  // ==================== 登录状态检查 + 头像刷新 ====================
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    let userInfo = wx.getStorageSync('userInfo') || {}

    this.setData({
      hasLogin: !!token,
      userInfo: {
        nickName: userInfo.nickName || userInfo.username || '用户',
        avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png'
      }
    })

    // 如果已登录但头像为空 → 从后端刷新最新头像
    if (token && !userInfo.avatarUrl) {
      this.refreshUserInfo(token)
    }
  },

  // 从后端获取最新用户信息（包含刚上传的头像）
  refreshUserInfo(token) {
    request('account/profile/', {
      header: { 'Authorization': `Token ${token}` }
    }).then(res => {
      if (res.statusCode === 200) {
        const newUserInfo = {
          nickName: res.data.username || '用户',
          avatarUrl: res.data.avatar || '/images/default-avatar.png',
          email: res.data.email,
          first_name: res.data.first_name
        }
        wx.setStorageSync('userInfo', newUserInfo)
        this.setData({ userInfo: newUserInfo })
      }
    }).catch(() => {})
  },

  // ==================== 统计数据 ====================
  loadStats() {
    const token = wx.getStorageSync('token')
    if (!token) return

    // 我的发布
    wx.request({
      url: app.globalData.baseUrl + 'store/my-products/',
      header: { 'Authorization': 'Token ' + token },
      success: res => this.setData({ 'stats.published': res.data.length || 0 })
    })

    // 我的收藏
    wx.request({
      url: app.globalData.baseUrl + 'store/favorites/',
      header: { 'Authorization': 'Token ' + token },
      success: res => this.setData({ 'stats.favorites': res.data.length || 0 })
    })

    // 我的订单（买家）
    wx.request({
      url: app.globalData.baseUrl + 'store/orders/my/',
      header: { 'Authorization': 'Token ' + token },
      success: res => this.setData({ 'stats.orders': res.data.length || 0 })
    })

    // 待处理订单（卖家）
    wx.request({
      url: app.globalData.baseUrl + 'store/orders/seller/',
      header: { 'Authorization': 'Token ' + token },
      success: res => this.setData({ 'stats.sellerOrders': res.data.length || 0 })
    })
  },

  // ==================== 跳转方法 ====================
  toLogin() { wx.navigateTo({ url: '/pages/login/login' }) },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          this.checkLoginStatus()
        }
      }
    })
  },

  toMyPublish() { wx.navigateTo({ url: '/pages/my-publish/my-publish' }) },
  toMyFavorites() { wx.navigateTo({ url: '/pages/my-favorites/my-favorites' }) },
  toMyOrders() { wx.navigateTo({ url: '/pages/my-orders/my-orders' }) },
  toSellerOrders() { wx.navigateTo({ url: '/pages/seller-orders/seller-orders' }) },

  editProfile() {
    wx.navigateTo({ url: '/pages/profile/edit-profile' })
  },

  changePassword() {
    wx.navigateTo({ url: '/pages/profile/change-password' })
  },

  toAddressManage() {
    wx.navigateTo({ url: '/pages/address/address-list' })
  },

  toSettings() {
    wx.showToast({ title: '设置功能开发中', icon: 'none' })
  }
})