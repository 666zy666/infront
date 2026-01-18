// pages/register/register.js
const app = getApp()

Page({
  data: {
    username: '',
    phone: '',
    password: '',
    password2: '',
    loading: false
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onPassword2Input(e) { this.setData({ password2: e.detail.value }) },

  register() {
    const { username, password, password2, phone } = this.data

    if (!username || !password || !password2) {
      wx.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    if (password !== password2) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: 'http://127.0.0.1:8000/api/account/register/',
      method: 'POST',
      data: { username, password, password2, phone },
      success: res => {
        this.setData({ loading: false })

        if (res.statusCode === 201 && res.data.token) {
          // 保存 token
          wx.setStorageSync('token', res.data.token)
          app.globalData.token = res.data.token

          wx.showToast({ title: '注册成功', icon: 'success' })

          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' })
          }, 1000)
        } else {
          wx.showToast({ title: res.data.detail || '注册失败', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  toLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})