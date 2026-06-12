import { KeyTransferService } from './key-transfer.service';
export declare class KeyTransferController {
    private readonly keyTransferService;
    constructor(keyTransferService: KeyTransferService);
    initiateTransfer(body: {
        propertyId: string;
        handoverId: string;
        keyCount: number;
        keyTypes: string[];
    }, user: any): import("./key-transfer.service").KeyTransfer;
    getByHandover(handoverId: string): import("./key-transfer.service").KeyTransfer;
    findAll(query: {
        propertyId?: string;
        handoverId?: string;
        status?: string;
    }): import("./key-transfer.service").KeyTransfer[];
    findOne(id: string): import("./key-transfer.service").KeyTransfer;
    confirmReception(id: string, user: any): import("./key-transfer.service").KeyTransfer;
    returnKeys(id: string, body: {
        returnNotes?: string;
    }, user: any): import("./key-transfer.service").KeyTransfer;
    getTransferHistory(id: string): import("../audit/audit.service").AuditLogEntry[];
    getTransferTimeline(id: string): {
        transferId: string;
        propertyId: string;
        handoverId: string;
        currentStatus: "pending_transfer" | "transferred" | "returned";
        keyCount: number;
        keyTypes: string[];
        timeline: any[];
        transferredBy: string;
        transferredAt: Date;
        receivedBy: string | undefined;
        receivedAt: Date | undefined;
        returnedBy: string | undefined;
        returnedAt: Date | undefined;
    };
}
