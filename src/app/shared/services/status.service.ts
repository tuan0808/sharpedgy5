import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

interface SystemStatus {
    status: 'operational' | 'partial' | 'offline' | 'unknown';
    message: string;
    subMessage: string;
}

interface System {
    name: string;
    icon: string;
    status: 'operational' | 'partial' | 'offline' | 'unknown';
    components?: ComponentStatus[];
    description?: string;
    uptime?: Uptime;
    incident?: Incident;
}

interface ComponentStatus {
    name: string;
    icon: string;
    description: string;
    status: 'operational' | 'partial' | 'offline' | 'unknown';
    lastUpdated: string;
}

interface Uptime {
    percentage: number;
    outages: number;
    downtime: string;
}

interface Incident {
    message: string;
    time: string;
}

interface ActuatorHealthResponse {
    status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';
    components?: Record<string, { status: string }>;
}

@Injectable({
    providedIn: 'root'
})
export class StatusService {
    private baseUrl = 'http://localhost:9080';
    private sportRadarBaseUrl = 'https://api.sportradar.com';

    constructor(private http: HttpClient) {}

    // Fetch all system statuses
    getStatuses(): Observable<System[]> {
        return forkJoin([
            this.getSportsDataApiStatus(),
            this.getDashboardStatus(),
            this.getPaperBettingStatus(),
            this.getAuthenticationStatus()
        ]).pipe(
            map(([sportsData, dashboard, paperBetting, authentication]) => [
                sportsData,
                dashboard,
                paperBetting,
                authentication
            ]),
            catchError(() => of(this.getFallbackStatuses()))
        );
    }

    // Fetch overall system status based on individual statuses
    getOverallStatus(): Observable<SystemStatus> {
        return this.getStatuses().pipe(
            map(systems => {
                const hasOffline = systems.some(s => s.status === 'offline' || (s.components && s.components.some(c => c.status === 'offline')));
                const hasPartial = systems.some(s => s.status === 'partial' || (s.components && s.components.some(c => c.status === 'partial')));

                if (hasOffline) {
                    return {
                        status: 'partial' as const,
                        message: 'Some systems are experiencing issues',
                        subMessage: 'We\'re working to resolve the affected services'
                    };
                } else if (hasPartial) {
                    return {
                        status: 'partial' as const,
                        message: 'Some systems are degraded',
                        subMessage: 'We\'re monitoring the affected services'
                    };
                } else {
                    return {
                        status: 'operational' as const,
                        message: 'All systems operational',
                        subMessage: 'All services are running normally'
                    };
                }
            }),
            catchError(() => of({
                status: 'unknown' as const,
                message: 'Unable to fetch status',
                subMessage: 'Please try again later'
            }))
        );
    }

