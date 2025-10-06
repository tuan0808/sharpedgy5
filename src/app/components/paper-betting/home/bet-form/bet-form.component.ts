import {Component, computed, EventEmitter, inject, Input, Output, signal, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NgClass, JsonPipe} from "@angular/common";
import {ReactiveFormsModule, FormBuilder, Validators} from "@angular/forms";
import {BaseBetFormComponent} from "../../../base-bet-form-component/base-bet-form-component.component";
import {SportType} from "../../../../shared/model/SportType";
import {BetSettlement} from "../../../../shared/model/paper-betting/BetSettlement";
import {EventStatus} from "../../../../shared/model/enums/EventStatus";
import {Game} from "../../../../shared/model/paper-betting/Game";
import {BetTypes} from "../../../../shared/model/enums/BetTypes";
import betTypesConfig from '../../../../../assets/config/bet-types.json';
import {
    BetTypeMapping,
    FieldConfig,
    getAllBetTypes, getBetValueForType,
    getFieldsForBetType
} from "../../../../shared/model/paper-betting/FieldConfig";

@Component({
    selector: 'app-bet-form',
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './bet-form.component.html',
    styleUrls: ['./bet-form.component.scss']
})
export class BetFormComponent extends BaseBetFormComponent implements OnInit {
    public activeModal = inject(NgbActiveModal);

    @Input() uid: string = '';
    @Input() sportType!: SportType;

    @Output() betDataSubmitted = new EventEmitter<BetSettlement>();

    protected readonly currentPage = signal<number>(1);
    protected readonly pageSize = signal<number>(10);
    protected readonly totalPages = signal<number>(0);
    protected readonly totalElements = signal<number>(0);

    protected betTypes: BetTypeMapping[] = [];
    protected currentFormFields: FieldConfig[] = [];

    constructor() {
        super();
        console.log('=== Constructor Start ===');
        console.log('Raw config from JSON:', betTypesConfig);
        console.log('Sport Type:', this.sportType);

        (window as any)['BET_TYPE_CONFIG'] = betTypesConfig as BetTypeMapping[];
        this.betTypes = getAllBetTypes();

        console.log('Loaded bet types (this.betTypes):', this.betTypes);
        console.log('Number of bet types:', this.betTypes.length);
        this.betTypes.forEach((bet, index) => {
            console.log(`  [${index}] id: ${bet.id}, label: "${bet.label}", enabled: ${bet.isEnabled}`);
        });
    }

    ngOnInit(): void {
        console.log('=== ngOnInit called ===');
        console.log('Sport Type in ngOnInit:', this.sportType);
        console.log('All bet types:', this.betTypes);
        console.log('Number of bet types:', this.betTypes.length);

        const firstEnabledBet = this.betTypes.find(b => b.isEnabled);
        console.log('First enabled bet:', firstEnabledBet);

        if (firstEnabledBet) {
            console.log('Initializing with bet type ID:', firstEnabledBet.id);
            this.setSelectedBetType(firstEnabledBet.id);
        } else {
            console.error('No enabled bet type found!');
        }
    }

    getFormControlNames(): string {
        return Object.keys(this.bettingForm.controls).join(', ');
    }

    onBetTypeClick(bet: BetTypeMapping): void {
        console.log('=== onBetTypeClick ===');
        console.log('Bet clicked:', bet);
        console.log('Bet ID:', bet.id);
        console.log('Bet enabled:', bet.isEnabled);

        if (!bet.isEnabled) {
            console.log('Bet type is disabled, ignoring click');
            return;
        }

        this.setSelectedBetType(bet.id);
    }

    override setSelectedBetType(betTypeId: BetTypes): void {
        console.log('=== setSelectedBetType called ===');
        console.log('Setting bet type to:', betTypeId);
        console.log('Sport Type:', this.sportType);

        this.selectedBetType = betTypeId;

        // Reset team selection when changing bet types
        if (betTypeId === BetTypes.OVER_UNDER) {
            this.selectedTeam = null;
        }

        this.rebuildForm();
        this.updatePotentialWinnings();
    }

