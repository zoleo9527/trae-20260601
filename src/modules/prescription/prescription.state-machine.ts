import { Injectable } from '@nestjs/common';
import { BaseStateMachine, StateTransition } from '../../common/state-machine/base-state-machine';
import { ErrorCode } from '../../common/error-codes';
import { PrescriptionStatus, PrescriptionAction, UserRole } from './prescription.enum';

@Injectable()
export class PrescriptionStateMachine extends BaseStateMachine<PrescriptionStatus, PrescriptionAction> {
  protected entityName = '处方';
  protected invalidTransitionCode = ErrorCode.PRESCRIPTION_INVALID_TRANSITION;

  protected transitions: StateTransition<PrescriptionStatus, PrescriptionAction>[] = [
    {
      from: [PrescriptionStatus.DRAFT],
      to: PrescriptionStatus.SUBMITTED,
      action: PrescriptionAction.SUBMIT,
      allowedRoles: [UserRole.STAFF],
    },
    {
      from: [PrescriptionStatus.SUBMITTED],
      to: PrescriptionStatus.REVIEWING,
      action: PrescriptionAction.REVIEW,
      allowedRoles: [UserRole.PHARMACIST],
    },
    {
      from: [PrescriptionStatus.REVIEWING],
      to: PrescriptionStatus.APPROVED,
      action: PrescriptionAction.APPROVE,
      allowedRoles: [UserRole.PHARMACIST],
    },
    {
      from: [PrescriptionStatus.REVIEWING],
      to: PrescriptionStatus.REJECTED,
      action: PrescriptionAction.REJECT,
      allowedRoles: [UserRole.PHARMACIST],
    },
    {
      from: [PrescriptionStatus.REJECTED],
      to: PrescriptionStatus.SUPPLEMENTED,
      action: PrescriptionAction.SUPPLEMENT,
      allowedRoles: [UserRole.STAFF],
    },
    {
      from: [PrescriptionStatus.SUPPLEMENTED],
      to: PrescriptionStatus.REVIEWING,
      action: PrescriptionAction.REVIEW,
      allowedRoles: [UserRole.PHARMACIST],
    },
    {
      from: [
        PrescriptionStatus.DRAFT,
        PrescriptionStatus.SUBMITTED,
        PrescriptionStatus.REVIEWING,
        PrescriptionStatus.APPROVED,
        PrescriptionStatus.REJECTED,
        PrescriptionStatus.SUPPLEMENTED,
      ],
      to: PrescriptionStatus.VOIDED,
      action: PrescriptionAction.VOID,
      allowedRoles: [UserRole.MANAGER],
    },
  ];
}
