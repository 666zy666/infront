// pages/index/index.js
const {
  request
} = require('../../utils/request.js')

Page({
  data: {
    banners: [], // 从后端获取的轮播图列表
    categories: [{
        name: '挖掘机',
        icon: '/images/cat/excavator.png',
        id: 2
      },
      {
        name: '装载机',
        icon: '/images/cat/loader.png',
        id: 3
      },
      {
        name: '叉车',
        icon: '/images/cat/forklift.png',
        id: 4
      },
      {
        name: '起重机',
        icon: '/images/cat/crane.png',
        id: 5
      },
      {
        name: '推土机',
        icon: '/images/cat/bulldozer.png',
        id: 6
      },
      {
        name: '压路机',
        icon: '/images/cat/roller.png',
        id: 7
      },
      {
        name: '泵车',
        icon: '/images/cat/pump.png',
        id: 8
      },
      {
        name: '全部设备',
        icon: '/images/cat/all.png',
        id: null
      }
    ],
    products: [],
    page: 1,
    loading: false,
    hasMore: true,
    showEmpty: false,

    // 轮播图配置
    indicatorDots: true,
    autoplay: true,
    interval: 3000,
    duration: 500,
    circular: true
  },

  onLoad() {
    // 加载轮播图
    this.loadBanners()
    // 加载商品列表
    this.loadProducts()
  },

  // 加载轮播图（从后端获取）
  loadBanners() {
    request('store/banners/').then(res => {
      const banners = res.data || []
      console.log('轮播图数据：', banners)
      this.setData({
        banners: banners.length > 0 ? banners : [] // 防止空数组
      })
    }).catch(err => {
      console.log('获取轮播图失败', err)
      // 可选：设置默认占位图
      this.setData({
        banners: [{
            image: '/images/banner-placeholder.jpg'
          },
          {
            image: '/images/banner-placeholder.jpg'
          }
        ]
      })
    })
  },

  onPullDownRefresh() {
    this.setData({
      products: [],
      page: 1,
      hasMore: true
    })
    // 同时刷新轮播图
    this.loadBanners()
    this.loadProducts(() => {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadProducts()
    }
  },


  // 加载商品列表（兼容 DRF 分页 / 非分页 / 自定义 data 包裹）
  loadProducts(callback) {
    if (this.data.loading) return
    this.setData({
      loading: true,
      showEmpty: false
    })

    request(`store/products/?page=${this.data.page}`)
      .then(res => {
        // 你的 request 返回 wx.request 原始 res
        const body = res.data || {}

        console.log('商品接口完整返回：', res)
        console.log('商品接口res.data：', res.data)

        // 兼容多种后端结构
        const newList =
          body.results || // DRF 分页
          body.data?.results || // data 包裹 + 分页
          body.data || // data 包裹 + 数组
          body.items || // 常见自定义字段
          (Array.isArray(body) ? body : [])

        // hasMore 优先看 next/count，其次看长度
        const hasMore =
          typeof body.next !== 'undefined' ?
          !!body.next :
          (typeof body.data?.next !== 'undefined' ?
            !!body.data.next :
            newList.length >= 10) // 兜底阈值，别写死20

        const merged = this.data.page === 1 ?
          newList :
          this.data.products.concat(newList)

        this.setData({
          products: merged,
          hasMore,
          loading: false,
          showEmpty: this.data.page === 1 && merged.length === 0
        })

        console.log('products body=', body)
        console.log('products newList=', newList)
        callback && callback()
      })
      .catch(err => {
        console.error('loadProducts error=', err)
        this.setData({
          loading: false
        })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        callback && callback()
      })
  },

  // 分类点击

  toCategory(e) {
    const index = e.currentTarget.dataset.index;
    const selected = this.data.categories[index];

    let url = '/pages/search/search';
    if (selected && selected.id) {
      url += `?category=${selected.id}`;
    }

    wx.navigateTo({
      url
    });
  },

  // 搜索框点击
  toSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 跳转详情
  toDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 跳转发布
  toPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  },

  // 可选：轮播图点击（如果后端返回了 link）
  onBannerTap(e) {
    const banner = e.currentTarget.dataset.banner
    if (banner.link) {
      // 如果是小程序内路径
      if (banner.link.startsWith('/pages/')) {
        wx.navigateTo({
          url: banner.link
        })
      } else {
        // 外部链接（需配置业务域名）
        wx.navigateTo({
          url: `/pages/webview/webview?url=${encodeURIComponent(banner.link)}`
        })
      }
    }
  }
})