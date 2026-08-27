from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_systemauditlog_patientprofile_age_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="dietplan",
            name="plan_data",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="dietplan",
            name="status",
            field=models.CharField(default="DRAFT", max_length=20),
        ),
        migrations.AddField(
            model_name="dietplan",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]