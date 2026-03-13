const app = getApp()

Page({
  data: {
    keyword: '',
    inputFocus: false,
    history: [],
    suggestList: [],
    searchMode: false,
    products: [],
    page: 1,
    hasMore: true,
    loading: false,

    // 与后台 ID 对齐（根据你的后台截图）
    categories: [
      { name: '全部', id: null },
      { name: '挖掘机', id:2},
      { name: '装载机', id:3},
      { name: '推土机', id:4},
      { name: '起重机', id:5},
      { name: '叉车', id:6},
      { name: '泵车', id:7},
      // 如果有更多分类，继续加
    ],
    categoryIndex: 0,

    sortOptions: ['默认排序', '价格从低到高', '价格从高到低'],
    sortIndex: 0
  },

  onLoad(options) {
    console.log('搜索页加载，参数：', options)
  
    let searchMode = false
    if (options.category || options.keyword) {
      searchMode = true
    }
  
    this.setData({ searchMode })
  
    // 如果有 category 参数，设置索引
    if (options.category) {
      const targetId = Number(options.category)
      const index = this.data.categories.findIndex(cat => cat.id === targetId)
      if (index !== -1) {
        this.setData({ categoryIndex: index })
      }
    }
  
    this.loadProducts()
  },

  loadHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({ history })
  },

  saveHistory(keyword) {
    if (!keyword.trim()) return
    let history = wx.getStorageSync('searchHistory') || []
    history = history.filter(k => k !== keyword)
    history.unshift(keyword)
    if (history.length > 10) history = history.slice(0, 10)
    wx.setStorageSync('searchHistory', history)
    this.setData({ history })
  },

  clearHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定清空所有搜索历史？',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({ history: [] })
        }
      }
    })
  },

  useHistory(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ keyword, inputFocus: true })
    this.onSearch()
  },

  onInput(e) {
    const keyword = e.detail.value
    this.setData({ keyword })

    if (keyword) {
      if (this.inputTimer) clearTimeout(this.inputTimer)
      this.inputTimer = setTimeout(() => {
        this.getSearchSuggest(keyword)
      }, 300)
    } else {
      this.setData({ suggestList: [] })
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
    this.setData({ suggestList: suggest })
  },

  useSuggest(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ keyword, suggestList: [] })
    this.onSearch()
  },

  onSearch() {
    console.log('进入 onSearch，当前 keyword：', this.data.keyword)
  
    if (!this.data.keyword.trim()) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }
  
    this.saveHistory(this.data.keyword)
  
    console.log('即将设置 searchMode = true')
    this.setData({
      searchMode: true,
      products: [],
      page: 1,
      hasMore: true,
      loading: true
    })
  
    console.log('setData 后立即打印 searchMode：', this.data.searchMode)  // 可能还是 false（异步）
  
    this.loadProducts()
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

  loadProducts() {
    console.log('loadProducts 被调用')
  
    this.setData({ loading: true })
  
    if (!this.data.hasMore) {
      console.log('hasMore 为 false，不继续')
      this.setData({ loading: false })
      return
    }
  
    const params = {
      page: this.data.page,
      page_size: 10
    }
  
    if (this.data.keyword.trim()) {
      params.keyword = this.data.keyword.trim()
    }
  
    if (this.data.categoryIndex > 0) {
      const selected = this.data.categories[this.data.categoryIndex]
      if (selected && selected.id) {
        params.category = selected.id
      }
    }
  
    // 关键修复：打印当前 sortIndex，确保判断正确
    const sortIndex = Number(this.data.sortIndex)  // 强制转数字
    console.log('当前 sortIndex (number):', sortIndex)
  
    let sortValue = '-created_at'  // 默认
    if (sortIndex === 1) {
      sortValue = 'price_asc'          // 低到高
    } else if (sortIndex === 2) {
      sortValue = 'price_desc'         // 高到低
    }
  
    params.sort = sortValue
    console.log('最终发送的 sort 参数:', sortValue)
  
    const url = app.globalData.baseUrl + 'store/products/search/'
    console.log('请求 URL：', url)
    console.log('完整请求参数：', params)
  
    wx.request({
      url: url,
      data: params,
      method: 'GET',
      success: res => {
        console.log('请求成功，状态码：', res.statusCode)
        console.log('返回数据：', res.data)
        this.setData({ loading: false })
        if (res.statusCode === 200) {
          const newProducts = res.data.results || res.data || []
          console.log('新商品数量：', newProducts.length)
          console.log('商品详情：', newProducts)  // 加这一行，看商品内容
      
          this.setData({
            products: this.data.page === 1 ? newProducts : this.data.products.concat(newProducts),
            hasMore: newProducts.length > 0,
            loading: false
          })
          console.log('setData 后 products 长度：', this.data.products.length)
          console.log('当前 products 示例：', this.data.products[0] || '无数据')
        }
      },
      fail: err => {
        console.log('请求失败：', err)
        this.setData({ loading: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        console.log('请求完成')
        this.setData({ loading: false })
      }
    })
  },

  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value,
      searchMode: true,
      products: [],
      page: 1,
      hasMore: true,
      loading: true
    })
    this.loadProducts()
  },

  onSortChange(e) {
    const sortIndex = Number(e.detail.value)  // 强制转数字
    console.log('排序改变为 index:', sortIndex, '类型:', typeof sortIndex)
  
    this.setData({
      sortIndex: sortIndex,
      searchMode: true,
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
      searchMode: true,
      products: [],
      page: 1,
      hasMore: true,
      loading: true
    })
    this.loadProducts()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, products: [] })
    this.loadProducts()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 })
      this.loadProducts()
    }
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
})