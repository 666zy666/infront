// pages/profile/edit-profile/edit-profile.js
const { request } = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    user: {
      username: '',
      email: '',
      first_name: '',
      phone: '',
      avatarUrl: ''
    },
    saving: false
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ user: userInfo })
    // Refresh from backend
    const token = wx.getStorageSync('token')
    if (token) {
      request('account/profile/', {}).then(res => {
        if (res.statusCode === 200 && res.data) {
          const d = res.data
          this.setData({
            user: {
              username: d.username || userInfo.username || '',
              email: d.email || userInfo.email || '',
              first_name: d.first_name || userInfo.first_name || '',
              phone: d.phone || userInfo.phone || '',
              avatarUrl: d.avatar || userInfo.avatarUrl || '',
              is_staff: d.is_staff || false
            }
          })
        }
      }).catch(() => {})
    }
  },

  // ==================== 点击头像上传 ====================
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const token = wx.getStorageSync('token')
        if (!token) {
          wx.showToast({ title: '请先登录', icon: 'none' })
          return
        }
  
        wx.showLoading({ title: '上传中', mask: true })
  
        wx.uploadFile({
          url: app.globalData.baseUrl + 'account/avatar/', // 改成专用接口
          filePath: tempFilePath,
          name: 'avatar',
          header: {
            Authorization: `Token ${token}`
          },
          success: (uploadRes) => {
            try {
              const data = JSON.parse(uploadRes.data || '{}')
              if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300 && data.avatar) {
                this.setData({ 'user.avatarUrl': data.avatar })
                const userInfo = wx.getStorageSync('userInfo') || {}
                wx.setStorageSync('userInfo', { ...userInfo, avatarUrl: data.avatar })
                wx.showToast({ title: '上传成功', icon: 'success' })
              } else {
                wx.showToast({ title: data.detail || '上传失败', icon: 'none' })
              }
            } catch (e) {
              wx.showToast({ title: '返回解析失败', icon: 'none' })
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
      method: 'PUT',
      data: {
        username: this.data.user.username,
        email: this.data.user.email,
        first_name: this.data.user.first_name,
        phone: this.data.user.phone
      }
    }).then(res => {
      if (res.statusCode === 200) {
        const d = res.data
        const newInfo = {
          username: d.username || this.data.user.username,
          email: d.email || this.data.user.email,
          first_name: d.first_name || this.data.user.first_name,
          phone: d.phone || this.data.user.phone,
          avatarUrl: d.avatar || this.data.user.avatarUrl,
          is_staff: d.is_staff || false
        }
        wx.setStorageSync('userInfo', newInfo)
        app.globalData.userInfo = newInfo
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      } else {
        wx.showToast({ title: res.data?.detail || '保存失败', icon: 'none' })
      }
    }).catch(() => {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }).finally(() => this.setData({ saving: false }))
  }
})