import {Component, EventEmitter, inject, Input, Output, signal, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ReactiveFormsModule, Validators} from "@angular/forms";
import {BaseBetFormComponent} from "../../../base-bet-form-component/base-bet-form-component.component";
import {SportType} from "../../../../shared/model/SportType";
import {BetSettlement} from "../../../../shared/model/paper-betting/BetSettlement";
import {EventStatus} from "../../../../shared/model/enums/EventStatus";
import {BetTypes} from "../../../../shared/model/enums/BetTypes";
import betTypesConfig from '../../../../../assets/config/prediction-form.json';
import {
  BetTypeMapping,
  FieldConfig,
  getAllBetTypes,
  getFieldsForBetType
} from "../../../../shared/model/paper-betting/FieldConfig";
import {CustomValidators} from "../../../../shared/utils/CustomValidators";
import {MdbRangeModule} from "mdb-angular-ui-kit/range";
import { Editor, Toolbar, NgxEditorModule } from 'ngx-editor';


@Component({
  selector: 'app-prediction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MdbRangeModule,
    NgxEditorModule
  ],
  templateUrl: './prediction-form.component.html',
  styleUrls: ['./prediction-form.component.scss']
})
export class PredictionFormComponent extends BaseBetFormComponent implements OnInit, OnDestroy {
  public activeModal = inject(NgbActiveModal);
  private cdr = inject(ChangeDetectorRef);

  @Input() uid: string = '';
  @Input() sportType!: SportType;

  @Output() betDataSubmitted = new EventEmitter<BetSettlement>();

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);
  protected readonly totalPages = signal<number>(0);
  protected readonly totalElements = signal<number>(0);

  protected betTypes: BetTypeMapping[] = [];
  protected currentFormFields: FieldConfig[] = [];

  // Rich text editor instances
  protected editors: Map<string, Editor> = new Map();

  // Toolbar configuration - limited to basic formatting only
  protected toolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    ['bullet_list', 'ordered_list'],
  ];

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

  ngOnDestroy(): void {
    // Destroy all editor instances
    this.editors.forEach(editor => {
      try {
        editor.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
    });
    this.editors.clear();
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
    console.log('Selected bet type:', this.selectedBetType);

    // Destroy existing editors before rebuilding
    this.editors.forEach(editor => {
      try {
        editor.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
    });
    this.editors.clear();

    this.currentFormFields = getFieldsForBetType(this.selectedBetType, this.sportType);
    console.log('Current form fields COUNT:', this.currentFormFields.length);
    console.log('Current form fields FULL:', JSON.stringify(this.currentFormFields, null, 2));

    const formConfig: any = {};

    this.currentFormFields.forEach((field, index) => {
      console.log(`Processing field ${index}:`, field.name, 'Type:', field.type);

      if (field.type === 'team-selector') {
        console.log('  -> Skipping team-selector');
        return;
      }

      const validators = [];

      // Process validator array
      if (field.validators && Array.isArray(field.validators)) {
        field.validators.forEach(v => {
          switch (v.type) {
            case 'required':
              validators.push(Validators.required);
              break;
            case 'min':
              validators.push(Validators.min(v.value));
              break;
            case 'max':
              validators.push(Validators.max(v.value));
              break;
            case 'lessThan':
              validators.push(CustomValidators.lessThan(v.value));
              break;
            case 'greaterThan':
              validators.push(CustomValidators.greaterThan(v.value));
              break;
            case 'lessThanOrEqual':
              validators.push(CustomValidators.lessThanOrEqual(v.value));
              break;
            case 'greaterThanOrEqual':
              validators.push(CustomValidators.greaterThanOrEqual(v.value));
              break;
          }
        });
      }

      const defaultValue = field.defaultValue ?? (field.type === 'slider' && field.min < 0 && field.max > 0 ? 0 : field.min) ?? '';
      formConfig[field.name] = [defaultValue, validators];
    });

    console.log('Form config:', formConfig);

    this.bettingForm = this.fb.group(formConfig);
    this.bettingForm.valueChanges.subscribe(() => this.updatePotentialWinnings());

    // Initialize editors AFTER form is created and DOM is updated
    setTimeout(() => {
      this.currentFormFields.forEach((field) => {
        if (field.type === 'richtext') {
          console.log('Creating editor for field:', field.name);
          const editor = new Editor();
          this.editors.set(field.name, editor);
          console.log('Editor created and stored');
        }
      });
      console.log('Editors map size after setTimeout:', this.editors.size);
      this.cdr.detectChanges();
    }, 0);
  }

  getEditor(fieldName: string): Editor | undefined {
    return this.editors.get(fieldName);
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
        if (!this.selectedTeam) {
          throw new Error('No team selected for Moneyline bet');
        }
        selectedTeam = this.selectedTeam.abbreviation;
        wagerValue = parseFloat(this.selectedTeam.odds);
        console.log(`Moneyline - Team: ${selectedTeam}, Odds (wagerValue): ${wagerValue}`);
        break;

      case BetTypes.POINT_SPREAD:
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
        const predictionField = this.currentFormFields.find(f => f.name === 'prediction');
        if (predictionField) {
          selectedTeam = formValues[predictionField.name];
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
        selectedTeam = null;
        wagerValue = 0;
        console.log(`${BetTypes[this.selectedBetType]} - Custom bet type (not fully implemented)`);
        break;

      default:
        throw new Error(`Unknown bet type: ${this.selectedBetType}`);
    }

    payload[mapping.valueField] = wagerValue;
    if (mapping.teamField) {
      payload[mapping.teamField] = selectedTeam;
    }

    // Add all other form fields
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

      // Check if this bet type uses richtext (betDetails) or amount field
      const betDetailsField = this.currentFormFields.find(f => f.name === 'betDetails' && f.type === 'richtext');
      const amountField = this.currentFormFields.find(f => f.name === 'amount');

      if (betDetailsField) {
        // For Point Spread and Over/Under - save rich text to message
        betData.message = formValues['betDetails'] || '';
        console.log('Saving rich text to message:', betData.message);
      } else if (amountField) {
        // For Moneyline and other types - use amount field
        betData.wagerAmount = formValues[amountField.name];
        console.log('Saving amount:', betData.wagerAmount);
      }

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
          betData.selectedTeam = predictionField ? formValues[predictionField.name] : null;
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

    let odds: number;

    switch (this.selectedBetType) {
      case BetTypes.OVER_UNDER:
        odds = -110;
        break;

      case BetTypes.POINT_SPREAD:
        odds = -110;
        break;

      case BetTypes.MONEYLINE:
        if (!this.selectedTeam || !this.selectedTeam.odds) {
          this.potentialWinnings = 0;
          return;
        }
        odds = parseFloat(this.selectedTeam.odds);
        break;

      default:
        this.potentialWinnings = 0;
        return;
    }

    if (odds > 0) {
      this.potentialWinnings = (amount * odds) / 100;
    } else {
      this.potentialWinnings = (amount * 100) / Math.abs(odds);
    }
  }

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

  onAmountInput($event: Event, name: string) {
    
  }

  formatAmountOnBlur(name: string) {
    
  }
}