    // Sports Data API with components (NFL, NBA, MLB, NHL)
    private getSportsDataApiStatus(): Observable<System> {
        return forkJoin({
            gateway: this.http.get<any>(`${this.baseUrl}/apisix/status`).pipe(
                tap(response => console.log('Gateway response:', response)),
                catchError(() => of({ health: 'ERROR' }))
            ),
            system: this.http.get<ActuatorHealthResponse>(`${this.baseUrl}/status/core`).pipe(
                tap(response => console.log('System response:', response)),
                catchError(() => of({ status: 'DOWN' }))
            ),
            nfl: this.http.get<any>(`${this.sportRadarBaseUrl}/nfl/status`).pipe(
                tap(response => console.log('NFL response:', response)),
                catchError(() => of({ apiStatus: 'ERROR', lastChecked: new Date().toISOString() }))
            ),
            nba: this.http.get<any>(`${this.sportRadarBaseUrl}/nba/status`).pipe(
                tap(response => console.log('NBA response:', response)),
                catchError(() => of({ apiStatus: 'ERROR', lastChecked: new Date().toISOString() }))
            ),
            mlb: this.http.get<any>(`${this.sportRadarBaseUrl}/mlb/status`).pipe(
                tap(response => console.log('MLB response:', response)),
                catchError(() => of({ apiStatus: 'ERROR', lastChecked: new Date().toISOString() }))
            ),
            nhl: this.http.get<any>(`${this.sportRadarBaseUrl}/nhl/status`).pipe(
                tap(response => console.log('NHL response:', response)),
                catchError(() => of({ apiStatus: 'ERROR', lastChecked: new Date().toISOString() }))
            )
        }).pipe(
            map(({ gateway, system, nfl, nba, mlb, nhl }) => {
                const components: ComponentStatus[] = [
                    {
                        name: 'NFL Data',
                        icon: 'fas fa-football-ball',
                        description: 'Live scores, stats, and odds for NFL games',
                        status: this.mapSportRadarStatus(nfl.apiStatus || nfl.status || 'UNKNOWN'),
                        lastUpdated: nfl.lastChecked || new Date().toISOString()
                    },
                    {
                        name: 'NBA Data',
                        icon: 'fas fa-basketball-ball',
                        description: 'Live scores, stats, and odds for NBA games',
                        status: this.mapSportRadarStatus(nba.apiStatus || nba.status || 'UNKNOWN'),
                        lastUpdated: nba.lastChecked || new Date().toISOString()
                    },
                    {
                        name: 'MLB Data',
                        icon: 'fas fa-baseball-ball',
                        description: 'Live scores, stats, and odds for MLB games',
                        status: this.mapSportRadarStatus(mlb.apiStatus || mlb.status || 'UNKNOWN'),
                        lastUpdated: mlb.lastChecked || new Date().toISOString()
                    },
                    {
                        name: 'NHL Data',
                        icon: 'fas fa-hockey-puck',
                        description: 'Live scores, stats, and odds for NHL games',
                        status: this.mapSportRadarStatus(nhl.apiStatus || nhl.status || 'UNKNOWN'),
                        lastUpdated: nhl.lastChecked || new Date().toISOString()
                    }
                ];

                const hasOffline = components.some(c => c.status === 'offline');
                const hasPartial = components.some(c => c.status === 'partial');
                const systemStatus = this.mapActuatorStatus(system.status) === 'operational' && this.mapGatewayStatus(gateway.status || gateway.health || 'ERROR') === 'operational' ? 'operational' : 'partial';
                const overallStatus = hasOffline ? 'offline' : hasPartial ? 'partial' : systemStatus;

                return {
                    name: 'Sports Data API',
                    icon: 'fas fa-chart-line',
                    status: overallStatus as 'operational' | 'partial' | 'offline' | 'unknown',
                    components,
                    uptime: { percentage: 98.5, outages: 3, downtime: '10h 57m' }, // Mocked
                    incident: hasOffline || hasPartial ? {
                        message: 'Some sports data APIs are experiencing issues.',
                        time: 'Identified recently'
                    } : undefined
                };
            })
        );
    }

    // Dashboard status (Spring Boot Actuator)
    private getDashboardStatus(): Observable<System> {
        return this.http.get<ActuatorHealthResponse>(`${this.baseUrl}/management/dashboard/health`).pipe(
            tap(response => console.log('Dashboard response:', response)),
            map(response => ({
                name: 'Dashboards',
                icon: 'fas fa-tachometer-alt',
                status: this.mapActuatorStatus(response.status),
                description: 'User interface for displaying betting data and analytics',
                uptime: { percentage: 97.2, outages: 4, downtime: '20h 10m' }, // Mocked
                incident: response.status !== 'UP' ? {
                    message: 'Some dashboard features are currently unavailable.',
                    time: 'Identified recently'
                } : undefined
            })),
            catchError(() => of({
                name: 'Dashboards',
                icon: 'fas fa-tachometer-alt',
                status: 'unknown' as const,
                description: 'User interface for displaying betting data and analytics',
                uptime: { percentage: 97.2, outages: 4, downtime: '20h 10m' },
                incident: { message: 'Unable to fetch dashboard status.', time: 'Just now' }
            }))
        );
    }

    // Paper Betting status (Spring Boot Actuator)
    private getPaperBettingStatus(): Observable<System> {
        return this.http.get<ActuatorHealthResponse>(`${this.baseUrl}/management/actuator/health`).pipe(
            tap(response => console.log('Paper Betting response:', response)),
            map(response => ({
                name: 'Paper Betting',
                icon: 'fas fa-money-bill-wave',
                status: this.mapActuatorStatus(response.status),
                description: 'Fantasy betting platform with virtual currency',
                uptime: { percentage: 99.7, outages: 1, downtime: '2h 10m' }, // Mocked
                incident: response.status !== 'UP' ? {
                    message: 'Paper betting system is experiencing issues.',
                    time: 'Identified recently'
                } : undefined
            })),
            catchError(() => of({
                name: 'Paper Betting',
                icon: 'fas fa-money-bill-wave',
                status: 'unknown' as const,
                description: 'Fantasy betting platform with virtual currency',
                uptime: { percentage: 99.7, outages: 1, downtime: '2h 10m' },
                incident: { message: 'Unable to fetch paper betting status.', time: 'Just now' }
            }))
        );
    }

