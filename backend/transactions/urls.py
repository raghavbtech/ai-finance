from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .csv_upload import upload_csv

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('transactions/', views.transactions, name='transactions'),
    path('transactions/<int:pk>/', views.delete_transaction, name='delete_transaction'),
    path('upload-csv/', upload_csv, name='upload_csv'),
    path('budget-alert/', views.budget_alert, name='budget_alert'),
]
