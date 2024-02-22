import { Amount } from "./Amount";

export class Account {

    constructor(
        public number  : string,
        public balance : Amount
    ) {
    }
}
