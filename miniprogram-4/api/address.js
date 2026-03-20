// api/address.js - 地址相关 API
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
        'Content-Type': 'application/json'
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

function getAddressList() {
  return _req('account/addresses/')
}

function createAddress(data) {
  return _req('account/addresses/', { method: 'POST', data })
}

function updateAddress(id, data) {
  return _req(`account/addresses/${id}/`, { method: 'PUT', data })
}

function deleteAddress(id) {
  return _req(`account/addresses/${id}/`, { method: 'DELETE' })
}

function setDefaultAddress(id) {
  return _req(`account/addresses/${id}/set-default/`, { method: 'POST' })
}

module.exports = { getAddressList, createAddress, updateAddress, deleteAddress, setDefaultAddress }
