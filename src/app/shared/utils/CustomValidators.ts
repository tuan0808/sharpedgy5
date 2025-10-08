import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators for comparison operations
 */
export class CustomValidators {

    /**
     * Validator that requires the control value to be less than a specified value
     * @param value The maximum value (exclusive)
     * @returns ValidatorFn
     */
    static lessThan(value: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null; // Don't validate empty values
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null; // Don't validate non-numeric values
            }

            return numValue < value ? null : { lessThan: { value, actual: numValue } };
        };
    }

    /**
     * Validator that requires the control value to be less than or equal to a specified value
     * @param value The maximum value (inclusive)
     * @returns ValidatorFn
     */
    static lessThanOrEqual(value: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null;
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null;
            }

            return numValue <= value ? null : { lessThanOrEqual: { value, actual: numValue } };
        };
    }

    /**
     * Validator that requires the control value to be greater than a specified value
     * @param value The minimum value (exclusive)
     * @returns ValidatorFn
     */
    static greaterThan(value: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null;
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null;
            }

            return numValue > value ? null : { greaterThan: { value, actual: numValue } };
        };
    }

    /**
     * Validator that requires the control value to be greater than or equal to a specified value
     * @param value The minimum value (inclusive)
     * @returns ValidatorFn
     */
    static greaterThanOrEqual(value: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null;
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null;
            }

            return numValue >= value ? null : { greaterThanOrEqual: { value, actual: numValue } };
        };
    }

    /**
     * Validator that requires the control value to be equal to a specified value
     * @param value The required value
     * @returns ValidatorFn
     */
    static equalTo(value: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null;
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null;
            }

            return numValue === value ? null : { equalTo: { value, actual: numValue } };
        };
    }

    /**
     * Validator that requires the control value to NOT be equal to a specified value
     * @param value The forbidden value
     * @returns ValidatorFn
     */
    static notEqualTo(value: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null;
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null;
            }

            return numValue !== value ? null : { notEqualTo: { value, actual: numValue } };
        };
    }

    /**
     * Validator that requires the control value to be between two values (exclusive)
     * @param min The minimum value (exclusive)
     * @param max The maximum value (exclusive)
     * @returns ValidatorFn
     */
    static between(min: number, max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null;
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null;
            }

            return (numValue > min && numValue < max)
                ? null
                : { between: { min, max, actual: numValue } };
        };
    }

    /**
     * Validator that requires the control value to be between two values (inclusive)
     * @param min The minimum value (inclusive)
     * @param max The maximum value (inclusive)
     * @returns ValidatorFn
     */
    static betweenInclusive(min: number, max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.value === null || control.value === undefined || control.value === '') {
                return null;
            }

            const numValue = Number(control.value);
            if (isNaN(numValue)) {
                return null;
            }

            return (numValue >= min && numValue <= max)
                ? null
                : { betweenInclusive: { min, max, actual: numValue } };
        };
    }

    /**
     * Get user-friendly error messages for custom validators
     * @param errors ValidationErrors object
     * @returns string message
     */
    static getErrorMessage(errors: ValidationErrors): string | null {
        if (errors['lessThan']) {
            return `Value must be less than ${errors['lessThan'].value}`;
        }
        if (errors['lessThanOrEqual']) {
            return `Value must be less than or equal to ${errors['lessThanOrEqual'].value}`;
        }
        if (errors['greaterThan']) {
            return `Value must be greater than ${errors['greaterThan'].value}`;
        }
        if (errors['greaterThanOrEqual']) {
            return `Value must be greater than or equal to ${errors['greaterThanOrEqual'].value}`;
        }
        if (errors['equalTo']) {
            return `Value must be equal to ${errors['equalTo'].value}`;
        }
        if (errors['notEqualTo']) {
            return `Value cannot be ${errors['notEqualTo'].value}`;
        }
        if (errors['between']) {
            return `Value must be between ${errors['between'].min} and ${errors['between'].max}`;
        }
        if (errors['betweenInclusive']) {
            return `Value must be between ${errors['betweenInclusive'].min} and ${errors['betweenInclusive'].max} (inclusive)`;
        }
        return null;
    }
}
