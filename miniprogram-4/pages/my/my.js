const { request } = require('../../utils/request.js')
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

  normalizeAvatar(url) {
    if (!url) return '/images/default-avatar.png'
    if (/^https?:\/\//.test(url)) return url
    if (/^\/media\//.test(url)) {
      return app.globalData.baseUrl.replace(/\/api\/?$/, '') + url
    }
    return url
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    let userInfo = wx.getStorageSync('userInfo') || {}

    const localAvatar = this.normalizeAvatar(userInfo.avatarUrl)
    this.setData({
      hasLogin: !!token,
      userInfo: {
        nickName: userInfo.nickName || userInfo.username || '用户',
        avatarUrl: localAvatar
      }
    })

    // 关键修复：已登录就刷新一次后端资料，不再依赖“头像为空”条件
    if (token) this.refreshUserInfo(token)
  },

  refreshUserInfo(token) {
    request('account/profile/', {
      header: { Authorization: `Token ${token}` }
    }).then(res => {
      console.log('profile status=', res.statusCode)
      console.log('profile data=', res.data)
  
      if (res.statusCode === 200 && res.data) {
        const d = res.data
        const avatarRaw = d.avatar || d.avatarUrl || d.userprofile?.avatar || ''
  
        const newUserInfo = {
          nickName: d.username || '用户',
          username: d.username || '用户',
          avatarUrl: this.normalizeAvatar(avatarRaw),
          email: d.email || '',
          first_name: d.first_name || ''
        }
  
        console.log('avatarRaw=', avatarRaw)
        console.log('avatarFinal=', newUserInfo.avatarUrl)
  
        wx.setStorageSync('userInfo', newUserInfo)
        this.setData({ userInfo: newUserInfo })
      }
    }).catch(err => {
      console.log('refreshUserInfo error=', err)
    })
  },

  loadStats() {
    const token = wx.getStorageSync('token')
    if (!token) return

    wx.request({
      url: app.globalData.baseUrl + 'store/my-products/',
      header: { Authorization: 'Token ' + token },
      success: res => this.setData({ 'stats.published': res.data.length || 0 })
    })

    wx.request({
      url: app.globalData.baseUrl + 'store/favorites/',
      header: { Authorization: 'Token ' + token },
      success: res => this.setData({ 'stats.favorites': res.data.length || 0 })
    })

    wx.request({
      url: app.globalData.baseUrl + 'store/orders/my/',
      header: { Authorization: 'Token ' + token },
      success: res => this.setData({ 'stats.orders': res.data.length || 0 })
    })

    wx.request({
      url: app.globalData.baseUrl + 'store/orders/seller/',
      header: { Authorization: 'Token ' + token },
      success: res => this.setData({ 'stats.sellerOrders': res.data.length || 0 })
    })
  },

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
  editProfile() { wx.navigateTo({ url: '/pages/profile/edit-profile' }) },
  changePassword() { wx.navigateTo({ url: '/pages/profile/change-password' }) },
  toAddressManage() { wx.navigateTo({ url: '/pages/address/address-list' }) },
  toSettings() { wx.showToast({ title: '设置功能开发中', icon: 'none' }) }
})