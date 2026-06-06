from django.shortcuts import render
from .models import ForkliftWorkOrder, WorkOrderStatus, Role


def dashboard(request):
    stats = {
        'total': ForkliftWorkOrder.objects.count(),
        'pending_dispatch': ForkliftWorkOrder.objects.filter(status=WorkOrderStatus.PENDING_DISPATCH).count(),
        'in_progress': ForkliftWorkOrder.objects.filter(
            status__in=[WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS]
        ).count(),
        'pending_confirm': ForkliftWorkOrder.objects.filter(status=WorkOrderStatus.PENDING_CONFIRM).count(),
        'completed': ForkliftWorkOrder.objects.filter(status=WorkOrderStatus.COMPLETED).count(),
        'exception': ForkliftWorkOrder.objects.filter(status=WorkOrderStatus.EXCEPTION).count(),
    }

    todos = {
        'dispatcher': ForkliftWorkOrder.objects.filter(current_role=Role.DISPATCHER),
        'forklift_leader': ForkliftWorkOrder.objects.filter(current_role=Role.FORKLIFT_LEADER),
        'warehouse_clerk': ForkliftWorkOrder.objects.filter(current_role=Role.WAREHOUSE_CLERK),
    }

    recent_orders = ForkliftWorkOrder.objects.all()[:10]

    context = {
        'stats': stats,
        'todos': todos,
        'recent_orders': recent_orders,
        'status_choices': WorkOrderStatus.choices,
    }
    return render(request, 'dashboard.html', context)
