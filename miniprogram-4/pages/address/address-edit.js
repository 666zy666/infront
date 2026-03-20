// pages/address/address-edit.js
const { getAddressList, createAddress, updateAddress } = require('../../api/address.js')

Page({
  data: {
    mode: 'add',
    id: null,
    form: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      is_default: false
    },
    saving: false,
    errors: {}
  },

  onLoad(options) {
    const mode = options.mode || 'add'
    this.setData({ mode })
    wx.setNavigationBarTitle({ title: mode === 'add' ? '新增地址' : '编辑地址' })

    if (mode === 'edit' && options.id) {
      this.setData({ id: options.id })
      this.loadAddress(options.id)
    }
  },

  loadAddress(id) {
    wx.showLoading({ title: '加载中...' })
    getAddressList().then(res => {
      wx.hideLoading()
      if (res.statusCode === 200) {
        const list = Array.isArray(res.data) ? res.data : (res.data.results || [])
        const addr = list.find(a => String(a.id) === String(id))
        if (addr) {
          this.setData({
            form: {
              name: addr.name || addr.recipient_name || '',
              phone: addr.phone || addr.recipient_phone || '',
              province: addr.province || '',
              city: addr.city || '',
              district: addr.district || '',
              detail: addr.detail || addr.address || '',
              is_default: addr.is_default || false
            }
          })
        }
      }
    }).catch(() => wx.hideLoading())
  },

  inputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value, [`errors.${field}`]: '' })
  },

  toggleDefault(e) {
    this.setData({ 'form.is_default': e.detail.value })
  },

  validate() {
    const { name, phone, detail } = this.data.form
    const errors = {}
    if (!name.trim()) errors.name = '请输入收件人姓名'
    if (!phone.trim()) errors.phone = '请输入手机号'
    else if (!/^1[3-9]\d{9}$/.test(phone.trim())) errors.phone = '手机号格式不正确'
    if (!detail.trim()) errors.detail = '请输入详细地址'
    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  save() {
    if (!this.validate()) return
    const data = { ...this.data.form }

    this.setData({ saving: true })
    const req = this.data.mode === 'edit'
      ? updateAddress(this.data.id, data)
      : createAddress(data)

    req.then(res => {
      this.setData({ saving: false })
      if (res.statusCode === 200 || res.statusCode === 201) {
        wx.showToast({ title: this.data.mode === 'add' ? '添加成功' : '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      } else {
        const msg = res.data?.detail || res.data?.name?.[0] || '保存失败'
        wx.showToast({ title: msg, icon: 'none' })
      }
    }).catch(() => this.setData({ saving: false }))
  }
})
