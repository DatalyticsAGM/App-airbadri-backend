"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Carga .env desde la raíz del proyecto (no depende del directorio de trabajo actual).
const pathToEnv = path_1.default.resolve(__dirname, '..', '..', '.env');
dotenv_1.default.config({ path: pathToEnv });
//# sourceMappingURL=dotenv.js.map