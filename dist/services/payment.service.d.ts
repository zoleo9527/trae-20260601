import { User, Application, PaymentRecord, FeeItem } from '../types';
export interface RegisterPaymentParams {
    applicationId: string;
    amount: number;
    feeItems: FeeItem[];
    paymentMethod: string;
    transactionNo?: string;
    remark?: string;
}
export interface ConfirmPaymentParams {
    applicationId: string;
    remark?: string;
}
export interface PaymentValidationResult {
    valid: boolean;
    errors: string[];
}
export declare class PaymentService {
    static validatePaymentRegistration(app: Application | undefined, params: RegisterPaymentParams): PaymentValidationResult;
    static validatePaymentConfirmation(app: Application | undefined): PaymentValidationResult;
    static registerPayment(params: RegisterPaymentParams, operator: User): Application | {
        error: string[];
    };
    static confirmPayment(params: ConfirmPaymentParams, operator: User): Application | {
        error: string[];
    };
    static getPaymentRecord(applicationId: string): PaymentRecord | undefined;
    static getApplicationsPendingPayment(): Application[];
    static getApplicationsPendingPaymentConfirmation(): Application[];
    static getStuckPaymentRecords(): Application[];
}
