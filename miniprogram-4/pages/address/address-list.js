// pages/address/address-list.js
const { getAddressList, deleteAddress, setDefaultAddress } = require('../../api/address.js')

Page({
  data: {
    addresses: [],
    loading: false
  },

  onLoad() {
    this.loadAddresses()
  },

  onShow() {
    this.loadAddresses()
  },

  loadAddresses() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ loading: true })
    getAddressList().then(res => {
      this.setData({ loading: false })
      if (res.statusCode === 200) {
        this.setData({ addresses: Array.isArray(res.data) ? res.data : (res.data.results || []) })
      }
    }).catch(() => this.setData({ loading: false }))
  },

  toAdd() {
    wx.navigateTo({ url: '/pages/address/address-edit?mode=add' })
  },

  toEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/address/address-edit?mode=edit&id=${id}` })
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '设置中...' })
    setDefaultAddress(id).then(res => {
      wx.hideLoading()
      if (res.statusCode === 200) {
        wx.showToast({ title: '已设为默认地址', icon: 'success' })
        this.loadAddresses()
      } else {
        wx.showToast({ title: res.data?.detail || '操作失败', icon: 'none' })
      }
    }).catch(() => wx.hideLoading())
  },

  deleteAddr(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除地址',
      content: '确定删除该地址？',
      success: res => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中...' })
        deleteAddress(id).then(res => {
          wx.hideLoading()
          if (res.statusCode === 204 || res.statusCode === 200) {
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadAddresses()
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }).catch(() => wx.hideLoading())
      }
    })
  }
})
