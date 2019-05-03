import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, LoadingController, AlertController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

// Services
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { HelperService } from '../../providers/helper';
import { ValidationService } from '../../providers/validation';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  dataParams: any;
  pageParams: any;
  isSubmit: boolean = false;

  account: {email: string, password: string} = {
    email: '',
    password: ''
  };

  userFbPermission = ['email'];
  loading = this.loadingCtrl.create();

  constructor (
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events,
    public translate: TranslateService,
    public configService: ConfigService,
    public authService: AuthService,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public validationService: ValidationService,
    public helperService: HelperService,
    public fb: Facebook,
    public googlePlus: GooglePlus
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('loginPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('loginPage').dataParams, navParams.get('dataParams'));
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
  }

  login() {

    this.isSubmit = true;

    let loader = this.loadingCtrl.create({
      content: this.translate.instant("AUTHENTICATING"),
    });

    loader.present();

    this.authService.login(this.account).then((result) => {

      loader.dismiss();

      this.helperService.setMessage(result);

      this.navCtrl.setRoot('AccountPage');

    }, (err) => {

      let errors = JSON.parse(err._body);

      let flag = true;
      let message = '';
      if(errors.error.hasOwnProperty('http_code')){
        message = this.translate.instant("LOGIN_FAILED");
        flag = false;
      }

      for (let key in errors.fields) {
        if (errors.fields[key].length > 0 && flag) {
          errors.fields[key].forEach(el => {
            if( el === '101'){
              message = this.translate.instant("REQUIRED_FIELD", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
            } else if( el === '102'){
              message = this.translate.instant("REQUIRED_NUMBER", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
            } else if( el === '105'){
              message = this.translate.instant("EXISTED_FIELD", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
            } else if( el === '107'){
              message = this.translate.instant("INVALID_EMAIL", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
            } else if( el === '114'){
              message = this.translate.instant("UNIQUE_FIELD", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
            } else if( el === '115'){
              message = this.translate.instant("CONFIRMATION", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
            } else if( el === '117'){
              message = this.translate.instant("MIN_LENGTH", { field: this.validationService.removeStringFromArray(['-', '_'], key) });
              flag = false;
            }
          });
        }
      }

      this.helperService.setMessage(message);

      loader.dismiss();

    });

  }

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

        await this.navCtrl.setRoot('AccountPage');

      } else {
        await this.fb.logout();
        await this.navCtrl.setRoot('LoginPage');
        this.helperService.setMessage(this.translate.instant("LOGIN_FAILED_NOT_EMAIL"));
        
      }

    } catch (e) {
      console.log('login failed',e);
      this.helperService.setMessage(this.translate.instant("LOGIN_FAILED"));
    } finally {
      this.loading.dismiss();
    }

  }

  async loginGoogle() {

    this.loading.present();

    try {

      let resultOfGoogle = await this.googlePlus.login({ 'webClientId': this.configService.webClientId });
      await this.authService.loginGoogle({ token: resultOfGoogle.idToken });
      await this.navCtrl.setRoot('AccountPage');

    } catch (e) {
      console.log('login failed',e);
      await this.googlePlus.logout();
      this.helperService.setMessage(this.translate.instant("LOGIN_FAILED"));
    } finally {
      this.loading.dismiss();
    }

  }

  goToRegisterPage() {
    this.navCtrl.push('RegisterPage', {
        dataParams: {},
        pageParams: { pageTitle: this.translate.instant("CREATE_AN_ACCOUNT") }
    });
  }

}
