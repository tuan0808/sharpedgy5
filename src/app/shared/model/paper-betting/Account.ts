import {Bet} from "./Bet";
import {BetHistory} from "./BetHistory";

export interface Account {
    id: number;
    user_id: string;          // Unique identifier for the account
    balance: number;         // Current balance
    creationDate: string;    // When the account was created
    closedDate?: string;     // When the account was closed (optional)
    activeAccount: boolean;  // Whether the account is active
    closureReason?: string;  // Reason for closure (optional)
    betHistory: BetHistory[];      // Array of bets made on this account
}
