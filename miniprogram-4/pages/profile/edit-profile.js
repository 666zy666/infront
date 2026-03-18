const { request } = require('../../utils/request.js')
const app = getApp()
Page({
  data: {
    user: {
      username: '',
      email: '',
      first_name: ''
    },
    saving: false
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ user: userInfo })
  },

  inputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`user.${field}`]: e.detail.value
    })
  },

  saveProfile() {
    const token = wx.getStorageSync('token')
    if (!token) return

    this.setData({ saving: true })

    request('account/profile/', {
      method: 'PATCH',
      data: {
        email: this.data.user.email,
        first_name: this.data.user.first_name
      },
      header: { 'Authorization': `Token ${token}` }
    }).then(res => {
      if (res.statusCode === 200) {
        wx.setStorageSync('userInfo', res.data)
        wx.showToast({ title: '保存成功', icon: 'success' })
        wx.navigateBack()
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    }).finally(() => {
      this.setData({ saving: false })
    })
  }
})