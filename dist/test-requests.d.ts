export declare const testRequests: {
    healthCheck: {
        method: string;
        url: string;
        description: string;
        headers: {};
    };
    getHome: {
        method: string;
        url: string;
        description: string;
        headers: {};
    };
    getCurrentUser: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getAllUsers: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getAllApplications: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getStuckApplications: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getApplicationsByStatus: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    createApplication: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            applicantName: string;
            applicantIdNo: string;
            notaryType: string;
            appointmentNo: string;
        };
    };
    submitMaterials: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            materials: {
                name: string;
                isOriginal: boolean;
            }[];
        };
    };
    reviewAndSetFee: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            feeItems: {
                name: string;
                amount: number;
                quantity: number;
            }[];
        };
    };
    issueSupplementNotice: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            reason: string;
            requiredMaterials: string[];
            deadline: string;
        };
    };
    getPaymentPendingRegistration: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getPaymentPendingConfirmation: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getStuckPayments: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    registerPayment: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            applicationId: string;
            amount: number;
            feeItems: {
                name: string;
                amount: number;
                quantity: number;
            }[];
            paymentMethod: string;
            transactionNo: string;
            remark: string;
        };
    };
    confirmPayment: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            applicationId: string;
            remark: string;
        };
    };
    getPaymentRecord: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getCertificatePendingArrangement: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getCertificatePendingIssuance: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getStuckCertificates: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getCompletedCertificates: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    arrangeCertificate: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            applicationId: string;
            certificateNo: string;
            scheduledPickupDate: string;
            remark: string;
        };
    };
    issueCertificate: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            applicationId: string;
            pickupBy: string;
            pickupIdNo: string;
            remark: string;
        };
    };
    getCertificateRecord: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getCertificateHistory: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getCertificateReview: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getApplicationLogs: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    getApplicationDetail: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
        };
    };
    permissionTest_WindowStaffCannotConfirmPayment: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            applicationId: string;
        };
    };
    permissionTest_NotaryCannotArrangeCertificate: {
        method: string;
        url: string;
        description: string;
        headers: {
            'x-user-id': string;
            'Content-Type': string;
        };
        body: {
            applicationId: string;
            scheduledPickupDate: string;
        };
    };
};
export declare const curlExamples: Record<string, string>;
export default testRequests;
