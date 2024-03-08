import {Account} from "../../../Domain/Model/Account";
import {Amount} from "../../../Domain/Model/Amount";
import {InMemoryDataBase} from "../../../Infrastructure/Gateway/InMemoryDataBase";
import {PayByCardCommandHandler} from "./PayByCard.command.handler";
import {TransactionRepository} from "../../../Domain/Gateway/Transaction.repository";
import {AccountRepository} from "../../../Domain/Gateway/Account.repository";
import {TransactionLog} from "../../../Domain/Model/TransactionLog";
import {AccountEntry} from "../../../Domain/Model/AccountEntry";
import {PayByCardCommand} from "./PayByCard.command";

describe('Exercice #1', () => {
    const BANK_EUR = '847596';
    const BANK_USD = '145896';
    const MERCHANT_EUR = '371954';
    const MERCHANT_USD = '284619';
    const CLIENT_EUR = '951575';
    const CLIENT_USD = '745288';
    let database: InMemoryDataBase;
    let payByCardCommandHandler: PayByCardCommandHandler;
    let transactionRepository: TransactionRepository;
    let accountRepository: AccountRepository;

    beforeEach(() => {
        database = new InMemoryDataBase([
            new Account(BANK_EUR, new Amount(-2150_00, 'EUR')),
            new Account(MERCHANT_EUR, new Amount(2000_00, 'EUR')),
            new Account(CLIENT_EUR, new Amount(150_00, 'EUR')),
            new Account(BANK_USD, new Amount(-1825_00, 'USD')),
            new Account(MERCHANT_USD, new Amount(1750_00, 'USD')),
            new Account(CLIENT_USD, new Amount(75_00, 'USD')),
        ], [
            new TransactionLog('abcd', new Date('2024/01/15 11:14:42'), [
                new AccountEntry(BANK_EUR, new Amount(-2000_00, 'EUR'), new Amount(-2000_00, 'EUR')),
                new AccountEntry(MERCHANT_EUR, new Amount(2000_00, 'EUR'), new Amount(2000_00, 'EUR')),
            ]),
            new TransactionLog('efgh', new Date('2024/01/15 13:45:22'), [
                new AccountEntry(BANK_EUR, new Amount(-150_00, 'EUR'), new Amount(-2150_00, 'EUR')),
                new AccountEntry(CLIENT_EUR, new Amount(150_00, 'EUR'), new Amount(150_00, 'EUR')),
            ]),
            new TransactionLog('ijkl', new Date('2024/01/15 14:33:12'), [
                new AccountEntry(BANK_USD, new Amount(-1750_00, 'USD'), new Amount(-1750_00, 'USD')),
                new AccountEntry(MERCHANT_USD, new Amount(1750_00, 'USD'), new Amount(1750_00, 'USD')),
            ]),
            new TransactionLog('mnop', new Date('2024/01/15 15:12:34'), [
                new AccountEntry(BANK_USD, new Amount(-75_00, 'USD'), new Amount(-1825_00, 'USD')),
                new AccountEntry(CLIENT_USD, new Amount(75_00, 'USD'), new Amount(75_00, 'USD')),
            ]),
        ]);
        payByCardCommandHandler = new PayByCardCommandHandler(database as TransactionRepository, database as AccountRepository);
    });

    describe('transaction', () => {

		it('normal case, no error throw', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_EUR,
				merchantAccountNumber : MERCHANT_EUR,
				amount                : 50,
				currency              : 'EUR'
			})
			// act
			payByCardCommandHandler.handle(command)
			// assert
			expect(true).toBe(true);
		});

		it('normal case, client account decrease', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_EUR,
				merchantAccountNumber : MERCHANT_EUR,
				amount                : 50,
				currency              : 'EUR'
			})

			// act
			const balanceBefore = (database as AccountRepository).loadByNumber(CLIENT_EUR).balance.value 
			payByCardCommandHandler.handle(command)
			const balanceAfter = (database as AccountRepository).loadByNumber(CLIENT_EUR).balance.value 

			// assert
			expect(balanceAfter - balanceBefore).toBe(-50);
		});

		it('normal case, merchant account increase', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_EUR,
				merchantAccountNumber : MERCHANT_EUR,
				amount                : 50,
				currency              : 'EUR'
			})
			
			// act
			const balanceBefore = (database as AccountRepository).loadByNumber(MERCHANT_EUR).balance.value 
			payByCardCommandHandler.handle(command)
			const balanceAfter = (database as AccountRepository).loadByNumber(MERCHANT_EUR).balance.value 

			// assert
			expect(balanceAfter - balanceBefore).toBe(50);
		});

		it('normal case, transaction log id is correct', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_EUR,
				merchantAccountNumber : MERCHANT_EUR,
				amount                : 50,
				currency              : 'EUR'
			})
			
			// act
			payByCardCommandHandler.handle(command)

			const lastTransaction = Array.from(database.getTransactions().values()).pop()
			// assert
			expect(lastTransaction.id).toBe("transaction");
		});

		it('normal case, transaction log id, amount and balance are correct', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_EUR,
				merchantAccountNumber : MERCHANT_EUR,
				amount                : 50,
				currency              : 'EUR'
			})
			
			// act
			payByCardCommandHandler.handle(command)

			const lastTransaction = Array.from(database.getTransactions().values()).pop()
			// assert
			expect(lastTransaction.id).toBe("transaction");
			expect(lastTransaction.accounting[0].amount.value).toBe(-50);
			expect(lastTransaction.accounting[0].accountNumber).toBe(CLIENT_EUR);
			expect(lastTransaction.accounting[0].newBalance.value).toBe(149_50);

			expect(lastTransaction.accounting[1].accountNumber).toBe(MERCHANT_EUR);
			expect(lastTransaction.accounting[1].amount.value).toBe(50);
			expect(lastTransaction.accounting[1].newBalance.value).toBe(2000_50);

		});

		

		
    });

	describe('Check valid amount and currency', () => {
		it('given handle with negative number, throw exception', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_EUR,
				merchantAccountNumber : MERCHANT_EUR,
				amount                : -50,
				currency              : 'EUR'
			})

			try{
				// act 
				payByCardCommandHandler.handle(command)
				// assert
				expect(false).toBe(true);

			}
			catch (e)
			{
				// assert
				expect(e.message).toBe("negative amount");
			}
		});


		

		it('currency different than client, throw exception', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_EUR,
				merchantAccountNumber : MERCHANT_USD,
				amount                : 50,
				currency              : 'USD'
			})

			try{
				// act 
				payByCardCommandHandler.handle(command)
				// assert
				expect(false).toBe(true);

			}
			catch (e)
			{
				// assert
				expect(e.message).toBe("Currency not matching");
			}
		});

		it('currency different than merchant, throw exception', () => {
			// arrange
			const command = new PayByCardCommand({
				clientAccountNumber   : CLIENT_USD,
				merchantAccountNumber : MERCHANT_EUR,
				amount                : 50,
				currency              : 'USD'
			})

			try{
				// act 
				payByCardCommandHandler.handle(command)
				// assert
				expect(false).toBe(true);

			}
			catch (e)
			{
				// assert
				expect(e.message).toBe("Currency not matching");
			}
		});
	})
});
