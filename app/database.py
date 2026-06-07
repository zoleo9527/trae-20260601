import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional


class InMemoryDB:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._data = {
                "users": [],
                "stores": [],
                "products": [],
                "store_orders": [],
                "deliveries": [],
                "order_logs": [],
                "export_tasks": [],
            }
        return cls._instance

    def get_all(self, table: str) -> List[Dict]:
        return self._data.get(table, [])

    def get_by_id(self, table: str, item_id: str) -> Optional[Dict]:
        items = self._data.get(table, [])
        for item in items:
            if item.get("id") == item_id:
                return item
        return None

    def add(self, table: str, item: Dict) -> Dict:
        if "id" not in item:
            item["id"] = str(uuid.uuid4())
        if "created_at" not in item:
            item["created_at"] = datetime.now().isoformat()
        if "updated_at" not in item:
            item["updated_at"] = datetime.now().isoformat()
        self._data[table].append(item)
        return item

    def update(self, table: str, item_id: str, updates: Dict) -> Optional[Dict]:
        items = self._data.get(table, [])
        for i, item in enumerate(items):
            if item.get("id") == item_id:
                updates["updated_at"] = datetime.now().isoformat()
                items[i].update(updates)
                return items[i]
        return None

    def delete(self, table: str, item_id: str) -> bool:
        items = self._data.get(table, [])
        for i, item in enumerate(items):
            if item.get("id") == item_id:
                items.pop(i)
                return True
        return False

    def query(self, table: str, filters: Dict = None) -> List[Dict]:
        items = self._data.get(table, [])
        if not filters:
            return items
        result = []
        for item in items:
            match = True
            for k, v in filters.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                result.append(item)
        return result


db = InMemoryDB()


def init_db():
    from app.sample_data import populate_sample_data
    populate_sample_data()
