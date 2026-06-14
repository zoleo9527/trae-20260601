#!/bin/bash
# ============================================================
# 司法鉴定-排期与补样通知 真实样例演示脚本
#   流程A：顺利流（SFJD-2026-0101 待质控 → 质控通过 → 归档）
#   流程B：问题流（SFJD-2026-0102 发起补样 → 补样完成 → 重排期 → 再鉴定 → 质控退回 → 修改再提交 → 归档）
#   流程C：归档流回看（SFJD-2026-0050 已归档案件的完整链路）
# ============================================================
set -e
BASE="http://127.0.0.1:8080/api"
SEP="============================================================"
CURL="curl -s -H 'Content-Type: application/json'"

echo_ok()   { echo -e "\033[32m✓ $1\033[0m"; }
echo_warn() { echo -e "\033[33m! $1\033[0m"; }
echo_h1()   { echo -e "\n\033[1;36m$SEP\n$1\n$SEP\033[0m"; }
echo_h2()   { echo -e "\n\033[1;34m--- $1 ---\033[0m"; }

json_val() { python3 -c "import sys,json;d=json.load(sys.stdin);$2" <<<"$1" 2>/dev/null || echo ""; }

# ---------- 0. 人员列表 ----------
echo_h1 "第0步：人员列表（用于后续 operator_account）"
R=$(eval $CURL $BASE/users)
echo "$R" | python3 -m json.tool

# ---------- 1. 三个角色的待办 ----------
echo_h1 "第1步：三个角色当前的待办（种子数据初始化后）"
for r in clerk expert qc; do
  echo_h2 "角色=$r 的待办列表"
  R=$(eval $CURL "$BASE/todo?role=$r")
  echo "$R" | python3 -m json.tool 2>/dev/null | head -60
done

# ============================================================
# 流程A：顺利流 —— SFJD-2026-0101 当前是 pending_qc
# ============================================================
echo_h1 "流程A：顺利流 —— SFJD-2026-0101 笔迹鉴定（待质控 → 质控通过 → 归档）"
R=$(eval $CURL "$BASE/records?case_no=SFJD-2026-0101")
ID_A=$(echo "$R" | python3 -c "import sys,json;l=json.load(sys.stdin).get('data',[]);print(l[0]['id'] if l else '')" 2>/dev/null)
echo_ok "案件ID=$ID_A"

echo_h2 "A1. 质控审核前，先看详情（排期、状态链、备注链全量）"
eval $CURL "$BASE/record/$ID_A" | python3 -m json.tool | head -100

echo_h2 "A2. 质控审核通过并归档（账号 qc_zhao）"
BODY=$(cat <<EOF
{"record_id":$ID_A,"target_status":"archived","reason":"公式规范，结果区间合理，意见书完整，同意出具","comment":"同意归档，卷宗齐备","operator_account":"qc_zhao"}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/status)
echo "$R" | python3 -m json.tool | head -80

echo_h2 "A3. 归档后再看详情（意见书定稿、归档号、归档日期）"
eval $CURL "$BASE/record/$ID_A" | python3 -m json.tool | head -60

# ============================================================
# 流程B：问题流 —— SFJD-2026-0102 指印鉴定（已在 need_supplement，走完整的补样→重排→鉴定→质控→退回→再提→归档）
# ============================================================
echo_h1 "流程B：问题流 —— SFJD-2026-0102 指印同一性鉴定（完整补样链路）"
R=$(eval $CURL "$BASE/records?case_no=SFJD-2026-0102")
ID_B=$(echo "$R" | python3 -c "import sys,json;l=json.load(sys.stdin).get('data',[]);print(l[0]['id'] if l else '')" 2>/dev/null)
echo_ok "案件ID=$ID_B"

echo_h2 "B0. 看当前详情（排期备注是如何被补样通知承接的）"
eval $CURL "$BASE/record/$ID_B" | python3 -m json.tool | head -120

echo_h2 "B0-1. 补样通知回看（/api/supplement?record_id=xxx）"
eval $CURL "$BASE/supplement?record_id=$ID_B" | python3 -m json.tool

echo_h2 "B1. 受理员补样完成（账号 clerk_li，拿到 notice_id 再提交）"
R=$(eval $CURL "$BASE/supplement?record_id=$ID_B")
NID=$(echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin).get('data',{});l=d.get('notices',[]);print(l[0]['id'] if l else '')" 2>/dev/null)
echo_ok "补样通知ID=$NID"
BODY=$(cat <<EOF
{"notice_id":$NID,"replenish_remark":"已补充右手十指指印样本6枚，同期签名样本8份，检材复制品原件","operator_account":"clerk_li"}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/supplement/complete)
echo "$R" | python3 -m json.tool | head -60

