const app = getApp()

Page({
  data: {
    keyword: '',
    inputFocus: false, // 控制输入框焦点，确保可见
    history: [],
    suggestList: [],
    searchMode: false,
    products: [],
    page: 1,
    hasMore: true,
    loading: false,

    categories: ['全部', '挖掘机', '装载机', '推土机', '起重机', '叉车', '泵车', '压路机', '其他'],
    categoryIndex: 0,

    sortOptions: ['默认排序', '价格从低到高', '价格从高到低'],
    sortIndex: 0
  },

  onLoad() {
    this.loadHistory()
  },

  loadHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({
      history
    })
  },

  saveHistory(keyword) {
    if (!keyword.trim()) return
    let history = wx.getStorageSync('searchHistory') || []
    history = history.filter(k => k !== keyword)
    history.unshift(keyword)
    if (history.length > 10) history = history.slice(0, 10)
    wx.setStorageSync('searchHistory', history)
    this.setData({
      history
    })
  },

  clearHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定清空所有搜索历史？',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({
            history: []
          })
        }
      }
    })
  },

  useHistory(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({
      keyword,
      inputFocus: true
    })
    this.onSearch()
  },

  onInput(e) {
    const keyword = e.detail.value
    this.setData({
      keyword
    })

    if (keyword) {
      if (this.inputTimer) clearTimeout(this.inputTimer)
      this.inputTimer = setTimeout(() => {
        this.getSearchSuggest(keyword)
      }, 300)
    } else {
      this.setData({
        suggestList: []
      })
    }
  },

  getSearchSuggest(keyword) {
    const suggest = [
      keyword + ' 挖掘机',
      keyword + ' 装载机',
      keyword + ' 二手',
      '小松 ' + keyword,
      '卡特 ' + keyword,
      keyword + ' 2020年',
      keyword + ' 低价',
      '高性能 ' + keyword
    ].slice(0, 8)
    this.setData({
      suggestList: suggest
    })
  },

  useSuggest(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({
      keyword,
      suggestList: []
    })
    this.onSearch()
  },

  onSearch() {
    console.log('1. onSearch 被调用，当前 keyword:', this.data.keyword)

    if (!this.data.keyword.trim()) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      })
      console.log('关键词为空，直接返回')
      return
    }

    console.log('2. 保存历史')
    this.saveHistory(this.data.keyword)

    console.log('3. 设置 searchMode 和 loading')
    this.setData({
      searchMode: true,
      products: [],
      page: 1,
      hasMore: true,
      loading: true
    })

    console.log('4. 调用 loadProducts')
    this.loadProducts()
  },

  loadProducts() {
    console.log('5. loadProducts 被调用')
  
    // 先设置 loading = true（防止重复调用）
    this.setData({ loading: true })
  
    // 再判断其他条件（hasMore）
    if (!this.data.hasMore) {
      console.log('hasMore 为 false，不继续加载')
      this.setData({ loading: false })
      return
    }
  
    console.log('6. 允许请求，准备参数')
  
    const params = {
      page: this.data.page,
      page_size: 10
    }
  
    if (this.data.keyword.trim()) {
      params.keyword = this.data.keyword.trim()
    }
  
    if (this.data.categoryIndex > 0) {
      params.category = this.data.categoryIndex
    }
  
    const sortIndex = this.data.sortIndex
    if (sortIndex === 1) params.sort = 'price_asc'
    if (sortIndex === 2) params.sort = 'price_desc'
  
    const url = app.globalData.baseUrl + 'store/products/search/'
    console.log('7. 请求完整 URL：', url)
    console.log('8. 请求参数：', params)
  
    wx.request({
      url: url,
      data: params,
      method: 'GET',
      success: (res) => {
        console.log('9. 请求成功，状态码：', res.statusCode)
        console.log('10. 返回数据：', res.data)
        this.setData({ loading: false })
        if (res.statusCode === 200) {
          const newProducts = res.data.results || res.data || []
          console.log('11. 新商品数量：', newProducts.length)
          this.setData({
            products: this.data.products.concat(newProducts),
            hasMore: newProducts.length > 0
          })
        } else {
          console.log('非 200 状态码：', res)
          wx.showToast({ title: '搜索失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.log('12. 请求失败：', err)
        this.setData({ loading: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        console.log('13. 请求完成，强制关闭 loading')
        this.setData({ loading: false })  // 确保无论成功失败都关掉 loading
      }
    })
  },

  clearKeyword() {
    this.setData({
      keyword: '',
      suggestList: [],
      searchMode: false,
      products: [],
      page: 1,
      hasMore: true
    })
    this.loadProducts()
  },

  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value,
      products: [],
      page: 1,
      hasMore: true,
      loading: true
    })
    this.loadProducts()
  },

  onSortChange(e) {
    this.setData({
      sortIndex: e.detail.value,
      products: [],
      page: 1,
      hasMore: true,
      loading: true
    })
    this.loadProducts()
  },

  resetFilter() {
    this.setData({
      categoryIndex: 0,
      sortIndex: 0,
      products: [],
      page: 1,
      hasMore: true,
      loading: true
    })
    this.loadProducts()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      products: []
    })
    this.loadProducts()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadProducts()
    }
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})