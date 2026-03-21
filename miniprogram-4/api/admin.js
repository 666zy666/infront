// api/admin.js - 管理员相关 API（带 mock 回退机制）
const app = getApp()

function _req(url, options = {}) {
  const token = wx.getStorageSync('token') || app.globalData.token || ''
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        Authorization: token ? 'Token ' + token : '',
        'Content-Type': 'application/json'
      },
      success(res) { resolve(res) },
      fail(err) { reject(err) }
    })
  })
}

// ========== Mock 数据（后端接口未就绪时使用） ==========

const MOCK_USERS = [
  { id: 1, username: 'admin', email: 'admin@example.com', phone: '13800000001', is_staff: true, date_joined: '2024-01-01' },
  { id: 2, username: 'user1', email: 'user1@example.com', phone: '13800000002', is_staff: false, date_joined: '2024-02-15' },
  { id: 3, username: 'user2', email: 'user2@example.com', phone: '13800000003', is_staff: false, date_joined: '2024-03-10' },
  { id: 4, username: 'seller1', email: 'seller1@example.com', phone: '13900000001', is_staff: false, date_joined: '2024-03-20' },
  { id: 5, username: 'buyer1', email: 'buyer1@example.com', phone: '13900000002', is_staff: false, date_joined: '2024-04-01' }
]

// ========== 用户管理 ==========

/**
 * 获取用户列表（管理员接口，失败时返回 mock 数据）
 */
function getUsers(keyword) {
  const url = keyword
    ? `account/users/?search=${encodeURIComponent(keyword)}`
    : 'account/users/'
  return _req(url).then(res => {
    if (res.statusCode === 200) return res
    // 后端未提供管理接口时使用 mock 数据
    return { statusCode: 200, data: MOCK_USERS, _isMock: true }
  }).catch(() => ({ statusCode: 200, data: MOCK_USERS, _isMock: true }))
}

// ========== 商品管理 ==========

/**
 * 获取所有商品列表（公开接口，可按关键词搜索）
 */
function getAllProducts(keyword) {
  const url = keyword
    ? `store/products/?search=${encodeURIComponent(keyword)}`
    : 'store/products/'
  return _req(url)
}

/**
 * 删除商品
 */
function deleteProduct(id) {
  return _req(`store/products/${id}/`, { method: 'DELETE' })
}

// ========== 订单管理 ==========

/**
 * 获取所有订单（管理员视图，失败时尝试获取卖家订单）
 */
function getAllOrders(status, keyword) {
  let url = 'store/orders/'
  const params = []
  if (status) params.push(`status=${status}`)
  if (keyword) params.push(`search=${encodeURIComponent(keyword)}`)
  if (params.length) url += '?' + params.join('&')

  return _req(url).then(res => {
    if (res.statusCode === 200) return res
    // 管理接口不可用时退回卖家订单视图
    let fallbackUrl = 'store/orders/seller/'
    if (status) fallbackUrl += `?status=${status}`
    return _req(fallbackUrl)
  }).catch(() => {
    let fallbackUrl = 'store/orders/seller/'
    if (status) fallbackUrl += `?status=${status}`
    return _req(fallbackUrl)
  })
}

/**
 * 更新订单状态（发货/取消/完成）
 */
function updateOrderStatus(id, action, extra) {
  return _req(`store/orders/${id}/`, {
    method: 'PATCH',
    data: { action, ...extra }
  })
}

// ========== 统计数据 ==========

/**
 * 获取管理后台统计数据
 * 并行请求多个接口，汇总为统计卡片数据
 */
function getAdminStats() {
  return Promise.allSettled([
    _req('account/users/'),
    _req('store/products/'),
    _req('store/orders/seller/'),
    _req('store/orders/my/')
  ]).then(([usersRes, productsRes, sellerOrdersRes, buyerOrdersRes]) => {
    const stats = {
      userCount: '--',
      productCount: '--',
      orderCount: '--',
      totalSales: '--',
      isMock: false
    }

    if (usersRes.status === 'fulfilled' && usersRes.value.statusCode === 200) {
      const d = usersRes.value.data
      stats.userCount = Array.isArray(d) ? d.length : (d.count != null ? d.count : '--')
    } else {
      stats.userCount = MOCK_USERS.length
      stats.isMock = true
    }

    if (productsRes.status === 'fulfilled' && productsRes.value.statusCode === 200) {
      const d = productsRes.value.data
      stats.productCount = Array.isArray(d) ? d.length : (d.count != null ? d.count : (d.results ? d.results.length : '--'))
    }

    const orders = []
    if (sellerOrdersRes.status === 'fulfilled' && sellerOrdersRes.value.statusCode === 200) {
      const d = sellerOrdersRes.value.data
      orders.push(...(Array.isArray(d) ? d : (d.results || [])))
    }
    if (buyerOrdersRes.status === 'fulfilled' && buyerOrdersRes.value.statusCode === 200) {
      const d = buyerOrdersRes.value.data
      orders.push(...(Array.isArray(d) ? d : (d.results || [])))
    }

    if (orders.length > 0) {
      stats.orderCount = orders.length
      const total = orders.reduce((sum, o) => sum + parseFloat(o.price || o.total_price || 0), 0)
      stats.totalSales = total > 0 ? total.toFixed(0) : '0'
    }

    return stats
  })
}

module.exports = {
  getUsers,
  getAllProducts,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAdminStats
}
