from django.contrib import admin
from .models import Product, Category, ProductImage, Banner, Order


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'seller', 'price', 'is_active', 'created_at']
    list_filter = ['is_active', 'machinery_type']
    search_fields = ['title', 'brand', 'seller__username']
    list_editable = ['is_active']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'uploaded_at']


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'order', 'is_active']
    list_editable = ['order', 'is_active']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'seller', 'product', 'price', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['buyer__username', 'seller__username']
