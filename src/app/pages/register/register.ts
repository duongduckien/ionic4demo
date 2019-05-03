import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ToastController, LoadingController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

// Services
import { HelperService } from '../../providers/helper';
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { ValidationService } from '../../providers/validation';

@IonicPage()
@Component({
  selector: 'page-register',
  templateUrl: 'register.html'
})
export class RegisterPage {

  dataParams: any;
  pageParams: any;
  isSubmit: boolean = false;

  account: {
    name: string,
    display_name: string,
    email: string,
    password: string,
    password_confirmation: string
  } = {
    name: '',
    display_name: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  validation_name: boolean = true;
  validation_display_name: boolean = true;
  validation_email: boolean = true;
  validation_password: boolean = true;

  userFbPermission = ['email'];
  loading = this.loadingCtrl.create();

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public translate: TranslateService,
    public configService: ConfigService,
    public authService: AuthService,
    public validationService: ValidationService,
    public helperService: HelperService,
    public loadingCtrl: LoadingController,
    public fb: Facebook,
    public googlePlus: GooglePlus
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('registerPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('registerPage').dataParams, navParams.get('dataParams'));

    console.log("pageParams: ", this.pageParams);
    console.log("dataParams: ", this.dataParams);

  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
  }

  register() {
    let loader = this.loadingCtrl.create({
      content: this.translate.instant("CREATING_ACCOUNT"),
    });
    loader.present();

    this.isSubmit = true;
    this.authService.createAccount(this.account).then((result) => {
      console.log(this.account);
      loader.dismiss();
      this.helperService.setMessage(result);
      if (this.dataParams.listing_id && this.dataParams.type_id){
        this.navCtrl.push('WriteReviewPage', {
          dataParams: this.dataParams,
          pageParams: this.pageParams
        });
      } else {
        this.navCtrl.setRoot('AccountPage');
      }
    }, (err) => {
      let errors = JSON.parse(err._body);
      let flag = true;
      let message = '';
      this.validation_name = true;
      this.validation_display_name = true;
      this.validation_email = true;
      this.validation_password = true;
      for (let key in errors.fields) {
        if (errors.fields[key].length > 0 && flag) {
          errors.fields[key].forEach(el => {
            switch(el){
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
            if(el === 'name' && flag === false){
              this.validation_name = false;
            } else if (el === 'display_name' && flag === false){
              this.validation_display_name = false;
            } else if (el === 'email' && flag === false) {
              this.validation_email = false;
            } else if (el === 'password' && flag === false) {
              this.validation_name = false;
            } else if (el === 'password_confirmation' && flag === false) {
              this.validation_name = false;
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

        this.events.publish('user:login');
        await this.navCtrl.setRoot('AccountPage');

      } else {
        await this.fb.logout();
        this.authService.logout();
        this.helperService.setMessage(this.translate.instant("LOGIN_FAILED_NOT_EMAIL"));
      }

    } catch (e) {
      console.log('login failed', e);
      this.authService.logout();
      this.helperService.setMessage(this.translate.instant("LOGIN_FAILED"));
    } finally {
      this.loading.dismiss();
    }

  }

  async loginGoogle() {

    try {

      this.loading.present();

      let resultOfGoogle = await this.googlePlus.login({ 'webClientId': this.configService.webClientId });

      await this.authService.loginGoogle({ token: resultOfGoogle.idToken});
      
      this.events.publish('user:login');
      await this.navCtrl.setRoot('AccountPage');

    } catch (e) {
      console.log('login failed', e);
      this.authService.logout();
    } finally {
      this.loading.dismiss();
    }

  }

}
