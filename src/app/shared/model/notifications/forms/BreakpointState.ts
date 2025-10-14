export interface BreakpointState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
    orientation: 'portrait' | 'landscape';
}
