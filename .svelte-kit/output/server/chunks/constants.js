const TIME_SLOTS = [
  { value: "18:00-20:00", label: "晚间 (18:00-20:00)" },
  { value: "20:00-22:00", label: "黄金档 (20:00-22:00)" },
  { value: "22:00-00:00", label: "深夜 (22:00-00:00)" },
  { value: "00:00-02:00", label: "凌晨 (00:00-02:00)" }
];
const TIME_SLOT_LABELS = {
  "18:00-20:00": "晚间 (18:00-20:00)",
  "20:00-22:00": "黄金档 (20:00-22:00)",
  "22:00-00:00": "深夜 (22:00-00:00)",
  "00:00-02:00": "凌晨 (00:00-02:00)",
  "morning": "上午 (10:00-14:00)",
  "afternoon": "下午 (14:00-18:00)",
  "evening": "晚间 (18:00-22:00)",
  "night": "深夜 (22:00-02:00)"
};
const STAGE_LABELS = {
  "main": "主舞台",
  "secondary": "副舞台",
  "outdoor": "户外舞台",
  "vip": "VIP区",
  "lounge": "休息区"
};
function getTimeSlotLabel(slot) {
  return TIME_SLOT_LABELS[slot] || slot;
}
function getStageLabel(stage) {
  return STAGE_LABELS[stage] || stage;
}
export {
  TIME_SLOTS as T,
  getTimeSlotLabel as a,
  getStageLabel as g
};
