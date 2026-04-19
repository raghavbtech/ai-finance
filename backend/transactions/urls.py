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
    path('incomes/', views.incomes, name='incomes'),
    path('incomes/<int:pk>/', views.delete_income, name='delete_income'),
    path('emis/', views.emis, name='emis'),
    path('emis/<int:pk>/', views.emi_detail, name='emi_detail'),
    path('upi/send/', views.upi_send, name='upi_send'),
    path('upi/receive/', views.upi_receive, name='upi_receive'),
    path('upi/request/', views.upi_request_money, name='upi_request_money'),
    path('upi/requests/incoming/', views.upi_incoming_requests, name='upi_incoming_requests'),
    path('upi/requests/mine/', views.upi_my_requests, name='upi_my_requests'),
    path('upi/requests/<int:pk>/respond/', views.upi_respond_request, name='upi_respond_request'),
    path('upi/history/', views.upi_history, name='upi_history'),
    path('upi/profile/', views.upi_profile, name='upi_profile'),
]

