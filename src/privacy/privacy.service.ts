import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { PrivacyConsent } from './entities/privacy-consent.entity';
import { IntakeOrder } from '../intake/entities/intake-order.entity';
import { SignConsentDto } from './dto/sign-consent.dto';
import { ConsentQueryDto } from './dto/consent-query.dto';
import { User } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { IntakeStatus } from '../common/enums/intake-status.enum';
import { OperationLogService } from '../common/services/operation-log.service';

@Injectable()
export class PrivacyService {
  constructor(
    @InjectRepository(PrivacyConsent)
    private readonly consentRepo: Repository<PrivacyConsent>,
    @InjectRepository(IntakeOrder)
    private readonly intakeRepo: Repository<IntakeOrder>,
    private readonly logService: OperationLogService,
  ) {}

  async findByOrderId(orderId: string) {
    const consent = await this.consentRepo.findOne({
      where: { orderId },
      relations: ['order', 'witness'],
    });
    if (!consent) {
      throw new BusinessException(ErrorCode.CONSENT_NOT_FOUND);
    }
    return consent;
  }

  async sign(orderId: string, dto: SignConsentDto, witness: User) {
    const consent = await this.consentRepo.findOne({
      where: { orderId },
      relations: ['order'],
    });
    if (!consent) {
      throw new BusinessException(ErrorCode.CONSENT_NOT_FOUND);
    }
    if (consent.isSigned) {
      throw new BusinessException(ErrorCode.CONSENT_ALREADY_SIGNED);
    }

    consent.customerSignature = dto.customerSignature;
    consent.customerName = dto.customerName;
    consent.consentItems = dto.consentItems;
    consent.isSigned = true;
    consent.witness = witness;
    consent.signedAt = new Date();

    const savedConsent = await this.consentRepo.save(consent);

    if (consent.order && consent.order.status === IntakeStatus.WAITING_CONSENT) {
      consent.order.status = IntakeStatus.CONSENT_SIGNED;
      await this.intakeRepo.save(consent.order);
    }

    await this.logService.record(
      'PrivacyConsent',
      savedConsent.id,
      'sign',
      witness,
      null,
      savedConsent,
      { orderId },
    );

    return savedConsent;
  }

  async findAll(query: ConsentQueryDto) {
    const qb = this.consentRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.order', 'o')
      .leftJoinAndSelect('c.witness', 'w');

    if (query.keyword) {
      qb.andWhere(
        new Brackets((sq) => {
          sq.where('c.customerName LIKE :kw', { kw: `%${query.keyword}%` })
            .orWhere('o.customerPhone LIKE :kw', { kw: `%${query.keyword}%` });
        }),
      );
    }
    if (query.orderNo) {
      qb.andWhere('o.orderNo = :orderNo', { orderNo: query.orderNo });
    }
    if (query.isSigned !== undefined) {
      qb.andWhere('c.isSigned = :isSigned', { isSigned: query.isSigned });
    }

    qb.orderBy('c.createdAt', 'DESC');
    return qb.getMany();
  }

  async revoke(id: string, reason: string, operator: User) {
    const consent = await this.consentRepo.findOne({ where: { id } });
    if (!consent) {
      throw new BusinessException(ErrorCode.CONSENT_NOT_FOUND);
    }

    const oldValue = { ...consent };
    consent.isSigned = false;
    consent.revokeReason = reason;
    consent.revokedAt = new Date();
    const saved = await this.consentRepo.save(consent);

    await this.logService.record(
      'PrivacyConsent',
      id,
      'revoke',
      operator,
      oldValue,
      saved,
      { reason },
    );

    return saved;
  }

  async getConsentTemplate() {
    return {
      title: '手机维修隐私授权同意书',
      sections: [
        {
          title: '一、数据访问授权',
          content: '同意维修人员在维修过程中访问您的手机数据以完成故障诊断和维修操作。维修人员承诺仅用于维修目的，不对外泄露。',
          required: true,
          key: 'allowDataAccess',
        },
        {
          title: '二、照片/影像存档',
          content: '如需拆机检测，我们会对手机外观及重要部件进行拍照存档。维修完成后您可申请删除存档照片。',
          required: false,
          key: 'allowPhotoBackup',
        },
        {
          title: '三、联系方式授权',
          content: '同意我们在维修过程中及完成后，通过电话或微信与您联系，告知维修进度和取机信息。',
          required: true,
          key: 'allowContactRepair',
        },
        {
          title: '四、第三方信息披露',
          content: '如涉及保险理赔、官方保修等，同意将必要的维修信息提供给相关第三方机构。',
          required: false,
          key: 'allowDisclosure',
        },
      ],
      signature: {
        customer: '客户签名',
        witness: '见证人（店员）',
      },
    };
  }
}
