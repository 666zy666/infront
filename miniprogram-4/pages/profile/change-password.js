const { request } = require('../../utils/request.js')

Page({
  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    saving: false,
    error: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    showErrorBar: false,
    globalError: '',
    focusOldPassword: false   // 自动聚焦旧密码框
  },

  inputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value,
      [`error.${field}`]: '',
      showErrorBar: false
    })
  },

  changePassword() {
    this.setData({ 
      error: { oldPassword: '', newPassword: '', confirmPassword: '' },
      showErrorBar: false 
    })

    // 前端校验
    if (!this.data.oldPassword) {
      this.setData({ 
        'error.oldPassword': '请输入旧密码',
        focusOldPassword: true 
      })
      return
    }
    if (!this.data.newPassword) {
      this.setData({ 'error.newPassword': '请输入新密码' })
      return
    }
    if (this.data.newPassword !== this.data.confirmPassword) {
      this.setData({ 'error.confirmPassword': '两次新密码不一致' })
      return
    }

    const token = wx.getStorageSync('token')
    if (!token) return

    this.setData({ saving: true })

    request('account/change-password/', {
      method: 'POST',
      data: {
        old_password: this.data.oldPassword,
        new_password: this.data.newPassword,
        confirm_password: this.data.confirmPassword
      },
      header: { 'Authorization': `Token ${token}` }
    })
    .then(res => {
      if (res.statusCode === 200) {
        wx.showToast({ title: '密码修改成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } 
      else if (res.statusCode === 400) {
        const err = res.data || {}

        // 🔥 重点优化：旧密码错误特别醒目
        if (err.old_password) {
          this.setData({
            'error.oldPassword': err.old_password[0],
            focusOldPassword: true,
            showErrorBar: true,
            globalError: '旧密码错误，请重新输入'
          })
        } else if (err.new_password) {
          this.setData({ 'error.newPassword': err.new_password[0] })
        } else if (err.confirm_password) {
          this.setData({ 'error.confirmPassword': err.confirm_password[0] })
        } else if (err.detail) {
          this.setData({ 
            showErrorBar: true, 
            globalError: err.detail 
          })
        }
      }
    })
    .catch(() => {
      wx.showToast({ title: '网络错误', icon: 'none' })
    })
    .finally(() => {
      this.setData({ saving: false })
    })
  }
})