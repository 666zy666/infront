// pages/my/my.js - 完整修复版（2025年最新，支持实时更新用户名、发布/收藏数字）
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
      orders: 0
    }
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 检查登录状态并更新所有数据
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token') || app.globalData.token
    const savedUserInfo = wx.getStorageSync('userInfo') || {}

    if (token) {
      this.setData({
        hasLogin: true,
        userInfo: {
          nickName: savedUserInfo.nickName || '用户',
          avatarUrl: savedUserInfo.avatarUrl || '/images/default-avatar.png'
        }
      })
      this.loadMyData()  // 刷新发布/收藏数字
    } else {
      this.setData({
        hasLogin: false,
        userInfo: {
          nickName: '未登录',
          avatarUrl: '/images/default-avatar.png'
        },
        stats: { published: 0, favorites: 0, orders: 0 }
      })
    }
  },

  // 加载我的发布数量（后端） + 我的收藏数量（本地）
  loadMyData: function() {
    const token = wx.getStorageSync('token')
    
    // 我的发布（后端）
    if (token) {
      wx.request({
        url: app.globalData.baseUrl + 'store/my-products/',
        header: { 'Authorization': 'Token ' + token },
        success: (res) => {
          if (res.statusCode === 200) {
            this.setData({
              'stats.published': res.data.length || 0
            })
          }
        }
      })
    }
  
    // 我的收藏（云端接口 - 实时读取后端数量）
    if (token) {
      wx.request({
        url: app.globalData.baseUrl + 'store/favorites/',
        header: { 'Authorization': 'Token ' + token },
        success: (res) => {
          if (res.statusCode === 200) {
            this.setData({
              'stats.favorites': res.data.length || 0
            })
          }
        }
      })
    } else {
      // 无 token 时本地兜底（可选）
      const favorites = wx.getStorageSync('favorites') || []
      this.setData({ 'stats.favorites': favorites.length || 0 })
    }
  },

  // 跳转登录
  toLogin: function() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  // 跳转我的发布
  toMyPublish: function() {
    wx.navigateTo({ url: '/pages/my-publish/my-publish' })
  },

  // 跳转我的收藏
  toMyFavorites: function() {
    wx.navigateTo({ url: '/pages/my-favorites/my-favorites' })
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '确认退出？',
      content: '退出后需重新登录',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          app.globalData.token = ''
          this.checkLoginStatus()  // 立即刷新页面和数字
        }
      }
    })
  }
})