from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
import requests
from rest_framework import generics, status
from rest_framework.response import Response
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Q, Sum
from .models import UserProfile, Address
from .serializers import UserProfileSerializer, ChangePasswordSerializer, AddressSerializer
from store.models import Product, Order
from rest_framework.parsers import MultiPartParser, FormParser


class PasswordLoginView(APIView):
    """账号密码登录，返回 token 及 is_staff 字段"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"detail": "请输入用户名和密码"}, status=400)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "用户名或密码错误"}, status=400)

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user_id": user.id,
            "username": user.username,
            "is_staff": user.is_staff,
        })


class RegisterView(APIView):
    """账号密码注册，注册即登录"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        password2 = request.data.get('password2')
        phone = request.data.get('phone', '')

        if not all([username, password, password2]):
            return Response({"detail": "请填写完整信息"}, status=400)

        if password != password2:
            return Response({"detail": "两次密码不一致"}, status=400)

        if len(password) < 6:
            return Response({"detail": "密码至少6位"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "用户名已存在"}, status=400)

        user = User.objects.create_user(username=username, password=password)
        if phone:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.phone = phone
            profile.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "username": username,
            "is_staff": user.is_staff,
            "message": "注册成功，已自动登录"
        }, status=201)


class WeChatLoginView(APIView):
    """微信登录"""
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"detail": "缺少code"}, status=400)

        url = "https://api.weixin.qq.com/sns/jscode2session"
        params = {
            "appid": settings.WX_APP_ID,
            "secret": settings.WX_APP_SECRET,
            "js_code": code,
            "grant_type": "authorization_code"
        }
        wx_resp = requests.get(url, params=params).json()

        if wx_resp.get('errcode'):
            return Response({"detail": "微信授权失败: " + wx_resp.get('errmsg', '')}, status=400)

        openid = wx_resp['openid']

        user, created = User.objects.get_or_create(
            username=f"wx_{openid[-8:]}",
            defaults={'is_active': True}
        )
        if created:
            user.set_unusable_password()
            user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.wechat_openid = openid
            profile.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "username": user.username,
            "nickName": user.username,
            "is_staff": user.is_staff,
            "message": "微信登录成功"
        })


class UpdateUserInfoView(APIView):
    """更新用户昵称"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        nickName = request.data.get('nickName')
        if not nickName:
            return Response({"detail": "缺少昵称"}, status=400)
        user = request.user
        user.username = nickName
        user.save()
        return Response({"message": "用户信息更新成功"})


class UserProfileView(generics.RetrieveUpdateAPIView):
    """个人信息查看与修改"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        return {'request': self.request}


class ChangePasswordView(generics.GenericAPIView):
    """修改密码"""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']

        if not user.check_password(old_password):
            return Response({"old_password": "旧密码错误"}, status=status.HTTP_400_BAD_REQUEST)

        new_password = serializer.validated_data['new_password']

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({"new_password": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)
        # Re-create token so existing sessions stay valid via token
        Token.objects.filter(user=user).delete()
        token, _ = Token.objects.get_or_create(user=user)

        return Response({"detail": "密码修改成功", "token": token.key}, status=status.HTTP_200_OK)


# ── 收货地址管理 ──────────────────────────────────────────────

class AddressListCreateView(generics.ListCreateAPIView):
    """收货地址列表 & 新增"""
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """收货地址详情 / 修改 / 删除"""
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class SetDefaultAddressView(APIView):
    """设置默认地址（同一用户仅一个默认），接受 POST 或 PATCH"""
    permission_classes = [IsAuthenticated]

    def _set_default(self, request, pk):
        address = Address.objects.filter(pk=pk, user=request.user).first()
        if not address:
            return Response({"detail": "地址不存在"}, status=status.HTTP_404_NOT_FOUND)
        Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
        address.is_default = True
        address.save()
        return Response(AddressSerializer(address).data)

    def post(self, request, pk):
        return self._set_default(request, pk)

    def patch(self, request, pk):
        return self._set_default(request, pk)


class AvatarUploadView(APIView):
    """上传头像"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('avatar')
        if not file_obj:
            return Response({"detail": "未上传 avatar 文件"}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.avatar = file_obj
        profile.save(update_fields=['avatar'])
        profile.refresh_from_db()

        avatar_url = ''
        if profile.avatar:
            avatar_url = request.build_absolute_uri(profile.avatar.url)

        return Response({"avatar": avatar_url}, status=status.HTTP_200_OK)


# ── 管理员接口 ────────────────────────────────────────────────

class AdminStatsView(APIView):
    """管理员统计面板"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        order_status_counts = {}
        for code, label in Order.STATUS_CHOICES:
            order_status_counts[code] = Order.objects.filter(status=code).count()
        total_revenue = Order.objects.filter(
            status__in=[Order.STATUS_COMPLETED, Order.STATUS_PENDING_RECEIPT]
        ).aggregate(total=Sum('price'))['total'] or 0
        return Response({
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "order_status_counts": order_status_counts,
            "total_revenue": str(total_revenue),
        })


class AdminUserListView(APIView):
    """管理员用户列表 & 搜索（用户名/邮箱/手机号）
    支持 ?search= 或 ?keyword= 参数"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        # 兼容 search 和 keyword 两种参数名
        keyword = (
            request.query_params.get('search', '') or
            request.query_params.get('keyword', '')
        ).strip()
        queryset = User.objects.all().order_by('-date_joined')
        if keyword:
            queryset = queryset.filter(
                Q(username__icontains=keyword) |
                Q(email__icontains=keyword) |
                Q(userprofile__phone__icontains=keyword)
            ).distinct()
        data = []
        for u in queryset:
            profile = getattr(u, 'userprofile', None)
            avatar_url = ''
            if profile and profile.avatar:
                try:
                    avatar_url = request.build_absolute_uri(profile.avatar.url)
                except Exception:
                    avatar_url = ''
            data.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "phone": profile.phone if profile else '',
                "avatar": avatar_url,
                "is_staff": u.is_staff,
                "is_active": u.is_active,
                "date_joined": u.date_joined,
            })
        return Response(data)
