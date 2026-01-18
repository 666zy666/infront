// pages/index/index.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    banners: [
      { image: 'https://img.example.com/banner1.jpg' },
      { image: 'https://img.example.com/banner2.jpg' }
    ],
    categories: [
      { name: '挖掘机', icon: '/images/cat/excavator.png', type: 'excavator' },
      { name: '装载机', icon: '/images/cat/loader.png', type: 'loader' },
      { name: '叉车', icon: '/images/cat/forklift.png', type: 'forklift' },
      { name: '起重机', icon: '/images/cat/crane.png', type: 'crane' },
      { name: '推土机', icon: '/images/cat/bulldozer.png', type: 'bulldozer' },
      { name: '压路机', icon: '/images/cat/roller.png', type: 'roller' },
      { name: '泵车', icon: '/images/cat/pump.png', type: 'pump_truck' },
      { name: '全部设备', icon: '/images/cat/all.png', type: '' }
    ],
    products: [],
    page: 1,
    loading: false,
    hasMore: true,
    showEmpty: false
  },

  onLoad() {
    this.loadProducts()
  },

  onPullDownRefresh() {
    this.setData({ products: [], page: 1, hasMore: true })
    this.loadProducts(() => {
      wx.stopPullDownRefresh()
      wx.showToast({ title: '刷新成功', icon: 'success' })
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadProducts()
    }
  },

  // 加载商品列表
  loadProducts(callback) {
    if (this.data.loading) return
    this.setData({ loading: true, showEmpty: false })

    request(`store/products/?page=${this.data.page}`).then(res => {
      const newList = res.data.results || res.data || []
      this.setData({
        products: this.data.page === 1 ? newList : this.data.products.concat(newList),
        hasMore: newList.length === 20,
        loading: false,
        showEmpty: this.data.page === 1 && newList.length === 0
      })
      callback?.()
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'error' })
      callback?.()
    })
  },

  // 分类点击
  toCategory(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/search/search?type=${type}`
    })
  },

  // 搜索框点击
  toSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  // 跳转详情
  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  // 跳转发布
  toPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' })
  }
})