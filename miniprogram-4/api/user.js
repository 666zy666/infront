// api/user.js - 用户相关 API
const app = getApp()

function _req(url, options = {}) {
  const token = wx.getStorageSync('token') || app.globalData.token || ''
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Authorization': token ? 'Token ' + token : '',
        'Content-Type': 'application/json',
        ...(options.header || {})
      },
      success(res) {
        if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          app.globalData.token = ''
          wx.showToast({ title: '登录过期，请重新登录', icon: 'none' })
          wx.navigateTo({ url: '/pages/login/login' })
          reject(new Error('未授权'))
          return
        }
        resolve(res)
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

function getProfile() {
  return _req('account/profile/')
}

function updateProfile(data) {
  return _req('account/profile/', { method: 'PATCH', data })
}

function changePassword(data) {
  return _req('account/change-password/', { method: 'POST', data })
}

module.exports = { getProfile, updateProfile, changePassword }
