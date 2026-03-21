// pages/admin/products.js - 商品管理
const app = getApp()
const { getAllProducts, deleteProduct } = require('../../api/admin.js')

Page({
  data: {
    products: [],
    loading: false,
    keyword: '',
    deleting: false
  },

  onShow() {
    this.loadProducts()
  },

  inputKeyword(e) {
    this.setData({ keyword: e.detail.value })
  },

  search() {
    this.loadProducts()
  },

  clearSearch() {
    this.setData({ keyword: '' })
    this.loadProducts()
  },

  loadProducts() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.setData({ loading: true })
    getAllProducts(this.data.keyword).then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        const list = Array.isArray(res.data) ? res.data : (res.data.results || [])
        this.setData({ products: list })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '网络错误', icon: 'none' })
    })
  },

  normalizeImage(url) {
    if (!url) return '/images/cat/all.png'
    if (/^https?:\/\//.test(url)) return url
    if (/^\/media\//.test(url)) {
      return app.globalData.baseUrl.replace(/\/api\/?$/, '') + url
    }
    return url
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  toEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}` })
  },

  confirmDelete(e) {
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    wx.showModal({
      title: '删除商品',
      content: `确定删除"${title || '该商品'}"？删除后无法恢复。`,
      confirmColor: '#ff5000',
      success: res => {
        if (!res.confirm) return
        this.doDelete(id)
      }
    })
  },

  doDelete(id) {
    wx.showLoading({ title: '删除中...' })
    deleteProduct(id).then(res => {
      wx.hideLoading()
      if (res.statusCode === 204 || res.statusCode === 200) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadProducts()
      } else {
        wx.showToast({ title: res.data?.detail || '删除失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '删除失败', icon: 'none' })
    })
  }
})
