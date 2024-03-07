import {PayByCardCommand} from "./PayByCard.command";
import {TransactionRepository} from "../../../Domain/Gateway/Transaction.repository";
import {AccountRepository} from "../../../Domain/Gateway/Account.repository";
import {InMemoryDataBase} from "../../../Infrastructure/Gateway/InMemoryDataBase";

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
    }
}
