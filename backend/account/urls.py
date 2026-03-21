# account/urls.py
from django.urls import path
from .views import (
    PasswordLoginView, RegisterView, WeChatLoginView, UpdateUserInfoView,
    UserProfileView, ChangePasswordView,
    AddressListCreateView, AddressDetailView, SetDefaultAddressView,
    AdminStatsView, AdminUserListView, AvatarUploadView,
)

urlpatterns = [
    # 认证
    path('login/', PasswordLoginView.as_view()),
    path('register/', RegisterView.as_view()),
    path('wx-login/', WeChatLoginView.as_view()),
    path('update-user-info/', UpdateUserInfoView.as_view()),

    # 个人资料
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('avatar/', AvatarUploadView.as_view()),

    # 收货地址
    path('addresses/', AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
    path('addresses/<int:pk>/set-default/', SetDefaultAddressView.as_view(), name='address-set-default'),

    # 管理员接口
    # /api/account/users/ — 前端 admin.js 调用的路径
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    # /api/account/admin/stats|users — 旧版兼容路径
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users-legacy'),
]
