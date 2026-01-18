// pages/detail/detail.js - 完整版（支持云端收藏）
const app = getApp()

Page({
  data: {
    id: null,
    product: {},
    images: [],
    isFavorite: false,
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this.loadDetail()
  },

  loadDetail() {
    wx.showLoading({ title: '加载中...' })

    wx.request({
      url: app.globalData.baseUrl + `store/products/${this.data.id}/`,
      header: { 'Authorization': 'Token ' + (wx.getStorageSync('token') || '') },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          const product = res.data
          this.setData({
            product: product,
            images: product.images || [],
            loading: false
          })
          this.checkFavorite()
        } else {
          wx.showToast({ title: '商品不存在或加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 检查是否已收藏（调用后端）
  checkFavorite() {
    const token = wx.getStorageSync('token')
    if (!token) return

    wx.request({
      url: app.globalData.baseUrl + 'store/favorites/',
      header: { 'Authorization': 'Token ' + token },
      success: (res) => {
        if (res.statusCode === 200) {
          const favorites = res.data.map(item => item.product.id)
          this.setData({ isFavorite: favorites.includes(this.data.id) })
        }
      }
    })
  },

  // 切换收藏状态（调用后端）
  toggleFavorite() {
    const id = this.data.id
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const method = this.data.isFavorite ? 'DELETE' : 'POST'
    wx.request({
      url: app.globalData.baseUrl + 'store/favorite/',
      method: method,
      data: { product_id: id },
      header: { 'Authorization': 'Token ' + token },
      success: (res) => {
        if (res.statusCode === 201 || res.statusCode === 204) {
          this.setData({ isFavorite: !this.data.isFavorite })
          wx.showToast({ 
            title: this.data.isFavorite ? '收藏成功' : '已取消收藏', 
            icon: 'success' 
          })

          // 刷新“我的”页面数字
          const pages = getCurrentPages()
          const myPage = pages.find(p => p.route === 'pages/my/my')
          if (myPage) myPage.loadMyData()
        } else {
          wx.showToast({ title: '操作失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 预览大图
  previewImage(e) {
    const current = e.currentTarget.dataset.url
    const urls = this.data.images.map(item => item.image)
    wx.previewImage({
      current: current,
      urls: urls
    })
  },

  // 拨打电话
  callSeller() {
    const phone = this.data.product.seller?.phone || '13800138000'
    wx.makePhoneCall({ phoneNumber: phone })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: this.data.product.title,
      path: `/pages/detail/detail?id=${this.data.id}`,
      imageUrl: this.data.images[0]?.image
    }
  }
})