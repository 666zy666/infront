// pages/admin/products.js - 商品管理
const app = getApp()
const { getAllProducts, deleteProduct } = require('../../api/admin.js')

Page({
  data: {
    products: [],
    loading: false,
    keyword: '',
    deleting: false,
    nextUrl: null,
    hasMore: false,
    loadingMore: false
  },

  onShow() {
    this.loadProducts()
  },

  onPullDownRefresh() {
    this.loadProducts().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore()
    }
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

  normalizeImage(url) {
    if (!url) return '/images/cat/all.png'
    if (/^https?:\/\//.test(url)) return url
    if (/^\/media\//.test(url)) {
      return app.globalData.baseUrl.replace(/\/api\/?$/, '') + url
    }
    return url
  },

  _processProducts(list) {
    return list.map(p => ({
      ...p,
      _imageUrl: this.normalizeImage(
        p.image || (p.images && p.images[0] && p.images[0].image) || ''
      ),
      _statusText: p.is_active === false ? '已下架' : '在售',
      _statusColor: p.is_active === false ? '#999' : '#07c160'
    }))
  },

  loadProducts() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateBack()
      return Promise.resolve()
    }

    this.setData({ loading: true, nextUrl: null, hasMore: false })
    return getAllProducts(this.data.keyword).then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        const body = res.data
        const raw = Array.isArray(body) ? body : (body.results || [])
        const nextUrl = (!Array.isArray(body) && body.next) ? body.next : null
        this.setData({
          products: this._processProducts(raw),
          nextUrl,
          hasMore: !!nextUrl
        })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '网络错误', icon: 'none' })
    })
  },

  loadMore() {
    if (!this.data.nextUrl || this.data.loadingMore) return
    this.setData({ loadingMore: true })
    const token = wx.getStorageSync('token')
    wx.request({
      url: this.data.nextUrl,
      header: { Authorization: token ? 'Token ' + token : '' },
      success: res => {
        if (res.statusCode === 200) {
          const body = res.data
          const raw = Array.isArray(body) ? body : (body.results || [])
          const nextUrl = (!Array.isArray(body) && body.next) ? body.next : null
          this.setData({
            products: this.data.products.concat(this._processProducts(raw)),
            nextUrl,
            hasMore: !!nextUrl,
            loadingMore: false
          })
        } else {
          this.setData({ loadingMore: false })
        }
      },
      fail: () => this.setData({ loadingMore: false })
    })
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