    private rebuildForm(): void {
        console.log('=== rebuildForm called ===');
        console.log('Rebuilding form for bet type:', this.selectedBetType);
        console.log('Using sport type:', this.sportType);

        this.currentFormFields = getFieldsForBetType(this.selectedBetType, this.sportType);

        console.log('Current form fields received:', this.currentFormFields);
        console.log('Number of fields:', this.currentFormFields.length);

        const formConfig: any = {};

        this.currentFormFields.forEach((field, index) => {
            console.log(`Processing field ${index}: ${field.name} (${field.type})`);

            if (field.type === 'team-selector') {
                console.log('  -> Skipping team-selector (handled separately)');
                return;
            }

            const validators = [];

            if (field.validators?.required) {
                validators.push(Validators.required);
                console.log('  -> Added required validator');
            }

            if (field.min !== undefined) {
                validators.push(Validators.min(field.min));
                console.log('  -> Added min validator:', field.min);
            }
            if (field.max !== undefined) {
                validators.push(Validators.max(field.max));
                console.log('  -> Added max validator:', field.max);
            }

            let defaultValue = field.defaultValue;
            if (defaultValue === undefined || defaultValue === null) {
                if (field.type === 'slider' && field.min !== undefined && field.max !== undefined) {
                    if (field.min < 0 && field.max > 0) {
                        defaultValue = 0;
                        console.log('  -> Using middle value (0) for slider with negative/positive range');
                    } else {
                        defaultValue = field.min;
                        console.log('  -> Using min value as default');
                    }
                } else {
                    defaultValue = '';
                }
            }

            formConfig[field.name] = [defaultValue, validators];
            console.log(`  -> Added ${field.name} to formConfig with default value:`, defaultValue);
        });

        console.log('Final form config object:', formConfig);
        console.log('Form config keys:', Object.keys(formConfig));

        this.bettingForm = this.fb.group(formConfig);

        console.log('Form group created');
        console.log('Form controls:', Object.keys(this.bettingForm.controls));
        console.log('Form value:', this.bettingForm.value);
        console.log('Form valid:', this.bettingForm.valid);

        this.bettingForm.valueChanges.subscribe((value) => {
            console.log('Form value changed:', value);
            this.updatePotentialWinnings();
        });
    }

