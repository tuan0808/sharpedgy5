import {SportType} from "./SportType";

export class SportDetail {
    constructor(
        public name: string,
        public icon: string,
        public type: SportType
    ) {}
}
