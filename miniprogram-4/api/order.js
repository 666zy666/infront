// api/order.js - 订单相关 API
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
          wx.showToast({
            title: '登录过期，请重新登录',
            icon: 'none'
          })
          wx.navigateTo({
            url: '/pages/login/login'
          })
          reject(new Error('未授权'))
          return
        }
        resolve(res)
      },
      fail(err) {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/** 获取订单列表，可按状态筛选 */
function getOrders(status) {
  const url = status ? `store/orders/my/?status=${status}` : 'store/orders/my/'
  return _req(url)
}

/** 支付订单 */
function payOrder(id) {
  return _req(`store/orders/${id}/pay/`, {
    method: 'POST'
  })
}

/** 取消订单 */
function cancelOrder(id) {
  return _req(`store/orders/${id}/cancel/`, {
    method: 'POST'
  })
}

/** 确认收货 */
function confirmReceipt(id) {
  return _req(`store/orders/${id}/confirm/`, {
    method: 'POST'
  })
}

/** 获取订单详情 */
function getOrderDetail(id) {
  return _req(`store/orders/${id}/`)
}

module.exports = {
  getOrders,
  payOrder,
  cancelOrder,
  confirmReceipt,
  getOrderDetail
}