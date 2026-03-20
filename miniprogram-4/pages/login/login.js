// pages/login/login.js - 终极完整版（支持账号密码 + 微信登录，用户名实时更新）
const { request } = require('../../utils/request.js')   // ← 必须加上这行！
const app = getApp()

Page({
  data: {
    username: 'admin',
    password: '123456',
    loading: false
  },

  // 输入用户名
  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  // 账号密码登录
  login() {
    const { username, password } = this.data

    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: app.globalData.baseUrl + 'account/login/',
      method: 'POST',
      data: { username, password },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        this.setData({ loading: false })

        if (res.statusCode === 200 && res.data.token) {
          const token = res.data.token
          const username = res.data.username || '用户'

          // 保存 token 和用户名
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', { nickName: username, avatarUrl: '/images/default-avatar.png' })

          app.globalData.token = token

          console.log('登录成功 - token:', token)
          console.log('登录成功 - username:', username)

          wx.showToast({ title: '登录成功', icon: 'success' })

          // 强制跳转到“我的”页面（触发 onShow 刷新用户名）
          wx.reLaunch({ url: '/pages/my/my' })

          // 调用刷新头像方法（修复 this 指向问题）
          this.refreshFullUserInfo(token)
        } else {
          wx.showToast({ title: res.data.detail || '登录失败', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '网络错误，请检查后端', icon: 'none' })
      }
    })
  },

  // ==================== 刷新完整用户信息（包含头像） ====================
  refreshFullUserInfo(token) {
    request('account/profile/', {
      header: { 'Authorization': `Token ${token}` }
    }).then(res => {
      if (res.statusCode === 200) {
        const fullUser = {
          nickName: res.data.username || '用户',
          avatarUrl: res.data.avatar || '/images/default-avatar.png',
          email: res.data.email,
          first_name: res.data.first_name
        }
        wx.setStorageSync('userInfo', fullUser)
        console.log('✅ 登录后刷新头像成功：', fullUser.avatarUrl)
      }
    }).catch(err => {
      console.log('刷新头像失败', err)
    })
  },

  // 微信一键登录（保留你原来的逻辑）
  onWeChatLogin(e) {
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      wx.showToast({ title: '授权失败', icon: 'none' })
      return
    }

    wx.login({
      success: res => {
        if (res.code) {
          wx.request({
            url: app.globalData.baseUrl + 'account/wx-login/',
            method: 'POST',
            data: { code: res.code },
            success: (resp) => {
              if (resp.data.token) {
                const token = resp.data.token
                const username = resp.data.username || '微信用户'

                wx.setStorageSync('token', token)
                wx.setStorageSync('userInfo', { 
                  nickName: username, 
                  avatarUrl: e.detail.userInfo.avatarUrl || '/images/default-avatar.png' 
                })

                app.globalData.token = token

                wx.showToast({ title: '微信登录成功', icon: 'success' })
                wx.reLaunch({ url: '/pages/my/my' })
              } else {
                wx.showToast({ title: '登录失败', icon: 'none' })
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

  // 跳转注册页
  toRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  }
})