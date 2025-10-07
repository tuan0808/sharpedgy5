
export interface ValidatorConfig {
    type: 'required' | 'min' | 'max' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual';
    value?: number;
}
