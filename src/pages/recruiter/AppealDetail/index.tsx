  const handleAddEvidence = () => {
    if (!remark) {
      message.warning('请填写说明内容');
      return;
    }

    const currentTime = getCurrentTime();
    const newEvidence: Evidence = {
      role: '招聘顾问',
      files: files.length > 0 ? files : ['补充说明材料.pdf'],
      description: remark,
    };

    const appealRecord: HistoryRecord = {
      time: currentTime,
      role: '招聘顾问',
      operator: appeal.recruiterName,
      action: '补充说明',
      remark: remark,
    };

    addHistoryRecord('appeal', appeal.id, appealRecord);
    updateAppeal({
      id: appeal.id,
      evidence: [...appeal.evidence, newEvidence],
      status: 'pending_operator_arbitration',
      updatedAt: currentTime,
    });

    if (settlement) {
      const settlementRecord: HistoryRecord = {
        time: currentTime,
        role: '招聘顾问',
        operator: appeal.recruiterName,
        action: '申诉补充说明',
        remark: `针对申诉补充说明：${remark}`,
      };
      addHistoryRecord('settlement', settlement.id, settlementRecord);
    }

    setRemark('');
    setFiles([]);
    message.success('补充说明已提交，等待运营仲裁');
  };