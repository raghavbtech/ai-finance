from django.urls import path
from . import views

urlpatterns = [
    path('anomalies/', views.anomalies, name='anomalies'),
    path('predictions/', views.predictions, name='predictions'),
    path('dashboard-summary/', views.dashboard_summary, name='dashboard_summary'),
]
