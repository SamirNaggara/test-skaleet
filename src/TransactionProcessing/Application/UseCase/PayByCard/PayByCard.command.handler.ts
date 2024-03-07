import {PayByCardCommand} from "./PayByCard.command";
import {TransactionRepository} from "../../../Domain/Gateway/Transaction.repository";
import {AccountRepository} from "../../../Domain/Gateway/Account.repository";
import {InMemoryDataBase} from "../../../Infrastructure/Gateway/InMemoryDataBase";

export class PayByCardCommandHandler  {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly accountRepository: AccountRepository,
) {}

    public handle(command: PayByCardCommand) {
		
		const { clientAccountNumber, merchantAccountNumber, amount,	currency } = command.details

		if (amount <= 0) {
			throw new Error("Le montant fourni en entrée est strictement positif")
		}

		const clientAccount = this.accountRepository.loadByNumber(clientAccountNumber)

		if (!clientAccount)
		{
			throw new Error("Client account not found")
		}
		if (clientAccount.balance.currency !== currency)
		{
			throw new Error("Current not corresponding to client currency")
		}


    }
}
