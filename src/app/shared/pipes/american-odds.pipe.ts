import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'americanOdds',
    standalone: true
})
export class AmericanOddsPipe implements PipeTransform {
    transform(value: number): string {
        if (isNaN(value) || value === 0) return 'N/A';
        return value >= 0 ? `+${value}` : `${value}`;
    }
}
