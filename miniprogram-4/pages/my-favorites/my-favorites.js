// pages/my-favorites/my-favorites.js 
const app = getApp()

Page({
  data: {
    favorites: [],  // 后端返回的收藏列表
    loading: true
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    // 每次返回页面都刷新（从详情页取消后同步）
    this.loadFavorites()
  },

  loadFavorites() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      this.setData({ loading: false })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: app.globalData.baseUrl + 'store/favorites/',
      header: { 'Authorization': 'Token ' + token },
      success: (res) => {
        this.setData({ loading: false })
        if (res.statusCode === 200) {
          this.setData({ favorites: res.data })
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    const token = wx.getStorageSync('token')
  
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏该商品？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: app.globalData.baseUrl + 'store/favorite/',
            method: 'DELETE',
            data: { product_id: id },
            header: { 'Authorization': 'Token ' + token },
            success: (resp) => {
              if (resp.statusCode === 204) {
                wx.showToast({ title: '已取消收藏', icon: 'success' })
                this.loadFavorites()  // 刷新当前列表
  
                // 关键：通知“我的”页面刷新数字
                const pages = getCurrentPages()
                const myPage = pages.find(p => p.route === 'pages/my/my')
                if (myPage) {
                  myPage.loadMyData()  // 重新计算收藏数量
                }
              } else {
                wx.showToast({ title: '取消失败', icon: 'none' })
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  },
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})