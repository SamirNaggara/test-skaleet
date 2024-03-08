import {PayByCardCommand} from "./PayByCard.command";
import {TransactionRepository} from "../../../Domain/Gateway/Transaction.repository";
import {AccountRepository} from "../../../Domain/Gateway/Account.repository";
import {InMemoryDataBase} from "../../../Infrastructure/Gateway/InMemoryDataBase";
import { TransactionLog } from "../../../Domain/Model/TransactionLog";
import { AccountEntry } from "../../../Domain/Model/AccountEntry";
import { Amount } from "../../../Domain/Model/Amount";

function assert(condition: any, msg: string): asserts condition {
    if (!condition) {throw new Error(msg)}
}

export class PayByCardCommandHandler  {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly accountRepository: AccountRepository,
) {}
    public handle(command: PayByCardCommand) {
		
		const { clientAccountNumber, merchantAccountNumber, amount,	currency } = command.details

		// check that amount is positive
		assert(amount > 0, "negative amount")

		// load accounts
		const clientAccount = this.accountRepository.loadByNumber(clientAccountNumber)
		const merchantAccount = this.accountRepository.loadByNumber(merchantAccountNumber)

		// check account does exist
		assert(clientAccount, "Client account not found")
		assert(merchantAccount, "Merchant account not found")

		// check that currency are matching
		assert(clientAccount.balance.currency === currency, "Currency not matching")
		assert(merchantAccount.balance.currency === currency, "Currency not matching")

		// Decrease the amont of the client account
		clientAccount.balance.value -= amount
		merchantAccount.balance.value += amount


		// Create a transaction log
		const log = new TransactionLog('transaction', new Date(), [
			new AccountEntry(clientAccountNumber, new Amount(-amount, currency), clientAccount.balance),
			new AccountEntry(merchantAccountNumber, new Amount(amount, currency), merchantAccount.balance),
		])
		this.transactionRepository.save(log)

    }
}
