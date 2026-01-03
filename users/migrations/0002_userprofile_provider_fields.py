from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='base_hourly_rate',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=8),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='online_rate_multiplier',
            field=models.DecimalField(decimal_places=2, default=Decimal('1.20'), max_digits=4),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='provider_mode',
            field=models.CharField(choices=[('online', 'Online / Remote'), ('offline', 'Offline / On-site')], default='offline', max_length=10),
        ),
    ]

