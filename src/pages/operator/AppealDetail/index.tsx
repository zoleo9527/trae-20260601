  const handleArbitrate = () => {
    if (!remark) {
      message.warning('请填写仲裁说明');
      return;
    }

    const currentTime = getCurrentTime();
    const action = decision === 'support' ? '支持申诉' : '驳回申诉';
    const newAppealStatus = decision === 'support' ? 'resolved' : 'rejected';

    const appealRecord: HistoryRecord = {
      time: currentTime,
      role: '运营',
      operator: '吴九',
      action: '仲裁结果',
      remark: `${action}：${remark}`,
    };

    addHistoryRecord('appeal', appeal.id, appealRecord);
    updateAppeal({
      id: appeal.id,
      status: newAppealStatus,
      updatedAt: currentTime,
    });

    const settlement = settlements.find((s) => s.id === appeal.settlementId);
    if (settlement) {
      const newSettlementStatus = decision === 'support' ? 'rejected' : 'completed';
      const settlementRecord: HistoryRecord = {
        time: currentTime,
        role: '运营',
        operator: '吴九',
        action: '仲裁结果',
        remark: decision === 'support' 
          ? `申诉已支持，撤销结算：${remark}` 
          : `申诉已驳回，恢复结算：${remark}`,
      };

      addHistoryRecord('settlement', settlement.id, settlementRecord);
      updateSettlement({
        id: settlement.id,
        status: newSettlementStatus,
        updatedAt: currentTime,
      });
    }

    setShowModal(false);
    message.success(`仲裁完成：${action}`);
    setTimeout(() => {
      handleNext();
    }, 1500);
  };