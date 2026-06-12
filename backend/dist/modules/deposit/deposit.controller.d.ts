import { DepositService, DepositFilters, CreateDepositData } from './deposit.service';
export declare class DepositController {
    private readonly depositService;
    constructor(depositService: DepositService);
    initiate(data: CreateDepositData, user: any): import("./deposit.service").Deposit;
    findAll(filters: DepositFilters): import("./deposit.service").Deposit[];
    getDisputes(): import("./deposit.service").Deposit[];
    findOne(id: string): import("./deposit.service").Deposit;
    confirm(id: string, user: any): import("./deposit.service").Deposit;
    dispute(id: string, data: {
        disputeReason: string;
        disputedAmount: number;
        deductionItems: {
            item: string;
            amount: number;
        }[];
    }, user: any): import("./deposit.service").Deposit;
    resolve(id: string, resolution: {
        finalAmount: number;
        resolutionNotes: string;
    }, user: any): import("./deposit.service").Deposit;
    markSettled(id: string, user: any): import("./deposit.service").Deposit;
}
