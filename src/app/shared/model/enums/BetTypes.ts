export enum BetTypes {
    MONEYLINE,
    POINT_SPREAD,
    OVER_UNDER,
    SPREAD,
    TOTAL,
    PARLAY,
    TEASER,
    ROUND_ROBIN,
    PLEASER
}

// Extend the prototype to add the value property
declare global {
    interface Number {
        value?: string;
    }
}

Object.defineProperty(Number.prototype, 'value', {
    get: function(this: BetTypes) {
        switch(this) {
            case BetTypes.MONEYLINE: return "Money Line";
            case BetTypes.POINT_SPREAD: return "Point Spread";
            case BetTypes.OVER_UNDER: return "Over Under";
            case BetTypes.SPREAD: return "Spread";
            case BetTypes.TOTAL: return "Total";
            case BetTypes.PARLAY: return "Parlay";
            case BetTypes.TEASER: return "Teaser";
            case BetTypes.ROUND_ROBIN: return "Round Robin";
            case BetTypes.PLEASER: return "Pleaser";
            default: return "";
        }
    },
    enumerable: false,
    configurable: true
});
