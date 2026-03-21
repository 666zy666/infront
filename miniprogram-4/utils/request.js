// utils/request.js - 兼容版（request(url, options)）
// 自动带 Token + 401 过期跳登录 + 可选 loading + 统一错误提示
const app = getApp()

function normalizeUrl(url = '') {
  return String(url).replace(/^\/+/, '')
}

function joinUrl(base = '', path = '') {
  const b = String(base).replace(/\/+$/, '')
  const p = normalizeUrl(path)
  return `${b}/${p}`
}

function request(url, options = {}) {
  const {
    method = 'GET',
    data = {},
    header = {},
    showLoading = false,
    loadingTitle = '加载中'
  } = options

  const token = app.globalData.token || wx.getStorageSync('token') || ''
  const baseUrl = app.globalData.baseUrl || ''

  if (showLoading) {
    wx.showLoading({ title: loadingTitle, mask: true })
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: joinUrl(baseUrl, url),
      method,
      data,
      header: {
        Authorization: token ? `Token ${token}` : '',
        'Content-Type': 'application/json',
        ...header
      },
      success(res) {
        const code = res.statusCode

        // 401 未授权 -> 清理登录态并跳登录
        if (code === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          app.globalData.token = ''
          app.globalData.userInfo = null
          wx.showToast({ title: '登录过期，请重新登录', icon: 'none' })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/login' })
          }, 300)
          reject(res)
          return
        }

        // 2xx 返回成功
        if (code >= 200 && code < 300) {
          resolve(res)
          return
        }

        // 其他状态统一提示
        const msg =
          (res.data && (res.data.detail || res.data.message || res.data.msg)) ||
          `请求失败(${code})`
        wx.showToast({ title: msg, icon: 'none' })
        reject(res)
      },
      fail(err) {
        wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
        reject(err)
      },
      complete() {
        if (showLoading) wx.hideLoading()
      }
    })
  })
}

module.exports = { request }