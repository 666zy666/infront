// utils/request.js - 完整版（自动带 Token + 401 过期跳转登录）
const app = getApp()

function request(url, options = {}) {
  const token = app.globalData.token || wx.getStorageSync('token') || ''

  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Authorization': token ? 'Token ' + token : '',
        'Content-Type': 'application/json'
      },
      success(res) {
        // 401 未授权 → 跳转登录
        if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          app.globalData.token = ''
          wx.showToast({ title: '登录过期，请重新登录', icon: 'none' })
          wx.navigateTo({ url: '/pages/login/login' })
          reject('登录过期')
          return
        }
        resolve(res)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

module.exports = { request }