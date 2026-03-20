// pages/profile/edit-profile/edit-profile.js
const { request } = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    user: {
      username: '',
      email: '',
      first_name: '',
      avatarUrl: ''
    },
    saving: false
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ user: userInfo })
  },

  // ==================== 点击头像上传 ====================
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传头像...' })

        const token = wx.getStorageSync('token')

        wx.uploadFile({
          url: app.globalData.baseUrl + 'account/profile/',
          filePath: tempFilePath,
          name: 'avatar',
          header: { 'Authorization': `Token ${token}` },
          success: uploadRes => {
            try {
              const data = JSON.parse(uploadRes.data)
              if (uploadRes.statusCode === 200 && data.avatar) {
                this.setData({ 'user.avatarUrl': data.avatar })
                wx.setStorageSync('userInfo', { ...this.data.user, avatarUrl: data.avatar })
                wx.showToast({ title: '头像上传成功', icon: 'success' })
              } else {
                wx.showToast({ title: data.detail || '上传失败', icon: 'none' })
              }
            } catch (e) {
              wx.showToast({ title: '服务器返回异常', icon: 'none' })
            }
          },
          fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
          complete: () => wx.hideLoading()
        })
      }
    })
  },

  // ==================== 输入框变化 ====================
  inputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`user.${field}`]: e.detail.value })
  },

  // ==================== 保存修改 ====================
  saveProfile() {
    const token = wx.getStorageSync('token')
    if (!token) return

    this.setData({ saving: true })

    request('account/profile/', {
      method: 'PATCH',
      data: {
        username: this.data.user.username,
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
        wx.showToast({ title: res.data.detail || '保存失败', icon: 'none' })
      }
    }).finally(() => this.setData({ saving: false }))
  }
})