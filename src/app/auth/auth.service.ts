import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

import { AuthData } from './auth-data.interface';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';

const BECKEND_URL = environment.apiUrl + '/users/';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private isAuthenticated = false;
    private token!: string;
    private tokenTimer: any;
    private userId!: string;
    private authStatusListener = new Subject<boolean>();

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    getToken() { return this.token; }

    getIsAuth() { return this.isAuthenticated; }

    getUserId() { return this.userId; }

    getAuthStatusListener() { return this.authStatusListener.asObservable(); }

    createUser(email: string, password: string) {
        const authData: AuthData = { email, password };
        return this.http.post(BECKEND_URL + 'signup', authData)
        .subscribe(response => {
            this.router.navigate(['/login']);
        }, error => {
            this.authStatusListener.next(false);
        });
    }

    loginUser(email: string, password: string) {
        const authData: AuthData = { email, password };
        this.http.post<{token: string, expiresIn: number, userId: string}>(BECKEND_URL + 'login', authData).subscribe(response => {
            const token = response.token
            this.token = token;
            if (token) {
                const expiresInDuration = response.expiresIn;
                this.setAuthTimer(expiresInDuration);
                this.isAuthenticated = true;
                this.userId = response.userId;
                this.authStatusListener.next(true);
                const now = new Date();
                const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
                
                this.saveAuthData(token, expirationDate, this.userId);
                this.router.navigate(['/']);
            }
        }, error => {
            this.authStatusListener.next(false);
        });
    }

    autoAuthUser() {
        const authInformation = this.getAuthData();
        if(authInformation) {
            const now = new Date();
            const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
            if (expiresIn > 0) {
                this.token = authInformation.token;
                this.isAuthenticated = true;
                this.userId = authInformation.userId!;
                this.setAuthTimer(expiresIn / 1000);
                this.authStatusListener.next(true);
            }
        }
    }

    logout() {
        this.token = '';
        this.isAuthenticated = false;
        this.authStatusListener.next(false);
        clearTimeout(this.tokenTimer);
        this.userId = '';
        this.clearAuthData();
        this.router.navigate(['/']);
    }

    private setAuthTimer(duration: number) {
        this.tokenTimer = setTimeout(() => {
            this.logout();
        }, duration * 1000);
    }

    private saveAuthData(token: string, expiresDate: Date, userId: string) {
        localStorage.setItem('token', token);
        localStorage.setItem('expiration', expiresDate.toISOString());
        localStorage.setItem('userId', userId);
    }

    private clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('expiration');
        localStorage.removeItem('userId');
    }

    private getAuthData() {
        const token = localStorage.getItem('token');
        const expirationDate = localStorage.getItem('expiration');
        const userId = localStorage.getItem('userId');
        if (!token || !expirationDate) {
            return;
        }

        return { 
            token: token,
            expirationDate: new Date(expirationDate),
            userId: userId
        }
    }
}