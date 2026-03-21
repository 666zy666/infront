# store/views.py
from rest_framework import generics, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from .models import Category, Product, ProductImage, Favorite, Order, Banner
from .serializers import CategorySerializer, ProductSerializer, FavoriteSerializer, OrderSerializer, BannerSerializer
import uuid


# ── 状态值规范化辅助函数 ─────────────────────────────────────
# 前端 STATUS_TABS 使用大写形式（如 PENDING_PAYMENT），
# 后端数据库存储小写形式（如 pending_payment）。
# 这里统一处理两种形式，确保过滤正确。
_STATUS_NORM = {
    'PENDING_PAYMENT': Order.STATUS_PENDING_PAYMENT,
    'PENDING_RECEIPT': Order.STATUS_PENDING_RECEIPT,
    'COMPLETED': Order.STATUS_COMPLETED,
    'CANCELLED': Order.STATUS_CANCELLED,
    # 兼容旧值
    'pending': Order.STATUS_PENDING_PAYMENT,
    'paid': Order.STATUS_PENDING_RECEIPT,
    'shipped': Order.STATUS_PENDING_RECEIPT,
    # 已是小写的直接返回
    Order.STATUS_PENDING_PAYMENT: Order.STATUS_PENDING_PAYMENT,
    Order.STATUS_PENDING_RECEIPT: Order.STATUS_PENDING_RECEIPT,
    Order.STATUS_COMPLETED: Order.STATUS_COMPLETED,
    Order.STATUS_CANCELLED: Order.STATUS_CANCELLED,
}


def normalize_status(s):
    """将前端传来的状态值（大写或旧值）规范化为数据库存储的小写值"""
    return _STATUS_NORM.get(s, s) if s else s


# ── 商品 ─────────────────────────────────────────────────────

class ProductListCreate(generics.ListCreateAPIView):
    """
    GET  /api/store/products/        — 公开：仅上架商品；管理员：全部商品
    POST /api/store/products/        — 已登录用户发布商品
    支持 ?search= 关键词搜索
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        # 管理员可以看到所有商品（包含下架）
        if self.request.user.is_authenticated and self.request.user.is_staff:
            queryset = Product.objects.all()
        else:
            queryset = Product.objects.filter(is_active=True)

        # 关键词搜索（支持 search 和 keyword 两种参数）
        search = (
            self.request.query_params.get('search', '') or
            self.request.query_params.get('keyword', '')
        ).strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(brand__icontains=search) |
                Q(model_number__icontains=search) |
                Q(machinery_type__icontains=search) |
                Q(seller__username__icontains=search)
            )
        return queryset.order_by('-created_at')

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise PermissionDenied("请先登录")
        product = serializer.save(seller=self.request.user)
        images_data = self.request.FILES.getlist('images')
        for image in images_data:
            ProductImage.objects.create(product=product, image=image)


class ProductDetail(generics.RetrieveUpdateDestroyAPIView):
    """商品详情 / 修改 / 删除"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def update(self, request, *args, **kwargs):
        product = self.get_object()
        # 仅卖家本人或管理员可修改
        if not request.user.is_authenticated:
            raise PermissionDenied("请先登录")
        if product.seller != request.user and not request.user.is_staff:
            raise PermissionDenied("无权修改此商品")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        if not request.user.is_authenticated:
            raise PermissionDenied("请先登录")
        if product.seller != request.user and not request.user.is_staff:
            raise PermissionDenied("无权删除此商品")
        return super().destroy(request, *args, **kwargs)


class MyProductsView(APIView):
    """我发布的商品"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(seller=request.user).order_by('-created_at')
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


# ── 搜索 ──────────────────────────────────────────────────────

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ProductSearchView(generics.ListAPIView):
    """商品搜索（带分页）"""
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)

        keyword = self.request.query_params.get('keyword', '').strip()
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(description__icontains=keyword) |
                Q(brand__icontains=keyword) |
                Q(model_number__icontains=keyword) |
                Q(machinery_type__icontains=keyword)
            )

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        sort = self.request.query_params.get('sort', '-created_at')
        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    def get_serializer_context(self):
        return {'request': self.request}


# ── 收藏 ──────────────────────────────────────────────────────

class FavoriteCreateView(generics.CreateAPIView):
    """收藏商品"""
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        product_id = self.request.data.get('product')
        product = get_object_or_404(Product, id=product_id)
        if Favorite.objects.filter(user=self.request.user, product=product).exists():
            raise serializers.ValidationError("已收藏")
        serializer.save(user=self.request.user, product=product)


class FavoriteDeleteView(generics.DestroyAPIView):
    """取消收藏"""
    queryset = Favorite.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        product_id = self.kwargs['product_id']
        return get_object_or_404(Favorite, user=self.request.user, product_id=product_id)


class FavoriteListView(generics.ListAPIView):
    """我的收藏列表"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_context(self):
        return {'request': self.request}


# ── 订单 ──────────────────────────────────────────────────────

