import os, django, datetime
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from decimal import Decimal
from rental.models import RentalOrder, FeeSettlement
from rental.services import ExtensionService, SettlementService

order = RentalOrder.objects.get(order_no='RN-2026-0004')
s = order.fee_settlement
print(f'RN-2026-0004 当前结算:')
print(f'  base={s.base_fee} ext={s.extension_fee} dmg={s.damage_fee} total={s.total_fee}')

ext = ExtensionService.request_extension(
    rental_order_id=order.id,
    requested_end_date=order.current_end_date + datetime.timedelta(days=2),
    reason='追加延期2天验证重算',
)
print(f'  追加延期: fee_delta={ext.fee_delta}')

ExtensionService.approve_extension(ext.id, operator_role='manager', review_note='同意')

s.refresh_from_db()
print(f'  重算后: base={s.base_fee} ext={s.extension_fee} total={s.total_fee}')

base_expected = (order.original_end_date - order.start_date).days * order.equipment.daily_rate
ext_expected = sum(e.fee_delta for e in order.extensions.filter(status='approved'))
print(f'  验证: base期望={base_expected} ext期望={ext_expected}')
print(f'  base一致={float(s.base_fee)==float(base_expected)} ext一致={float(s.extension_fee)==float(ext_expected)}')