    private buildBetPayload(): Record<string, any> {
        const config = this.betTypes.find(b => b.id === this.selectedBetType);

        if (!config) {
            throw new Error('Invalid bet type selected');
        }

        const payload: Record<string, any> = {};
        const mapping = config.fieldMapping;
        const formValues = this.bettingForm.value;

        // Handle bet amount - common to all bet types
        const amountField = this.currentFormFields.find(f => f.name === 'amount');
        if (amountField) {
            payload[mapping.amountField] = formValues[amountField.name];
        }

        // Handle wagerValue and selectedTeam based on bet type
        let wagerValue: number;
        let selectedTeam: string | null = null;

        switch (this.selectedBetType) {
            case BetTypes.MONEYLINE:
                // Moneyline: selectedTeam = team abbreviation, wagerValue = odds
                if (!this.selectedTeam) {
                    throw new Error('No team selected for Moneyline bet');
                }
                selectedTeam = this.selectedTeam.abbreviation;
                wagerValue = parseFloat(this.selectedTeam.odds);
                console.log(`Moneyline - Team: ${selectedTeam}, Odds (wagerValue): ${wagerValue}`);
                break;

            case BetTypes.POINT_SPREAD:
                // Point Spread: selectedTeam = team abbreviation, wagerValue = spread value from slider
                if (!this.selectedTeam) {
                    throw new Error('No team selected for Point Spread bet');
                }
                selectedTeam = this.selectedTeam.abbreviation;

                const spreadField = this.currentFormFields.find(f => f.name === 'spreadValue');
                if (spreadField) {
                    wagerValue = formValues[spreadField.name] || 0;
                    console.log(`Point Spread - Team: ${selectedTeam}, Spread (wagerValue): ${wagerValue}`);
                } else {
                    throw new Error('Spread value field not found');
                }
                break;

            case BetTypes.OVER_UNDER:
                // Over/Under: selectedTeam = 'OVER' or 'UNDER', wagerValue = total line
                const predictionField = this.currentFormFields.find(f => f.name === 'prediction');
                if (predictionField) {
                    selectedTeam = formValues[predictionField.name]; // 'OVER' or 'UNDER'
                    wagerValue = this.game.overUnder;
                    console.log(`Over/Under - Selection: ${selectedTeam}, Total Line (wagerValue): ${wagerValue}`);
                } else {
                    throw new Error('Prediction field not found for Over/Under bet');
                }
                break;

            case BetTypes.PARLAY:
            case BetTypes.TEASER:
            case BetTypes.ROUND_ROBIN:
            case BetTypes.PLEASER:
                // These bet types need custom implementation
                selectedTeam = null;
                wagerValue = 0;
                console.log(`${BetTypes[this.selectedBetType]} - Custom bet type (not fully implemented)`);
                break;

            default:
                throw new Error(`Unknown bet type: ${this.selectedBetType}`);
        }

        // Set the mapped field names
        payload[mapping.valueField] = wagerValue;
        if (mapping.teamField) {
            payload[mapping.teamField] = selectedTeam;
        }

        // Add all other form fields (excluding amount and team-selector)
        this.currentFormFields.forEach(field => {
            if (field.name !== 'amount' && field.type !== 'team-selector') {
                payload[field.name] = formValues[field.name];
            }
        });

        // Add any additional static fields from config
        if (mapping.additionalFields) {
            Object.entries(mapping.additionalFields).forEach(([key, value]) => {
                payload[key] = value;
            });
        }

        console.log('Built payload:', payload);
        return payload;
    }

    onSubmit(): void {
        console.log('=== onSubmit called ===');
        console.log('Form valid:', this.isFormValid());

        if (this.isFormValid()) {
            const betData = new BetSettlement();
            betData.betType = this.selectedBetType;
            betData.status = EventStatus.PENDING;

            const formValues = this.bettingForm.value;
            const amountField = this.currentFormFields.find(f => f.name === 'amount');
            betData.wagerAmount = amountField ? formValues[amountField.name] : 0;

            // Set selectedTeam and wagerValue based on bet type
            switch (this.selectedBetType) {
                case BetTypes.MONEYLINE:
                    betData.selectedTeam = this.selectedTeam.abbreviation;
                    betData.wagerValue = parseFloat(this.selectedTeam.odds);
                    break;

                case BetTypes.POINT_SPREAD:
                    betData.selectedTeam = this.selectedTeam.abbreviation;
                    const spreadField = this.currentFormFields.find(f => f.name === 'spreadValue');
                    betData.wagerValue = spreadField ? formValues[spreadField.name] : parseFloat(this.selectedTeam.spread);
                    break;

                case BetTypes.OVER_UNDER:
                    const predictionField = this.currentFormFields.find(f => f.name === 'prediction');
                    betData.selectedTeam = predictionField ? formValues[predictionField.name] : null; // 'OVER' or 'UNDER'
                    betData.wagerValue = this.game.overUnder;
                    break;

                default:
                    betData.selectedTeam = null;
                    betData.wagerValue = 0;
                    break;
            }

            console.log('BetSettlement:', betData);
            this.betDataSubmitted.emit(betData);
            this.activeModal.close(betData);
        }
    }

    private getFormErrors(): any {
        const errors: any = {};
        Object.keys(this.bettingForm.controls).forEach(key => {
            const control = this.bettingForm.get(key);
            if (control && control.errors) {
                errors[key] = control.errors;
            }
        });
        return errors;
    }

