// pages/my-publish/my-publish.js
const app = getApp()

Page({
  data: {
    products: []
  },

  onLoad() {
    this.loadMyProducts()
  },

  loadMyProducts() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    wx.request({
      url: app.globalData.baseUrl + 'store/my-products/',
      header: { 'Authorization': 'Token ' + token },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ products: res.data })
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  toggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const isActive = e.currentTarget.dataset.active

    wx.showModal({
      title: '提示',
      content: isActive ? '确定下架商品？' : '确定重新上架商品？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: app.globalData.baseUrl + `store/products/${id}/`,
            method: 'PATCH',
            data: { is_active: !isActive },
            header: { 'Authorization': 'Token ' + wx.getStorageSync('token') },
            success: () => {
              wx.showToast({ title: '操作成功', icon: 'success' })
              this.loadMyProducts()  // 刷新列表
            }
          })
        }
      }
    })
  },

  deleteProduct(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '删除确认',
      content: '删除后不可恢复，确定删除？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: app.globalData.baseUrl + `store/products/${id}/`,
            method: 'DELETE',
            header: { 'Authorization': 'Token ' + wx.getStorageSync('token') },
            success: () => {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.loadMyProducts()
            }
          })
        }
      }
    })
  }
})