class MyOrdersView(APIView):
    """买家订单列表，支持状态筛选（接受大写或小写状态值）"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Order.objects.filter(buyer=request.user).order_by('-created_at')
        order_status = request.query_params.get('status', '').strip()
        if order_status:
            queryset = queryset.filter(status=normalize_status(order_status))
        serializer = OrderSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class SellerOrdersView(APIView):
    """卖家订单列表，支持状态筛选"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Order.objects.filter(seller=request.user).order_by('-created_at')
        order_status = request.query_params.get('status', '').strip()
        if order_status:
            queryset = queryset.filter(status=normalize_status(order_status))
        serializer = OrderSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class OrderCreateView(APIView):
    """
    GET  /api/store/orders/  — 管理员：所有订单；普通用户：403
    POST /api/store/orders/  — 创建订单
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """管理员查看所有订单（前端 admin.js 使用此接口）"""
        if not request.user.is_staff:
            return Response({"detail": "需要管理员权限"}, status=status.HTTP_403_FORBIDDEN)

        order_status = request.query_params.get('status', '').strip()
        search = (
            request.query_params.get('search', '') or
            request.query_params.get('keyword', '')
        ).strip()
        queryset = Order.objects.all().order_by('-created_at')
        if order_status:
            queryset = queryset.filter(status=normalize_status(order_status))
        if search:
            queryset = queryset.filter(
                Q(buyer__username__icontains=search) |
                Q(seller__username__icontains=search) |
                Q(product__title__icontains=search)
            )
        serializer = OrderSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """买家下单"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"detail": "缺少product_id"}, status=400)
        product = get_object_or_404(Product, id=product_id)
        if product.seller == request.user:
            return Response({"detail": "不能购买自己的商品"}, status=400)
        if not product.is_active:
            return Response({"detail": "商品已下架"}, status=400)
        order = Order.objects.create(
            buyer=request.user,
            seller=product.seller,
            product=product,
            price=product.price
        )
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data, status=201)


class OrderUpdateView(APIView):
    """
    GET   /api/store/orders/<pk>/  — 买家或卖家或管理员查看订单详情
    PATCH /api/store/orders/<pk>/  — 卖家处理订单（发货/完成/取消）；管理员也可操作
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.is_staff:
            order = get_object_or_404(Order, pk=pk)
        else:
            order = get_object_or_404(
                Order.objects.filter(Q(buyer=request.user) | Q(seller=request.user)),
                pk=pk
            )
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        # 卖家本人或管理员可操作
        if request.user.is_staff:
            order = get_object_or_404(Order, pk=pk)
        else:
            order = get_object_or_404(Order, pk=pk, seller=request.user)

        action = request.data.get('action')
        if action == 'ship':
            if order.status not in (Order.STATUS_PENDING_RECEIPT, Order.STATUS_PENDING_PAYMENT):
                return Response({"detail": "当前状态不可发货"}, status=400)
            order.status = Order.STATUS_PENDING_RECEIPT
            order.shipped_at = timezone.now()
            order.shipping_company = request.data.get('shipping_company') or order.shipping_company
            order.tracking_number = request.data.get('tracking_number') or order.tracking_number
        elif action == 'complete':
            order.status = Order.STATUS_COMPLETED
            order.completed_at = timezone.now()
        elif action == 'cancel':
            order.status = Order.STATUS_CANCELLED
        else:
            return Response({"detail": "无效操作，支持 ship / complete / cancel"}, status=400)
        order.save()
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)


# ── 用户侧订单动作 ────────────────────────────────────────────

class SimulatePayView(APIView):
    """模拟支付（旧版兼容接口，新版请使用 /orders/<pk>/pay/）"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"detail": "缺少 order_id"}, status=400)

        order = get_object_or_404(Order, id=order_id, buyer=request.user)
        if order.status not in (Order.STATUS_PENDING_PAYMENT, 'pending'):
            return Response({"detail": "仅待付款订单可以支付"}, status=400)

        order.status = Order.STATUS_PENDING_RECEIPT
        order.paid_at = timezone.now()
        order.transaction_id = f"SIM-{uuid.uuid4().hex[:16]}"
        order.save()

        serializer = OrderSerializer(order, context={'request': request})
        return Response({
            "code": 0,
            "msg": "支付成功（模拟）",
            "data": serializer.data
        })


class OrderPayView(APIView):
    """订单支付：PENDING_PAYMENT → PENDING_RECEIPT"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, buyer=request.user)
        if order.status != Order.STATUS_PENDING_PAYMENT:
            return Response(
                {"detail": f"当前订单状态为「{order.get_status_display()}」，无法支付"},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = Order.STATUS_PENDING_RECEIPT
        order.paid_at = timezone.now()
        order.transaction_id = f"SIM-{uuid.uuid4().hex[:16]}"
        order.save()
        serializer = OrderSerializer(order, context={'request': request})
        return Response({"detail": "支付成功", "data": serializer.data})


class OrderCancelView(APIView):
    """取消订单：买家可取消待付款或待收货订单"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, buyer=request.user)
        if order.status not in (Order.STATUS_PENDING_PAYMENT, Order.STATUS_PENDING_RECEIPT):
            return Response(
                {"detail": f"当前订单状态为「{order.get_status_display()}」，无法取消"},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = Order.STATUS_CANCELLED
        order.save()
        serializer = OrderSerializer(order, context={'request': request})
        return Response({"detail": "订单已取消", "data": serializer.data})


class OrderConfirmView(APIView):
    """确认收货：PENDING_RECEIPT → COMPLETED"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, buyer=request.user)
        if order.status != Order.STATUS_PENDING_RECEIPT:
            return Response(
                {"detail": f"当前订单状态为「{order.get_status_display()}」，无法确认收货"},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = Order.STATUS_COMPLETED
        order.completed_at = timezone.now()
        order.save()
        serializer = OrderSerializer(order, context={'request': request})
        return Response({"detail": "确认收货成功，订单已完成", "data": serializer.data})


# ── 分类 & 轮播图 ─────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    """分类列表"""
    queryset = Category.objects.filter(parent=None)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class BannerListView(generics.ListAPIView):
    """轮播图列表"""
    queryset = Banner.objects.filter(is_active=True).order_by('order')
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}
