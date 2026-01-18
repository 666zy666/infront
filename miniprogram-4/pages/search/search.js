// pages/search/search.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    keyword: '',
    products: [],
    filters: {
      machinery_type: '',
      min_price: '',
      max_price: '',
      province: '',
      min_hours: '',
      max_hours: ''
    },
    page: 1,
    loading: false,
    hasMore: true,
    showFilters: false
  },

  onLoad() {
    // 可从首页跳转带关键词
    const eventChannel = this.getOpenerEventChannel?.()
    if (eventChannel) {
      eventChannel.on('searchKeyword', data => {
        this.setData({ keyword: data.keyword })
        this.search()
      })
    }
  },

  // 输入框搜索
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 点击搜索按钮
  onSearchConfirm() {
    this.setData({ products: [], page: 1, hasMore: true })
    this.search()
  },

  // 筛选表单变化
  onFilterChange(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail.value
    this.setData({
      [`filters.${key}`]: value
    })
  },

  // 切换筛选面板
  toggleFilters() {
    this.setData({ showFilters: !this.data.showFilters })
  },

  // 重置筛选
  resetFilters() {
    this.setData({
      filters: {
        machinery_type: '',
        min_price: '',
        max_price: '',
        province: '',
        min_hours: '',
        max_hours: ''
      }
    })
  },

  // 应用筛选
  applyFilters() {
    this.setData({ products: [], page: 1, hasMore: true, showFilters: false })
    this.search()
  },

  // 主搜索函数
  search() {
    if (this.data.loading) return
    this.setData({ loading: true })

    let url = `store/products/?page=${this.data.page}`
    
    // 关键词
    if (this.data.keyword) {
      url += `&search=${encodeURIComponent(this.data.keyword)}`
    }

    // 筛选条件
    const f = this.data.filters
    if (f.machinery_type) url += `&machinery_type=${f.machinery_type}`
    if (f.min_price) url += `&min_price=${f.min_price}`
    if (f.max_price) url += `&max_price=${f.max_price}`
    if (f.province) url += `&location_province=${f.province}`
    if (f.min_hours) url += `&min_hours=${f.min_hours}`
    if (f.max_hours) url += `&max_hours=${f.max_hours}`

    request(url).then(res => {
      const newList = res.data.results || res.data
      this.setData({
        products: this.data.page === 1 ? newList : this.data.products.concat(newList),
        hasMore: newList.length === 20,
        loading: false
      })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'error' })
    })
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.search()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ products: [], page: 1, hasMore: true })
    this.search()
    setTimeout(() => wx.stopPullDownRefresh(), 1000)
  },

  // 跳转详情
  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
})