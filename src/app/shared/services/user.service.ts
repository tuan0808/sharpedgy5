import { Injectable, Signal, signal } from '@angular/core';
import { UserData } from '../model/UserData';
import { Observable, of, throwError } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { PartialUser } from '../model/auth/PartialUser';
import { BaseService } from './base.service';
import {map} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class UserService extends BaseService<UserData> {
    protected override apiUrl = 'http://localhost:8080/user/v1';
    protected user = signal<UserData | null>(null);

    constructor() {
        super();
    }

    getUser(uid: string): Observable<UserData | null> {
        return this.get<UserData | null>(
            `${this.apiUrl}/${uid}/getUser`,
            'Failed to fetch user'
        );
    }

    async createUser(user: PartialUser): Promise<void> {
        try {
            const response = await lastValueFrom(
                this.post<string, PartialUser>(
                    `${this.apiUrl}/register`,
                    user,
                    'Failed to register user',
                    { withCredentials: true }
                ).pipe(
                    map(() => true) // Convert text response to boolean
                )
            );
            if (!response) {
                throw new Error('Unexpected response');
            }
        } catch (error) {
            console.error('Failed to register user:', error);
            throw error;
        }
    }

    getRoles(): Observable<any[]> {
        return of([]); // Placeholder
    }

    createRole(roleData: { name: string; description: string }): Observable<boolean> {
        return of(false); // Placeholder
    }

    updateRole(id: number, roleData: { name: string; description: string }): Observable<boolean> {
        return of(false); // Placeholder
    }

    deleteRole(roleId: number): Observable<boolean> {
        return of(false); // Placeholder
    }

    get userSignal(): Signal<UserData | null> {
        return this.user;
    }
}
