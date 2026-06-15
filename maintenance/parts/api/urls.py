from django.urls import path
from . import views

urlpatterns = [
    path('customers/', views.CustomerList.as_view({'get': 'list', 'post': 'create'}), name='customer-list'),
    path('customers/<int:pk>/', views.CustomerDetail.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='customer-detail'),
    
    path('surveys/', views.SiteSurveyList.as_view({'get': 'list', 'post': 'create'}), name='survey-list'),
    path('surveys/<int:pk>/', views.SiteSurveyDetail.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='survey-detail'),
    path('surveys/<int:pk>/complete/', views.CompleteSurvey.as_view({'post': 'create'}), name='survey-complete'),
    path('surveys/<int:pk>/items/', views.SurveyItemList.as_view({'get': 'list', 'post': 'create'}), name='survey-item-list'),
    path('surveys/<int:pk>/attachments/', views.SurveyAttachmentList.as_view({'get': 'list', 'post': 'create'}), name='survey-attachment-list'),
    path('surveys/<int:pk>/history/', views.SurveyHistory.as_view({'get': 'list'}), name='survey-history'),
    
    path('quotations/', views.QuotationList.as_view({'get': 'list', 'post': 'create'}), name='quotation-list'),
    path('quotations/<int:pk>/', views.QuotationDetail.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='quotation-detail'),
    path('quotations/<int:pk>/submit/', views.SubmitQuotation.as_view({'post': 'create'}), name='quotation-submit'),
    path('quotations/<int:pk>/approve/', views.ApproveQuotation.as_view({'post': 'create'}), name='quotation-approve'),
    path('quotations/<int:pk>/reject/', views.RejectQuotation.as_view({'post': 'create'}), name='quotation-reject'),
    path('quotations/<int:pk>/items/', views.QuotationItemList.as_view({'get': 'list', 'post': 'create'}), name='quotation-item-list'),
    path('quotations/<int:pk>/history/', views.QuotationHistory.as_view({'get': 'list'}), name='quotation-history'),
    
    path('dashboard/todo/', views.DashboardTodo.as_view({'get': 'list'}), name='dashboard-todo'),
    path('dashboard/risk/', views.DashboardRisk.as_view({'get': 'list'}), name='dashboard-risk'),
    path('dashboard/changes/', views.DashboardChanges.as_view({'get': 'list'}), name='dashboard-changes'),
]