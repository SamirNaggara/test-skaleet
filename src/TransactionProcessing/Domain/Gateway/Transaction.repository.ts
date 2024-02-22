import { TransactionLog } from "../Model/TransactionLog";

export interface TransactionRepository {
    save(transaction: TransactionLog): void
}