    // Authentication status (Spring Boot Actuator)
    private getAuthenticationStatus(): Observable<System> {
        return this.http.get<ActuatorHealthResponse>(`${this.baseUrl}/management/actuator/health`).pipe(
            tap(response => console.log('Authentication response:', response)),
            map(response => ({
                name: 'Login & Authentication',
                icon: 'fas fa-sign-in-alt',
                status: this.mapActuatorStatus(response.status),
                description: 'User login, registration, and session management',
                uptime: { percentage: 99.9, outages: 1, downtime: '43m' }, // Mocked
                incident: response.status !== 'UP' ? {
                    message: 'Authentication services are experiencing issues.',
                    time: 'Identified recently'
                } : undefined
            })),
            catchError(() => of({
                name: 'Login & Authentication',
                icon: 'fas fa-sign-in-alt',
                status: 'unknown' as const,
                description: 'User login, registration, and session management',
                uptime: { percentage: 99.9, outages: 1, downtime: '43m' },
                incident: { message: 'Unable to fetch authentication status.', time: 'Just now' }
            }))
        );
    }

    // Map Spring Boot Actuator status
    private mapActuatorStatus(status: string): 'operational' | 'partial' | 'offline' | 'unknown' {
        switch (status?.toUpperCase()) {
            case 'UP':
                return 'operational';
            case 'OUT_OF_SERVICE':
                return 'partial';
            case 'DOWN':
                return 'offline';
            default:
                return 'unknown';
        }
    }

    // Map SportRadar API status
    private mapSportRadarStatus(status: string): 'operational' | 'partial' | 'offline' | 'unknown' {
        switch (status?.toUpperCase()) {
            case 'OK':
            case 'UP':
                return 'operational';
            case 'DEGRADED':
            case 'MAINTENANCE':
            case 'OUT_OF_SERVICE':
                return 'partial';
            case 'ERROR':
            case 'DOWN':
                return 'offline';
            default:
                return 'unknown';
        }
    }

    // Map Gateway status
    private mapGatewayStatus(status: string): 'operational' | 'partial' | 'offline' | 'unknown' {
        switch (status?.toUpperCase()) {
            case 'OK':
            case 'UP':
                return 'operational';
            case 'MAINTENANCE':
            case 'OUT_OF_SERVICE':
                return 'partial';
            case 'ERROR':
            case 'DOWN':
                return 'offline';
            default:
                return 'unknown';
        }
    }

    // Fallback statuses in case of complete failure
    public getFallbackStatuses(): System[] {
        return [
            {
                name: 'Sports Data API',
                icon: 'fas fa-chart-line',
                status: 'unknown',
                components: [
                    { name: 'NFL Data', icon: 'fas fa-football-ball', description: 'Live scores, stats, and odds for NFL games', status: 'unknown', lastUpdated: new Date().toISOString() },
                    { name: 'NBA Data', icon: 'fas fa-basketball-ball', description: 'Live scores, stats, and odds for NBA games', status: 'unknown', lastUpdated: new Date().toISOString() },
                    { name: 'MLB Data', icon: 'fas fa-baseball-ball', description: 'Live scores, stats, and odds for MLB games', status: 'unknown', lastUpdated: new Date().toISOString() },
                    { name: 'NHL Data', icon: 'fas fa-hockey-puck', description: 'Live scores, stats, and odds for NHL games', status: 'unknown', lastUpdated: new Date().toISOString() }
                ],
                uptime: { percentage: 0, outages: 0, downtime: 'Unknown' },
                incident: { message: 'Unable to fetch sports data API status.', time: 'Just now' }
            },
            {
                name: 'Dashboards',
                icon: 'fas fa-tachometer-alt',
                status: 'unknown',
                description: 'User interface for displaying betting data and analytics',
                uptime: { percentage: 0, outages: 0, downtime: 'Unknown' },
                incident: { message: 'Unable to fetch dashboard status.', time: 'Just now' }
            },
            {
                name: 'Paper Betting',
                icon: 'fas fa-money-bill-wave',
                status: 'unknown',
                description: 'Fantasy betting platform with virtual currency',
                uptime: { percentage: 0, outages: 0, downtime: 'Unknown' },
                incident: { message: 'Unable to fetch paper betting status.', time: 'Just now' }
            },
            {
                name: 'Login & Authentication',
                icon: 'fas fa-sign-in-alt',
                status: 'unknown',
                description: 'User login, registration, and session management',
                uptime: { percentage: 0, outages: 0, downtime: 'Unknown' },
                incident: { message: 'Unable to fetch authentication status.', time: 'Just now' }
            }
        ];
    }
}