    override updatePotentialWinnings(): void {
        const amountField = this.currentFormFields.find(f => f.name === 'amount');
        const amount = amountField ? this.bettingForm.get(amountField.name)?.value : 0;

        if (!amount || amount <= 0) {
            this.potentialWinnings = 0;
            return;
        }

        // Handle different bet types
        switch (this.selectedBetType) {
            case BetTypes.OVER_UNDER:
                // Even money: bet $100, win $100
                this.potentialWinnings = amount;
                break;

            case BetTypes.POINT_SPREAD:
                // Even money: bet $100, win $100
                // No need to check selectedTeam for potential winnings calculation
                this.potentialWinnings = amount;
                break;

            case BetTypes.MONEYLINE:
                // Moneyline uses actual odds from the game
                if (this.selectedTeam && this.selectedTeam.odds) {
                    const odds = parseFloat(this.selectedTeam.odds);

                    if (odds > 0) {
                        // Positive odds: +150 means bet $100 to win $150
                        this.potentialWinnings = (amount * odds) / 100;
                    } else {
                        // Negative odds: -110 means bet $110 to win $100
                        this.potentialWinnings = (amount * 100) / Math.abs(odds);
                    }
                } else {
                    this.potentialWinnings = 0;
                }
                break;

            default:
                this.potentialWinnings = 0;
                break;
        }
    }

    // Simple method for Over/Under selection
    setOverUnderSelection(selection: 'OVER' | 'UNDER', fieldName: string): void {
        this.bettingForm.patchValue({ [fieldName]: selection });
        this.updatePotentialWinnings();
    }

    override isFormValid(): boolean {
        const hasTeamSelector = this.currentFormFields.some(f => f.type === 'team-selector');
        const teamValid = (this.selectedBetType === BetTypes.OVER_UNDER) ? true : (hasTeamSelector ? !!this.selectedTeam : true);
        return this.bettingForm.valid && teamValid;
    }

    // Range slider helper methods
    getRangeMin(fieldName: string): number {
        const value = this.bettingForm.get(fieldName)?.value;
        return Array.isArray(value) ? value[0] : 0;
    }

    getRangeMax(fieldName: string): number {
        const value = this.bettingForm.get(fieldName)?.value;
        return Array.isArray(value) ? value[1] : 0;
    }

    updateRangeMin(fieldName: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        const newMin = parseFloat(input.value);
        const currentValue = this.bettingForm.get(fieldName)?.value || [0, 0];
        const max = Array.isArray(currentValue) ? currentValue[1] : 0;

        if (newMin <= max) {
            this.bettingForm.patchValue({
                [fieldName]: [newMin, max]
            });
        }
    }

    updateRangeMax(fieldName: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        const newMax = parseFloat(input.value);
        const currentValue = this.bettingForm.get(fieldName)?.value || [0, 0];
        const min = Array.isArray(currentValue) ? currentValue[0] : 0;

        if (newMax >= min) {
            this.bettingForm.patchValue({
                [fieldName]: [min, newMax]
            });
        }
    }

    getRangeFillLeft(fieldName: string): number {
        const field = this.currentFormFields.find(f => f.name === fieldName);
        if (!field) return 0;

        const min = this.getRangeMin(fieldName);
        const fieldMin = field.min || 0;
        const fieldMax = field.max || 100;

        return ((min - fieldMin) / (fieldMax - fieldMin)) * 100;
    }

    getRangeFillRight(fieldName: string): number {
        const field = this.currentFormFields.find(f => f.name === fieldName);
        if (!field) return 0;

        const max = this.getRangeMax(fieldName);
        const fieldMin = field.min || 0;
        const fieldMax = field.max || 100;

        return 100 - ((max - fieldMin) / (fieldMax - fieldMin)) * 100;
    }
}

