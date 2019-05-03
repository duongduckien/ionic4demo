import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { JwtHelper } from 'angular2-jwt';
import { Http, Headers } from '@angular/http';
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/operator/map';

// Services
import { ValidationService } from './validation';

@Injectable({ providedIn: 'root' })
export class AuthService {

  apiBase: string; // set via the app.component.ts after configuration is loaded

  tokenKey: string = 'origami_token';

  token: string = '';
  user: any;
  loggedIn: boolean = false;

  login_type: string = '';

  jwtHelper: JwtHelper = new JwtHelper();

  constructor(
    public http: Http,
    public translate: TranslateService,
    public validationService: ValidationService,
    public events: Events,
    public storage: Storage
  ) {

  }

  login(account): Promise<any> {

    return new Promise((resolve, reject) => {

      return this.authorize(account).subscribe((data) => {

        this.storeToken(data.token).then(() => {
          resolve(this.translate.instant("LOGGED_IN"));
        });

      }, (error) => {

        reject(error);

      });

    });

  }

  loginFacebook(params): Promise<any> {
    let headers = new Headers();
    headers.append('Content-Type', 'aplication/json');
    return new Promise((resolve, reject) => {
      return this.http.post(this.apiBase + '/authorize/facebook', JSON.stringify(params), {headers: headers}).map(res => res.json()).subscribe(data => {
        this.storeToken(data.token).then(() => {
          this.login_type = 'facebook';
          resolve(data);
        });
      }, error => {
        reject(error);
      });
    });
  }

  logoutFacebook() {
    this.logout();
  }

  loginGoogle(token): Promise<any> {
    let headers = new Headers();
    headers.append('Content-Type', 'aplication/json');
    return new Promise((resolve, reject) => {
      return this.http.post(this.apiBase + '/authorize/google', JSON.stringify(token), {headers: headers}).map(res => res.json()).subscribe(data => {
        this.login_type = 'google';
        this.storeToken(data.token).then(() => {
          resolve(data);
        });
      }, error => {
        reject(error);
      });
    });
  }

  createAccount(account): Promise<any> {
    return new Promise((resolve, reject) => {
      return this.register(account).subscribe((data) => {
        this.login_type = 'general';
        this.storeToken(data.token).then(() => {
          resolve(this.translate.instant("ACCOUNT_CREATED"));
        });
      }, (err) => {
        reject(err);
      });
    });
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  authenticated(): Promise<boolean> {
    return this.storage.get('member').then((value) => {
      return value ? true : false;
    });
  }

  getMember(): Promise<any> {
    return this.storage.get('member').then((value) => {
      return value;
    });
  }
  
  /**
   * Function get token is existed
   */
  getToken(): Promise<string> {

    return new Promise((resolve) => {

      this.checkIfTokenValid().then(() => {
        resolve(this.token);
      });

    });

  }

  storeToken(token): Promise<any> {

    return new Promise((resolve) => {

      this.token = token;
      this.storage.set(this.tokenKey, token);

      let headers = new Headers();
      headers.append('Content-Type', 'aplication/json');
      headers.append('Authorization', 'Bearer ' + token);
      return this.http.get(this.apiBase + '/me', {headers: headers}).map(res => res.json()).subscribe(data => {
        this.storage.set('member',data);
        this.loggedIn = true;
        this.events.publish('user:login');
        resolve();
      });

    });

  }

  logout() {
    this.token = '';
    this.storage.remove(this.tokenKey);
    this.storage.remove('member');
    this.user = {};
    this.loggedIn = false;
    this.events.publish('user:logout');
  }

  getTokenFromStorage(): Promise<any> {

    return new Promise((resolve) => {

      this.storage.get(this.tokenKey).then((token) => {
        if (token) {
          this.token = token;
        }
        this.checkIfTokenValid().then(() => {
          resolve();
        });
      });

    });

  }

  checkIfTokenValid(): Promise<any> {

    return new Promise((resolve) => {
      if (this.token != '') {
        if (!this.jwtHelper.isTokenExpired(this.token)) {
          this.loggedIn = true;
          this.events.publish('user:login');
          resolve();
        } else {
          console.log("AuthService - Token expired");
          return this.refreshAuthToken(this.token).subscribe((data) => {
            console.log("AuthService - Token refreshed");
            this.storeToken(data.token).then(() => {
              resolve();
            });
          }, (error) => {
            console.log("AuthService - Refreshing token failed: ", error);
            this.logout();
            resolve();
          });
        }
      } else {
        this.logout();
        resolve();
      }

    });

  }

  authorize(account) {

    let headers = new Headers();

    headers.append('Content-Type', 'aplication/json');

    return this.http.post(this.apiBase + '/authorize', JSON.stringify(account), {headers: headers})
      .map(res => res.json());

  }

  refreshAuthToken(token) {

    let headers = new Headers();

    headers.append('Content-Type', 'aplication/json');
    headers.append('Authorization', 'Bearer ' + token);

    return this.http.get(this.apiBase + '/authorize/refresh', {headers: headers})
      .map(res => res.json());

  }

  register(account) {

    let headers = new Headers();

    headers.append('Content-Type', 'aplication/json');

    return this.http.post(this.apiBase + '/register', JSON.stringify(account), {headers: headers})
      .map(res => res.json());

  }

}
