from django.contrib import admin
from .models import UserProfile, Address

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'is_verified']
    search_fields = ['user__username', 'phone']

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipient_name', 'phone', 'city', 'is_default']
    search_fields = ['user__username', 'recipient_name', 'phone']
    list_filter = ['is_default']
