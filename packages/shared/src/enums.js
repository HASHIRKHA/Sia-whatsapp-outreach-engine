"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgStatus = exports.CampaignStatus = exports.SessionStatus = exports.SessionMode = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["OPERATOR"] = "OPERATOR";
})(Role || (exports.Role = Role = {}));
var SessionMode;
(function (SessionMode) {
    SessionMode["CLOUD_API"] = "CLOUD_API";
    SessionMode["BAILEYS"] = "BAILEYS";
})(SessionMode || (exports.SessionMode = SessionMode = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["OFFLINE"] = "OFFLINE";
    SessionStatus["CONNECTING"] = "CONNECTING";
    SessionStatus["ONLINE"] = "ONLINE";
    SessionStatus["BANNED"] = "BANNED";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "DRAFT";
    CampaignStatus["RUNNING"] = "RUNNING";
    CampaignStatus["PAUSED"] = "PAUSED";
    CampaignStatus["DONE"] = "DONE";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
var MsgStatus;
(function (MsgStatus) {
    MsgStatus["QUEUED"] = "QUEUED";
    MsgStatus["SENT"] = "SENT";
    MsgStatus["DELIVERED"] = "DELIVERED";
    MsgStatus["READ"] = "READ";
    MsgStatus["REPLIED"] = "REPLIED";
    MsgStatus["FAILED"] = "FAILED";
})(MsgStatus || (exports.MsgStatus = MsgStatus = {}));
//# sourceMappingURL=enums.js.map