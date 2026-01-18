// pages/publish/publish.js  -  纯输入版（永不报错！）
const app = getApp()

Page({
  data: {
    images: [],
    form: {
      title: '',
      description: '',
      price: '',
      machinery_type: '',
      brand: '',
      model_number: '',
      manufacture_year: '',
      working_hours: '',
      location_province: '',  // 改成一个字符串
      condition_level: '90'
    },
    machineryTypes: [
      {value: 'excavator', name: '挖掘机'},
      {value: 'loader', name: '装载机'},
      {value: 'bulldozer', name: '推土机'},
      {value: 'crane', name: '起重机'},
      {value: 'forklift', name: '叉车'},
      {value: 'pump_truck', name: '泵车'},
      {value: 'roller', name: '压路机'},
      {value: 'other', name: '其他机械'}
    ]
  },

  // 选择图片
  chooseImage() {
    if (this.data.images.length >= 9) {
      wx.showToast({ title: '最多9张', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: 9 - this.data.images.length,
      success: res => {
        this.setData({
          images: this.data.images.concat(res.tempFiles)
        })
      }
    })
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    this.data.images.splice(index, 1)
    this.setData({ images: this.data.images })
  },

  // 输入变化（通用）
  inputChange(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      [`form.${key}`]: e.detail.value
    })
  },

  // 选择设备类型
  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 'form.machinery_type': type })
  },

  // 选择成色
  selectCondition(e) {
    const level = e.currentTarget.dataset.level
    this.setData({ 'form.condition_level': level })
  },

  // 提交发布
  submit() {
    const app = getApp()
    const token = wx.getStorageSync('token')
    const f = this.data.form
  
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!f.title || !f.price || this.data.images.length === 0) {
      wx.showToast({ title: '请填写完整并上传图片', icon: 'none' })
      return
    }
  
    wx.showLoading({ title: '发布中...' })
  
    wx.uploadFile({
      url: app.globalData.baseUrl + 'store/products/',
      filePath: this.data.images[0].tempFilePath,
      name: 'images',
      header: { 'Authorization': 'Token ' + token },
      formData: {
        title: f.title,
        description: f.description || '',
        price: f.price,
        machinery_type: f.machinery_type || 'other',
        brand: f.brand || '',
        model_number: f.model_number || '',
        manufacture_year: f.manufacture_year || '',
        working_hours: f.working_hours || '',
        location_province: f.location_province,
        condition_level: f.condition_level || '90',
        category: '1'  // 写死一个存在的分类ID
      },
      success: (res) => {
        wx.hideLoading()
        const data = JSON.parse(res.data)
        if (res.statusCode === 201) {
          wx.showToast({ title: '发布成功！', icon: 'success' })
          setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1500)
        } else {
          wx.showToast({ title: data.detail || '发布失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})