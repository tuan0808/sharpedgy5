import {Component, computed, effect, ElementRef, HostListener, inject, Signal, signal, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {DatePipe} from "@angular/common";

import {TabData} from "../../../shared/model/paper-betting/TabData";

@Component({
  selector: 'app-betting-history',
  standalone: true,
  imports: [
    FormsModule,
  ],
  templateUrl: './betting-history.component.html',
  styleUrl: './betting-history.component.scss'
})
export class BettingHistoryComponent {
  private tabContainerRef!: ElementRef;
  canScrollLeft = false;
  canScrollRight = false;

  @ViewChild('tabContainer') set content(content: ElementRef) {
    if (content) {
      this.tabContainerRef = content;
      this.checkScrollButtons();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScrollButtons();
  }

  activeTab: string = 'received';
  tabStyle: string = 'classic';

  tabData: TabData[] = [
    {id: 'received', label: 'Payments Received', amount: '$3,121.21', count: 111},
    {id: 'upcoming', label: 'Upcoming Payments', amount: '$20.00', count: 1},
    {id: 'pastdue', label: 'Past Due', amount: '$39.99', count: 3},
    {id: 'refunded', label: 'Refunded', amount: '$1.00', count: 1},
    {id: 'stopped', label: 'Stopped', amount: '$105.05', count: 20}
  ];

  availableStyles = ['classic', 'pills', 'modern', 'cards'];

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  setTabStyle(style: string): void {
    this.tabStyle = style;
  }

  getActiveTabData(): TabData | undefined {
    return this.tabData.find(tab => tab.id === this.activeTab);
  }

  formatStyleName(style: string): string {
    return style.charAt(0).toUpperCase() + style.slice(1);
  }

  scrollTabs(direction: 'left' | 'right'): void {
    const container = this.tabContainerRef.nativeElement;
    const scrollAmount = container.clientWidth / 2;

    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }

    // Wait for scroll animation to complete
    setTimeout(() => this.checkScrollButtons(), 100);
  }

  checkScrollButtons(): void {
    if (!this.tabContainerRef) return;

    const container = this.tabContainerRef.nativeElement;

    // Check if scrolling is possible
    this.canScrollLeft = container.scrollLeft > 0;
    this.canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth);
  }
}