echo_h2 "B2. 受理员重排期（is_re_schedule=true，账号 clerk_li → 分配给张鉴定）"
BODY=$(cat <<EOF
{"record_id":$ID_B,"schedule_date":"2026-06-17","schedule_remark":"补样齐全：新指印样本6枚特征清晰，可重新开始鉴定；原检材墨迹污染区仍需注意处理","assigned_expert_id":2,"operator_account":"clerk_li","is_re_schedule":true}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/schedule)
echo "$R" | python3 -m json.tool | head -80

echo_h2 "B3. 鉴定人开始鉴定（expert_zhang，状态 in_progress）"
BODY=$(cat <<EOF
{"record_id":$ID_B,"target_status":"in_progress","comment":"补样的6枚指印细节特征充分，可以对比","operator_account":"expert_zhang"}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/status)
echo "$R" | python3 -m json.tool | head -40

echo_h2 "B4. 鉴定人提交质控（必须带鉴定意见书草稿）"
BODY=$(cat <<EOF
{"record_id":$ID_B,"target_status":"pending_qc","comment":"补样后比对：18个细节特征点一致，结论充分","opinion_draft":"检材合同落款处指印与被鉴定人刘某右手拇指指印样本为同一人所留","operator_account":"expert_zhang"}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/status)
echo "$R" | python3 -m json.tool | head -60

echo_h2 "B5. 质控故意退回（qc_zhao，必须填退回原因 —— 模拟问题流）"
BODY=$(cat <<EOF
{"record_id":$ID_B,"target_status":"rejected_qc","reject_reason":"鉴定意见书草稿未标注特征点编号对应关系，补充特征比对表后重新提交","comment":"退回修改：需附特征比对表","operator_account":"qc_zhao"}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/status)
echo "$R" | python3 -m json.tool | head -60

echo_h2 "B6. 鉴定人修改后再次提交质控"
BODY=$(cat <<EOF
{"record_id":$ID_B,"target_status":"pending_qc","comment":"已补充特征比对表（18个特征点均标注编号对应），意见书调整措辞","opinion_draft":"检材合同落款处指印与被鉴定人刘某右手拇指指印样本为同一人所留（特征比对表见附件1）","operator_account":"expert_zhang"}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/status)
echo "$R" | python3 -m json.tool | head -60

echo_h2 "B7. 质控通过归档"
BODY=$(cat <<EOF
{"record_id":$ID_B,"target_status":"archived","reason":"补样后鉴定过程规范，退回修改已到位，意见书完整","comment":"同意归档","operator_account":"qc_zhao"}
EOF
)
R=$(eval $CURL -X POST -d "'$BODY'" $BASE/status)
echo "$R" | python3 -m json.tool | head -60

echo_h2 "B8. 最终详情（状态链+备注链+补样链 完整）"
eval $CURL "$BASE/record/$ID_B" | python3 -m json.tool | head -160

# ============================================================
# 流程C：归档流回看 —— SFJD-2026-0050 已归档
# ============================================================
echo_h1 "流程C：归档流回看 —— SFJD-2026-0050 车速与碰撞痕迹鉴定"
R=$(eval $CURL "$BASE/records?case_no=SFJD-2026-0050")
ID_C=$(echo "$R" | python3 -c "import sys,json;l=json.load(sys.stdin).get('data',[]);print(l[0]['id'] if l else '')" 2>/dev/null)
echo_ok "案件ID=$ID_C"

echo_h2 "C1. 全量详情 —— 可回溯：排期→鉴定→质控→归档 每一步的状态、操作人、备注"
eval $CURL "$BASE/record/$ID_C" | python3 -m json.tool

# ============================================================
# 最后：各角色再看待办（应该基本清空，或只剩流程B中的已归档）
# ============================================================
echo_h1 "最后：三个角色的待办（流程走完后的现状）"
for r in clerk expert qc; do
  echo_h2 "角色=$r 的待办"
  eval $CURL "$BASE/todo?role=$r" | python3 -m json.tool 2>/dev/null
done

echo ""
echo_ok "=== 三条真实样例流程全部演示完成 ==="
