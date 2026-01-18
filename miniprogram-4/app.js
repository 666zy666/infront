// app.js - 2025年终极稳定版
App({
  // ==================== 全局配置 ====================
  globalData: {
    // 局域网调试（手机能访问）← 改成你电脑的IP
    baseUrl: 'http://192.168.37.49:8000/api/',

    // 本地调试（模拟器访问）
    // baseUrl: 'http://127.0.0.1:8000/api/',

    token: '',
    userInfo: null,
    isLogin: false
  },

  // ==================== 小程序启动 ====================
  onLaunch() {
    console.log('小程序启动成功')
    console.log('当前请求地址：', this.globalData.baseUrl)

    // 1. 从缓存读取 token
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.globalData.isLogin = true
      console.log('已读取本地 token:', token)
    } else {
      console.log('未登录，将进入登录流程')
    }

    // 2. 读取用户信息（头像昵称）
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }

    // 3. 可选：未登录自动跳转登录页
    // if (!token) {
    //   wx.redirectTo({ url: '/pages/login/login' })
    // }
  },

  // ==================== 全局请求封装（强烈推荐所有页面都用这个） ====================
  request(url, options = {}) {
    const app = this
    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.baseUrl + url.replace(/^\//, ''), // 自动去掉开头的 /
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Authorization': 'Token ' + (app.globalData.token || wx.getStorageSync('token') || ''),
          'Content-Type': 'application/json'
        },
        success(res) {
          // 登录过期处理
          if (res.statusCode === 401) {
            wx.removeStorageSync('token')
            app.globalData.token = ''
            app.globalData.isLogin = false
            wx.showToast({ title: '登录过期，请重新登录', icon: 'none' })
            wx.navigateTo({ url: '/pages/login/login' })
            reject('登录过期')
            return
          }

          // 成功返回
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            wx.showToast({ 
              title: res.data?.detail || res.data?.message || '请求失败', 
              icon: 'none' 
            })
            reject(res)
          }
        },
        fail(err) {
          wx.showToast({ title: '网络错误，请检查网络', icon: 'none' })
          console.error('请求失败：', url, err)
          reject(err)
        }
      })
    })
  },

  // ==================== 登录状态检查（所有页面都能调用） ====================
  checkLogin() {
    return !!this.globalData.token
  },

  // ==================== 退出登录 ====================
  logout() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    this.globalData.token = ''
    this.globalData.userInfo = null
    this.globalData.isLogin = false
    wx.showToast({ title: '已退出登录', icon: 'success' })
  }
})