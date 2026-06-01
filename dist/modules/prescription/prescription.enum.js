"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.PrescriptionAction = exports.PrescriptionStatus = void 0;
var PrescriptionStatus;
(function (PrescriptionStatus) {
    PrescriptionStatus["DRAFT"] = "DRAFT";
    PrescriptionStatus["SUBMITTED"] = "SUBMITTED";
    PrescriptionStatus["REVIEWING"] = "REVIEWING";
    PrescriptionStatus["APPROVED"] = "APPROVED";
    PrescriptionStatus["REJECTED"] = "REJECTED";
    PrescriptionStatus["SUPPLEMENTED"] = "SUPPLEMENTED";
    PrescriptionStatus["VOIDED"] = "VOIDED";
})(PrescriptionStatus || (exports.PrescriptionStatus = PrescriptionStatus = {}));
var PrescriptionAction;
(function (PrescriptionAction) {
    PrescriptionAction["SUBMIT"] = "SUBMIT";
    PrescriptionAction["REVIEW"] = "REVIEW";
    PrescriptionAction["APPROVE"] = "APPROVE";
    PrescriptionAction["REJECT"] = "REJECT";
    PrescriptionAction["SUPPLEMENT"] = "SUPPLEMENT";
    PrescriptionAction["VOID"] = "VOID";
})(PrescriptionAction || (exports.PrescriptionAction = PrescriptionAction = {}));
var UserRole;
(function (UserRole) {
    UserRole["STAFF"] = "STAFF";
    UserRole["PHARMACIST"] = "PHARMACIST";
    UserRole["MANAGER"] = "MANAGER";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=prescription.enum.js.map