# 二手工程机械交易平台 — 后端

基于 Django REST Framework 的后端服务，为微信小程序前端提供 API。

## 技术栈

- Python 3.9+
- Django 4.2
- Django REST Framework
- SQLite（开发） / 可替换为 MySQL / PostgreSQL

## 快速启动

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # 创建管理员账号
python manage.py runserver 0.0.0.0:8000
```

## API 端点

| 路径 | 方法 | 说明 |
|------|------|------|
| `api/account/login/` | POST | 账号密码登录，返回 token + is_staff |
| `api/account/register/` | POST | 用户注册 |
| `api/account/wx-login/` | POST | 微信登录 |
| `api/account/profile/` | GET/PATCH | 个人资料（含 is_staff） |
| `api/account/change-password/` | POST | 修改密码 |
| `api/account/avatar/` | POST | 上传头像 |
| `api/account/addresses/` | GET/POST | 收货地址列表/新增 |
| `api/account/addresses/<pk>/` | GET/PUT/DELETE | 地址详情/修改/删除 |
| `api/account/addresses/<pk>/set-default/` | POST/PATCH | 设为默认地址 |
| `api/account/users/` | GET | 管理员：用户列表（支持 `?search=`） |
| `api/account/admin/stats/` | GET | 管理员：统计数据 |
| `api/store/products/` | GET | 商品列表（支持 `?search=`；管理员可见下架商品） |
| `api/store/products/` | POST | 发布商品 |
| `api/store/products/search/` | GET | 商品搜索（带分页） |
| `api/store/products/<pk>/` | GET/PATCH/DELETE | 商品详情/修改/删除 |
| `api/store/my-products/` | GET | 我发布的商品 |
| `api/store/categories/` | GET | 分类列表 |
| `api/store/banners/` | GET | 轮播图列表 |
| `api/store/favorites/` | GET | 我的收藏 |
| `api/store/favorites/add/` | POST | 收藏商品 |
| `api/store/favorites/remove/<product_id>/` | DELETE | 取消收藏 |
| `api/store/orders/` | GET | 管理员：所有订单（支持 `?status=` `?search=`） |
| `api/store/orders/` | POST | 买家下单 |
| `api/store/orders/my/` | GET | 买家订单（支持 `?status=`） |
| `api/store/orders/seller/` | GET | 卖家订单 |
| `api/store/orders/<pk>/` | GET | 订单详情 |
| `api/store/orders/<pk>/` | PATCH | 卖家/管理员操作（action: ship/complete/cancel） |
| `api/store/orders/<pk>/pay/` | POST | 买家支付 |
| `api/store/orders/<pk>/cancel/` | POST | 买家取消 |
| `api/store/orders/<pk>/confirm/` | POST | 买家确认收货 |

## 订单状态说明

| 状态值（数据库） | 说明 |
|------|------|
| `pending_payment` | 待付款 |
| `pending_receipt` | 待收货（已付款/已发货） |
| `completed` | 已完成 |
| `cancelled` | 已取消 |

状态过滤接口同时接受大写形式（`PENDING_PAYMENT`）和小写形式（`pending_payment`）。

## 与原 backend 仓库的差异（修复内容）

1. **`account/views.py`**
   - `PasswordLoginView`：登录响应新增 `is_staff` 字段，前端可据此判断是否有管理员权限
   - `RegisterView`：响应新增 `is_staff` 字段
   - `UserProfileView`：序列化器新增 `is_staff` 字段
   - `AdminUserListView`：支持 `?search=` 参数（原仅支持 `?keyword=`）
   - `SetDefaultAddressView`：同时支持 POST 和 PATCH（前端使用 POST）
   - `ChangePasswordView`：修改密码后重新颁发 token

2. **`account/urls.py`**
   - 新增 `users/` 路由（`api/account/users/`），前端 admin.js 直接调用此路径
   - 保留 `admin/users/` 作为兼容路径

3. **`store/views.py`**
   - `ProductListCreate`：管理员可见全部商品（含下架），支持 `?search=` 关键词搜索
   - `ProductDetail`：仅卖家本人或管理员可修改/删除商品
   - `MyOrdersView` / `SellerOrdersView`：状态过滤支持大写（`PENDING_PAYMENT`）和小写
   - `OrderCreateView`：新增 `GET` 处理，管理员可获取所有订单
   - `OrderUpdateView`：管理员可操作任意订单（原仅限卖家本人）
   - `OrderCancelView`：买家可取消待付款或待收货订单（原仅限待付款）

4. **`account/admin.py`** / **`store/admin.py`**：补充 Django Admin 注册

5. **`miniprogram-4/utils/status-map.js`**（前端修复）
   - `normalizeStatus` 新增 `pending_payment → PENDING_PAYMENT` 和 `pending_receipt → PENDING_RECEIPT` 映射
