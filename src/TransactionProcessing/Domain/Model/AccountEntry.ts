import {Amount} from "./Amount";

export class    AccountEntry {
    constructor(
        public accountNumber : string,
        public amount        : Amount,
        public newBalance    : Amount,
    ) {
    }
}
