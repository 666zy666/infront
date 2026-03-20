// utils/status-map.js - 订单状态文案映射
const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING_RECEIPT: 'PENDING_RECEIPT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
}

const STATUS_TEXT = {
  PENDING_PAYMENT: '待付款',
  PENDING_RECEIPT: '待收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

const STATUS_COLOR = {
  PENDING_PAYMENT: '#fa8c16',
  PENDING_RECEIPT: '#1296db',
  COMPLETED: '#07c160',
  CANCELLED: '#999999'
}

// Tab 筛选项
const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'PENDING_PAYMENT', label: '待付款' },
  { key: 'PENDING_RECEIPT', label: '待收货' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' }
]

/**
 * 将后端可能存在的旧状态字段映射到新枚举
 * 兼容旧字段: pending->PENDING_PAYMENT, paid->PENDING_RECEIPT, shipped->PENDING_RECEIPT,
 *             completed->COMPLETED, cancelled->CANCELLED
 */
function normalizeStatus(status) {
  const map = {
    pending: 'PENDING_PAYMENT',
    paid: 'PENDING_RECEIPT',
    shipped: 'PENDING_RECEIPT',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PENDING_RECEIPT: 'PENDING_RECEIPT',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  }
  return map[status] || status
}

module.exports = { ORDER_STATUS, STATUS_TEXT, STATUS_COLOR, STATUS_TABS, normalizeStatus }
