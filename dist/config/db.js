"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDb(mongoUri) {
    await mongoose_1.default.connect(mongoUri);
    return mongoose_1.default.connection;
}
//# sourceMappingURL=db.js.map