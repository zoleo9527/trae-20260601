from datetime import datetime, date, timedelta
from typing import List, Optional


def get_status_color(status: str) -> str:
    status_colors = {
        '招聘中': '#27ae60',
        '暂停': '#f39c12',
        '已关闭': '#95a5a6',
        '已过期': '#e74c3c',
        '待面试': '#3498db',
        '已面试': '#9b59b6',
        '爽约': '#e74c3c',
        '已取消': '#95a5a6',
        '通过': '#27ae60',
        '未通过': '#e74c3c',
        '待处理': '#e74c3c',
        '已核实': '#27ae60',
        '已驳回': '#e74c3c',
        '已归档': '#95a5a6',
        '稳定期中': '#3498db',
        '已完成': '#27ae60',
        '提前离职': '#e74c3c',
        '风险预警': '#e67e22',
    }
    return status_colors.get(status, '#95a5a6')


def format_date(d: Optional[date]) -> str:
    if d is None:
        return '-'
    return d.strftime('%Y-%m-%d')


def format_datetime(dt: Optional[datetime]) -> str:
    if dt is None:
        return '-'
    return dt.strftime('%Y-%m-%d %H:%M')


def calculate_days_diff(start_date: date, end_date: Optional[date] = None) -> int:
    if end_date is None:
        end_date = date.today()
    return (end_date - start_date).days


def get_stability_progress(current_days: int, total_days: int) -> float:
    if total_days <= 0:
        return 0.0
    return min(100.0, (current_days / total_days) * 100)


def is_overdue(d: Optional[date]) -> bool:
    if d is None:
        return False
    return d < date.today()


def get_next_check_date(onboarding_date: date, stability_days: int, check_interval: int = 7) -> date:
    days_passed = calculate_days_diff(onboarding_date)
    checks_done = days_passed // check_interval
    next_check = onboarding_date + timedelta(days=(checks_done + 1) * check_interval)
    if next_check > onboarding_date + timedelta(days=stability_days):
        return onboarding_date + timedelta(days=stability_days)
    return next_check