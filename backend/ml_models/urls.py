from django.urls import path
from . import views

urlpatterns = [
    path('anomalies/', views.anomalies, name='anomalies'),
    path('predictions/', views.predictions, name='predictions'),
    path('dashboard-summary/', views.dashboard_summary, name='dashboard_summary'),
    path('health-score/', views.health_score, name='health_score'),
    path('financial-summary/', views.financial_summary, name='financial_summary'),
    # AI enhancement endpoints
    path('ai/advisor/', views.ai_advisor, name='ai_advisor'),
    path('ai/anomalies/', views.ai_anomalies, name='ai_anomalies'),
    path('ai/health-score/', views.ai_health_score, name='ai_health_score'),
    path('ai/query/', views.ai_query, name='ai_query'),
]

