from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='分类名称')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='store.category')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Banner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=100, verbose_name='标题')),
                ('image', models.ImageField(upload_to='banners/%Y/%m/%d/', verbose_name='轮播图')),
                ('link', models.CharField(blank=True, max_length=255, null=True, verbose_name='跳转链接')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='排序（越小越靠前）')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否显示')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': '轮播图',
                'verbose_name_plural': '轮播图',
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='标题')),
                ('description', models.TextField(blank=True, verbose_name='描述')),
                ('price', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='价格')),
                ('machinery_type', models.CharField(blank=True, max_length=50, verbose_name='设备类型')),
                ('brand', models.CharField(blank=True, max_length=100, verbose_name='品牌')),
                ('model_number', models.CharField(blank=True, max_length=100, verbose_name='型号')),
                ('manufacture_year', models.IntegerField(blank=True, null=True, verbose_name='出厂年份')),
                ('working_hours', models.IntegerField(blank=True, null=True, verbose_name='工作小时')),
                ('location_province', models.CharField(blank=True, max_length=50, verbose_name='省份')),
                ('location_city', models.CharField(blank=True, max_length=50, verbose_name='城市')),
                ('condition_level', models.CharField(blank=True, max_length=10, verbose_name='成色')),
                ('contact_type', models.CharField(blank=True, choices=[('phone', '手机号'), ('wechat', '微信号')], max_length=20, null=True, verbose_name='联系方式类型')),
                ('contact_value', models.CharField(blank=True, max_length=100, null=True, verbose_name='联系方式值')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否上架')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('seller', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to='auth.user')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='store.category')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProductImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='products/%Y/%m/%d/', verbose_name='图片')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='store.product')),
            ],
        ),
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='auth.user')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='store.product')),
            ],
            options={
                'verbose_name': '收藏',
                'verbose_name_plural': '收藏',
                'unique_together': {('user', 'product')},
            },
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('status', models.CharField(
                    choices=[
                        ('pending_payment', '待付款'),
                        ('pending_receipt', '待收货'),
                        ('completed', '已完成'),
                        ('cancelled', '已取消'),
                        ('pending', '待支付'),
                        ('paid', '已支付'),
                        ('shipped', '已发货'),
                    ],
                    default='pending_payment',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('shipped_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('transaction_id', models.CharField(blank=True, max_length=100, null=True)),
                ('tracking_number', models.CharField(blank=True, max_length=100, null=True, verbose_name='物流单号')),
                ('shipping_company', models.CharField(blank=True, max_length=100, null=True, verbose_name='物流公司')),
                ('buyer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders_bought', to='auth.user')),
                ('seller', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders_sold', to='auth.user')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='store.product')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
