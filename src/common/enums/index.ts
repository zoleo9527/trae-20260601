export enum UserRole {
  CLASS_TEACHER = 'class_teacher',
  CANTEEN_ADMIN = 'canteen_admin',
  PURCHASER = 'purchaser',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  SERVED = 'served',
}

export enum MealType {
  NORMAL = 'normal',
  SPECIAL = 'special',
}

export enum SpecialTagType {
  ALLERGY = 'allergy',
  RELIGION = 'religion',
  HEALTH = 'health',
  OTHER = 'other',
}

export enum SpecialTagStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REMOVED = 'removed',
}

export enum SummaryStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
}

export enum PurchaseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  RECEIVED = 'received',
}

export enum SampleMealType {
  LUNCH = 'lunch',
  DINNER = 'dinner',
}

export enum TimelineBusinessType {
  ORDER = 'order',
  SPECIAL_TAG = 'special_tag',
  SUMMARY = 'summary',
  PURCHASE = 'purchase',
  SAMPLE = 'sample',
}

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_CONFIRMED = 'order_confirmed',
  SPECIAL_TAG_ADDED = 'special_tag_added',
  SPECIAL_TAG_RISK = 'special_tag_risk',
  SUMMARY_CONFIRMED = 'summary_confirmed',
  PURCHASE_CREATED = 'purchase_created',
  SAMPLE_PENDING = 'sample_pending',
  DATA_OVERDUE = 'data_overdue',
}
