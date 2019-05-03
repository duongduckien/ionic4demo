import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ToastController, LoadingController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';
import { TranslateService } from '@ngx-translate/core';

// Services
import { AuthService } from '../../providers/auth';
import { ConfigService } from '../../providers/config';
import { HelperService } from '../../providers/helper';
import { ValidationService } from '../../providers/validation';
import { APIService } from '../../providers/api';

@IonicPage()
@Component({
  selector: 'page-auth-account',
  templateUrl: 'auth-account.html'
})
export class AuthAccountPage {

  dataParams: any;
  pageParams: any;

  isGuestSubmit: boolean = false;
  isUserSubmit: boolean = false;

  isRegisterSubmit: boolean = false;

  toggle: boolean = false;

  register_account = {
    name: '',
    display_name: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  userFbPermission = ['email'];

  loading = this.loadingCtrl.create();

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public translate: TranslateService,
    public authService: AuthService,
    public helperService: HelperService,
    public configService: ConfigService,
    public validationService: ValidationService,
    public apiService: APIService,
    public fb: Facebook,
    public googlePlus: GooglePlus
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('authAccountPage').pageParams, this.navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('authAccountPage').dataParams, this.navParams.get('dataParams'));  
  }

  guest: { name: string, email: string } = {
    name: '',
    email: '',
  }

  account: { email: string, password: string } = {
    email: '',
    password: ''
  };

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
  }

  /**
   * Login with facebook
   */
  async loginFacebook() {
    
    this.loading.present();

    try {

      let resultOfFb: FacebookLoginResponse = await this.fb.login(this.userFbPermission);
      let resultOfApi = await this.fb.api('/me?fields=id,name,email', this.userFbPermission);

      if (resultOfApi.email) {

        await this.authService.loginFacebook({
          token: resultOfFb.authResponse.accessToken,
          email: resultOfApi.email
        });

        if (this.navParams.get('callback')) {
          this.navParams.get('callback')(this.loading);
          this.helperService.setMessage(this.translate.instant("LOGGED_IN"));
        }

      } else {
        await this.fb.logout();
        this.authService.logout();
        this.helperService.setMessage(this.translate.instant("LOGIN_FAILED_NOT_EMAIL"));
        this.loading.dismiss();      
      }

    } catch (e) {
      this.authService.logout();
      this.helperService.setMessage(this.translate.instant("LOGIN_FAILED"));
      this.loading.dismiss();      
    }

  }

  /**
   * Login with google
   */
  async loginGoogle() {

    this.loading.present();
    
    try {

      let resultOfGoogle = await this.googlePlus.login({ 'webClientId': this.configService.webClientId });
      await this.authService.loginGoogle({ token: resultOfGoogle.idToken});
      
      if (this.navParams.get('callback')) {
        this.navParams.get('callback')(this.loading);
        this.helperService.setMessage(this.translate.instant("LOGGED_IN"));
      }

    } catch (e) {
      console.log(e);
      await this.googlePlus.logout();
      this.authService.logout();
      this.helperService.setMessage(this.translate.instant("LOGIN_FAILED"));

      this.loading.dismiss();
    }

  }

  continueAsGuest() {
    this.isGuestSubmit = true;
    if (this.guest.name === '') {
      this.helperService.setMessage(this.translate.instant("REQUIRED_FIELD", { field: 'name' }));
    } else if (this.guest.email === '') {
      this.helperService.setMessage(this.translate.instant("REQUIRED_FIELD", { field: 'email' }));
    } else if (!this.validationService.isEmail(this.guest.email)) {
      this.helperService.setMessage(this.translate.instant("INVALID_EMAIL"));
    } else {
      
      if (this.navParams.get('callback')) {
        this.navParams.get('callback')(null,this.guest);
      }

    }
  }

  continueAsUser() {

    this.isUserSubmit = true;
    let loader = this.loadingCtrl.create({
      content: this.translate.instant("AUTHENTICATING"),
    });

    loader.present();

    this.authService.login(this.account).then((result) => {
      
      if (this.navParams.get('callback')) {
        this.navParams.get('callback')(loader,this.guest);
        this.helperService.setMessage(this.translate.instant("LOGGED_IN"));
      }
  
    }, (err) => {
      let errors = JSON.parse(err._body);

      this.processErrors(errors);

      loader.dismiss();
    });

  }  

  register() {

    this.toggle = true;

    let loader = this.loadingCtrl.create({
      content: this.translate.instant("CREATING_ACCOUNT"),
    });

    loader.present();

    this.isRegisterSubmit = true;

    this.authService.createAccount(this.register_account).then((result) => {
      
      this.helperService.setMessage(result);

      if (this.navParams.get('callback')) {
        this.navParams.get('callback')(loader);
        this.helperService.setMessage(this.translate.instant("LOGGED_IN"));
      }

    }, (err) => {
      let errors = JSON.parse(err._body);

      this.processErrors(errors);

      loader.dismiss();
    });
  }

  gotoRegister() {
    this.toggle = true;
  }

  backToLogin() {
    this.toggle = false;
  }

  processErrors(errors) {
    let flag = true;
    let message = '';

    for (let key in errors.fields) {
      if (errors.fields[key].length > 0 && flag) {
        errors.fields[key].forEach(el => {
          switch (el) {
            case '101':
              message = this.translate.instant("REQUIRED_FIELD", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
              break;
            case '102':
              message = this.translate.instant("REQUIRED_NUMBER", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
              break;
            case '105':
              message = this.translate.instant("EXISTED_FIELD", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
              break;
            case '107':
              message = this.translate.instant("INVALID_EMAIL", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
              break;
            case '114':
              message = this.translate.instant("UNIQUE_FIELD", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
              break;
            case '115':
              message = this.translate.instant("CONFIRMATION", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
              break;
            case '117':
              message = this.translate.instant("MIN_LENGTH", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
              break;
            default:
              message = this.translate.instant("REGISTRATION_FAILED");
              flag = false;
          }
        });
      }
    }

    this.helperService.setMessage(message);    
  }
}
