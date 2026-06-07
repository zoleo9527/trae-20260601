package com.ktv.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ktv.dto.GiftVerificationDTO;
import com.ktv.dto.GiftVerificationQueryDTO;
import com.ktv.entity.GiftVerification;
import com.ktv.entity.GiftVerificationItem;
import com.ktv.vo.GiftVerificationDetailVO;
import java.math.BigDecimal;
import java.util.List;

public interface GiftVerificationService extends IService<GiftVerification> {
    Long createVerification(GiftVerificationDTO dto, Long userId);
    Page<GiftVerification> pageList(GiftVerificationQueryDTO query);
    List<GiftVerificationItem> getItems(Long verificationId);
    boolean approveVerification(Long verificationId, Long userId);
    boolean rejectVerification(Long verificationId, Long userId, String reason);
    GiftVerification getDetail(Long id);
    GiftVerificationDetailVO getDetailWithRelations(Long id);
    BigDecimal getBookingUsedAmount(Long bookingId);
    BigDecimal getBookingRemainingAmount(Long bookingId);
    List<GiftVerification> getTodayPending();
    List<GiftVerification> getTimeout();
    List<GiftVerification> getRecentlyRejected();
    boolean updateOutboundStatus(Long verificationId, String outboundStatus);
}
