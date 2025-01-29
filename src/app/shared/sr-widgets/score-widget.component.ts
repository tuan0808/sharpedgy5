/**
 * HI Tuan,
 * I figured you might find this while ur rooting around in the doc, I was toying with the idea, this is
 * literally a straight conversion using AI basically taking their code and asking it to convert it to angular (With some additional details)
 *
 * The literal HTML Call would look something like this
 * <app-scores-widget
 *       [sportInput]="SportConfig.NFL"
 *       [matchIdInput]="12345"
 *       [borderInput]="true"
 *       [languageInput]="'en_us'"
 *     ></app-scores-widget>
 *
 *     When we want a different sport all we have to do is change the sportInput = to the sport we want and we're good.
 *
 *     Anyway Leme know what you think.
 */

import {Component, computed, ElementRef, inject, Input, PLATFORM_ID, Renderer2, signal} from '@angular/core';
import {getSportName, SportConfig} from "../model/widgets/SportConfig";
import {isPlatformBrowser} from "@angular/common";
import {WidgetService} from "./widget.service";

@Component({
  selector: 'app-score-widget',
  standalone: true,
  imports: [],
  template: `
    <div 
      #widgetContainer 
      class="sr-widget" 
      [attr.data-sr-widget]="effectiveWidgetType" 
      [attr.data-sr-border]="border" 
      [attr.data-sr-match-id]="matchId">
    </div>
  `,
  styles: [`
    .sr-widget {
      width: 100%;
      max-width: 600px;
    }
  `]
})
export class ScoreWidgetComponent {
  // Widget configuration inputs
  @Input() sport: SportConfig = SportConfig.NBA;
  @Input() matchId!: number;
  @Input() border: boolean = true;
  @Input() language: string = 'en_us';
  @Input() widgetType?: string; // Optional custom widget type

  // Signals for inputs
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);
  private widgetService = inject(WidgetService);
  isLoading = signal(true);


  // Configurable inputs with signals
  sport = signal<SportConfig>(SportConfig.NBA);
  matchId = signal<number | null>(null);
  border = signal<boolean>(true);
  language = signal<string>('en_us');
  widgetType = signal<string | null>(null);

  // Computed signal for effective widget type
  effectiveWidgetType = computed(() =>
      this.widgetType() ?? this.sport()
  );

  // Computed signal for sport name
  sportName = computed(() =>
      getSportName(this.sport())
  );
  private widgetLoaderScript: HTMLScriptElement | null = null;
  private clientAlias = '<your client alias>'; //TODO IF PLAUSIBLE PUT IN THE DAMN ENVIRONMENT DOC?

  async ngOnInit() {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;

    // Validate match ID
    const matchId = this.matchId();
    if (!matchId) {
      console.error('Match ID is required for the Sportradar widget');
      this.isLoading.set(false);
      return;
    }

    try {
      // Load widget script
      await this.widgetService.loadWidgetScript(
          this.clientAlias,
          this.language()
      );

      // Initialize widget
      await this.widgetService.initializeWidget(
          '#sr-widget',
          this.effectiveWidgetType(),
          {
            border: this.border(),
            matchId,
            language: this.language()
          }
      );

      // Mark loading as complete
      this.isLoading.set(false);
    } catch (error) {
      console.error('Failed to load or initialize Sportradar widget', error);
      this.isLoading.set(false);
    }
  }

  ngOnDestroy() {
    // Potential cleanup logic if needed
  }
}
