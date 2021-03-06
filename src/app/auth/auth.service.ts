import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { User } from './user.model';

export interface AuthResponseData {
    kind: string,
    idToken: string,
    email: string,
    refreshToken: string,
    expiresIn: string,
    localId: string,
    registered?: boolean 
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    user = new BehaviorSubject<User>(null);
    
    
    constructor(private http: HttpClient){}
    
    signupUser(email: string, password: string){
        return this.http.post<AuthResponseData>(
            'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyCu8PBDsz7KrKIV1O_EYSYFgutJb7CH_qw',
            {email: email,
             password: password,
             returnSecureToken: true
            })
            .pipe(catchError(this.handleError), tap(resData => {
                this.handleAuth(resData.email, resData.localId, resData.idToken, +resData.expiresIn);
            }));
    }
    
    login(email: string, password: string){
        return this.http.post<AuthResponseData>('https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyCu8PBDsz7KrKIV1O_EYSYFgutJb7CH_qw',
            {email: email,
             password: password,
             returnSecureToken: true
            })
            .pipe(catchError(this.handleError),  tap(resData => {
                this.handleAuth(resData.email, resData.localId, resData.idToken, +resData.expiresIn);
            }));
    }
    
    private handleAuth(email: string, userId: string, token: string, expiresIn: number){
        const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
        const user = new User(email, userId, token, expirationDate);
        this.user.next(user);
    }
    
    private handleError(errorRes: HttpErrorResponse){
        let errorMessage = "An unknown error occurred";
        if(!errorRes.error || !errorRes.error.error){
            return throwError(errorMessage);
        }
        switch (errorRes.error.error.message){
            case 'EMAIL_EXISTS':
                errorMessage = "This email exists already";
                break;
            case 'EMAIL_NOT_FOUND':
                errorMessage = 'This email does not exist'
                break;
            case "INVALID_PASSWORD":
                errorMessage = "The password is incorrect"
                break;
        }
        return throwError(errorMessage);
    }
}