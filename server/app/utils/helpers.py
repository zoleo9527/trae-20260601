import random
import string
from datetime import datetime


def gen_visit_no() -> str:
    now = datetime.now()
    rand = "".join(random.choices(string.digits, k=4))
    return f"V{now.strftime('%Y%m%d%H%M%S')}{rand}"


def gen_subscription_no() -> str:
    now = datetime.now()
    rand = "".join(random.choices(string.digits, k=4))
    return f"S{now.strftime('%Y%m%d%H%M%S')}{rand}"
