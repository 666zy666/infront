from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(blank=True, max_length=11)),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/')),
                ('wechat_openid', models.CharField(blank=True, default=None, max_length=64, null=True, unique=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='auth.user')),
            ],
        ),
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient_name', models.CharField(max_length=50, verbose_name='收件人')),
                ('phone', models.CharField(max_length=20, verbose_name='联系电话')),
                ('province', models.CharField(blank=True, max_length=50, verbose_name='省份')),
                ('city', models.CharField(blank=True, max_length=50, verbose_name='城市')),
                ('district', models.CharField(blank=True, max_length=50, verbose_name='区县')),
                ('detail', models.CharField(max_length=200, verbose_name='详细地址')),
                ('is_default', models.BooleanField(default=False, verbose_name='是否默认')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='addresses', to='auth.user')),
            ],
            options={
                'verbose_name': '收货地址',
                'verbose_name_plural': '收货地址',
                'ordering': ['-is_default', '-created_at'],
            },
        ),
    ]
