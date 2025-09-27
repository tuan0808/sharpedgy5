import {State} from "sockjs-client";

export interface BetResult {
    status: 'SUCCESS' | 'CREDIT_LIMIT_EXCEEDED' | 'USER_NOT_FOUND' | 'ACCOUNT_NOT_FOUND' | 'ERROR';
    message: string;
    remainingCredit?: number;
    totalCredit?: number;
    balance?: number;
    tempId?: string;
}
