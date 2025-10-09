import { SportType } from '../SportType';
import {BetTypes} from "../enums/BetTypes";

export type FieldType = 'number' | 'slider' | 'select' | 'toggle' | 'radio' | 'team-selector' | 'range' | 'richtext';

export interface SportSpecificConfig {
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: any;
}

export interface FieldConfig {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: any;
    sportConfig?: Record<string, SportSpecificConfig>;
    options?: { label: string; value: any }[];
    validators?: {
        required?: boolean;
        min?: number;
        max?: number;
    };
    showOdds?: boolean;
    showProbability?: boolean;
}

export interface BetTypeMapping {
    id: BetTypes;
    label: string;
    icon: string;
    isEnabled: boolean;
    fieldMapping: {
        amountField: string;
        valueField: string;
        teamField?: string;
        additionalFields?: Record<string, string>;
    };
    valueSource: 'moneyline' | 'spread' | 'total' | 'custom';
    formFields: FieldConfig[];
}

export function getBetValueForType(
    betTypeId: BetTypes,
    game: any,
    selectedTeam?: { type: 'home' | 'away' }
): number {
    const config: BetTypeMapping | undefined = (window as any)['BET_TYPE_CONFIG']?.find((c: BetTypeMapping) => c.id === betTypeId);

    if (!config) return 0;

    switch (config.valueSource) {
        case 'moneyline':
            return selectedTeam?.type === 'home' ? game.moneylineHome : game.moneylineAway;
        case 'spread':
            return selectedTeam?.type === 'home' ? game.spreadHome : game.spreadAway;
        case 'total':
            return game.totalPoints || 0;
        default:
            return 0;
    }
}

export function getFieldsForBetType(betTypeId: BetTypes, sportType?: SportType): FieldConfig[] {
    console.log('=== getFieldsForBetType called ===');
    console.log('betTypeId:', betTypeId);
    console.log('sportType:', sportType);
    console.log('sportType typeof:', typeof sportType);

    const config: BetTypeMapping | undefined = (window as any)['BET_TYPE_CONFIG']?.find((c: BetTypeMapping) => c.id === betTypeId);

    if (!config) {
        console.error('No config found for betTypeId:', betTypeId);
        return [];
    }

    console.log('Found config:', config);
    console.log('Config formFields:', config.formFields);

    // Apply sport-specific configurations if sportType is provided
    if (sportType !== undefined && sportType !== null) {
        console.log('Applying sport-specific config...');

        // Convert SportType enum to string key
        const sportKey = SportType[sportType];
        console.log('Sport key (enum to string):', sportKey);

        return config.formFields.map((field, index) => {
            console.log(`\nProcessing field ${index}: ${field.name}`);
            console.log('  Field has sportConfig:', !!field.sportConfig);

            if (field.sportConfig) {
                console.log('  Available sport keys in config:', Object.keys(field.sportConfig));
                console.log('  Looking for key:', sportKey);

                const sportSpecific = field.sportConfig[sportKey] || field.sportConfig['default'];
                console.log('  Sport-specific config found:', sportSpecific);

                if (sportSpecific) {
                    const updatedField = {
                        ...field,
                        min: sportSpecific.min ?? field.min,
                        max: sportSpecific.max ?? field.max,
                        step: sportSpecific.step ?? field.step,
                        defaultValue: sportSpecific.defaultValue ?? field.defaultValue
                    };
                    console.log('  Updated field:', {
                        name: updatedField.name,
                        min: updatedField.min,
                        max: updatedField.max,
                        step: updatedField.step,
                        defaultValue: updatedField.defaultValue
                    });
                    return updatedField;
                } else {
                    console.log('  No sport-specific config, using field as-is');
                }
            } else {
                console.log('  No sportConfig property on field');
            }
            return field;
        });
    } else {
        console.log('No sportType provided, returning fields as-is');
    }

    return config.formFields;
}

export function getAllBetTypes(): BetTypeMapping[] {
    return (window as any)['BET_TYPE_CONFIG'] || [];
}

// Helper to get the middle value for slider when range includes negative and positive
export function getSliderMiddleValue(min: number, max: number): number {
    if (min < 0 && max > 0) {
        return 0; // Start at 0 if range includes negative and positive
    }
    return Math.floor((min + max) / 2);
}
