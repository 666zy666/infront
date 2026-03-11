// pages/publish/publish.js - 完整发布页面代码
const app = getApp()

Page({
  data: {
    images: [], // 临时图片路径数组（最多9张）
    form: {
      title: '',
      description: '',
      price: '',
      machinery_type: '',
      brand: '',
      model_number: '',
      manufacture_year: '',
      working_hours: '',
      location_province: '',
      condition_level: '90',
      contact_type: 'phone',      // phone 或 wechat
      contact_value: ''
    },
    machineryTypes: [
      { value: 'excavator', name: '挖掘机' },
      { value: 'loader', name: '装载机' },
      { value: 'bulldozer', name: '推土机' },
      { value: 'crane', name: '起重机' },
      { value: 'forklift', name: '叉车' },
      { value: 'pump_truck', name: '泵车' },
      { value: 'roller', name: '压路机' },
      { value: 'other', name: '其他机械' }
    ],
    conditionLevels: ['99', '95', '90', '80', '70'],
    contactTypes: ['手机号', '微信号'],
    contactTypeIndex: 0,
    machineryTypeIndex: -1, // 初始未选中
    loading: false
  },

  // 选择设备类型（tag点击）
  selectType(e) {
    const type = e.currentTarget.dataset.type
    const index = this.data.machineryTypes.findIndex(item => item.value === type)
    this.setData({
      machineryTypeIndex: index,
      'form.machinery_type': type
    })
  },

  // 选择成色（tag点击）
  selectCondition(e) {
    const level = e.currentTarget.dataset.level
    this.setData({
      'form.condition_level': level
    })
  },

  // 选择联系方式类型
  onContactTypeChange(e) {
    const index = e.detail.value
    const type = index === '0' ? 'phone' : 'wechat'
    this.setData({
      contactTypeIndex: index,
      'form.contact_type': type
    })
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({
      'form.contact_value': e.detail.value
    })
  },

  // 选择图片（最多9张）
  chooseImage() {
    if (this.data.images.length >= 9) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: 9 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => ({ tempFilePath: file.tempFilePath }))
        this.setData({
          images: this.data.images.concat(tempFiles)
        })
      }
    })
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.images.map(item => item.tempFilePath)
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  // 通用输入处理
  inputChange(e) {
    const field = e.currentTarget.dataset.key
    const value = e.detail.value
    this.setData({
      [`form.${field}`]: value
    })
  },

  // 提交发布
  submit() {
    const f = this.data.form

    // 必填校验
    if (!f.title) return wx.showToast({ title: '请输入标题', icon: 'none' })
    if (!f.price || isNaN(f.price) || Number(f.price) <= 0) return wx.showToast({ title: '请输入有效价格', icon: 'none' })
    if (!f.machinery_type) return wx.showToast({ title: '请选择设备类型', icon: 'none' })
    if (!f.location_province) return wx.showToast({ title: '请输入所在地', icon: 'none' })
    if (this.data.images.length === 0) return wx.showToast({ title: '请至少上传一张图片', icon: 'none' })

    wx.showLoading({ title: '发布中...', mask: true })

    const formData = {
      title: f.title,
      description: f.description || '',
      price: Number(f.price),
      machinery_type: f.machinery_type,
      brand: f.brand || '',
      model_number: f.model_number || '',
      manufacture_year: f.manufacture_year ? Number(f.manufacture_year) : null,
      working_hours: f.working_hours ? Number(f.working_hours) : null,
      location_province: f.location_province,
      condition_level: f.condition_level,
      contact_type: f.contact_type,
      contact_value: f.contact_value
    }

    // 先上传第一张图片（主图）
    wx.uploadFile({
      url: app.globalData.baseUrl + 'store/products/',
      filePath: this.data.images[0].tempFilePath,
      name: 'images',
      formData: formData,
      header: {
        'Authorization': 'Token ' + (wx.getStorageSync('token') || ''),
        'Content-Type': 'multipart/form-data'
      },
      success: (res) => {
        wx.hideLoading()

        let data
        try {
          data = JSON.parse(res.data)
        } catch (e) {
          data = { detail: '服务器返回格式错误' }
        }

        if (res.statusCode === 201) {
          wx.showToast({ title: '发布成功', icon: 'success' })
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