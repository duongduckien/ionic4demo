import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, LoadingController, AlertController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';

// Services
import { ConfigService } from '../../providers/config';
import { APIService } from '../../providers/api';
import { AuthService } from '../../providers/auth';
import { ValidationService } from '../../providers/validation';
import { HelperService } from '../../providers/helper';

@IonicPage()
@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  dataParams: any;
  pageParams: any;

  email: { name: string, subject: string, content: string, email: string } = {
    name: '',
    subject: '',
    content: '',
    email: ''
  };

  isLoggedIn: boolean;

  isSubmit: boolean = false;
  showSuccess: boolean = false;

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public configService: ConfigService,
    public apiService: APIService,
    public authService: AuthService,
    public translate: TranslateService,
    public validationService: ValidationService,
    public helperService: HelperService,
    public events: Events
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('contactPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('contactPage').dataParams, navParams.get('dataParams'));

    console.log("pageParams: ", this.pageParams);
    console.log("dataParams: ", this.dataParams);

    this.isLoggedIn = this.authService.isLoggedIn();

  }

  onTextareaChange() {
    this.events.publish('onTextareaChange');
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);

    // Get name & email when logged
    if (this.isLoggedIn) {
      this.apiService.getAuthUserInfo().subscribe(user => {
        this.email.name = user.name;
        this.email.email = user.email;
      });
    }

  }

  sendEmail() {

    this.isSubmit = true;

    let loadding = this.loadingCtrl.create({
      content: this.translate.instant("LOADING")
    });

    loadding.present();

    this.apiService.sendEmail(this.email).subscribe(data => {

      console.log(data);

      if (!this.helperService.isEmpty(data)) {
        loadding.dismiss();
        this.email = { name: '', subject: '', content: '', email: '' };
        this.isSubmit = false;
        this.showSuccess = true;
      }

    }, err => {

      console.log(err);

      loadding.dismiss();

      let errors = err.json();

      if (errors.fields.name !== undefined && errors.fields.name.length > 0) {
        this.messageError(errors.fields.name, 'name').then(result => {
          this.helperService.setMessage(result);
        });
      } else if (errors.fields.email !== undefined && errors.fields.email.length > 0) {
        this.messageError(errors.fields.email, 'email').then(result => {
          this.helperService.setMessage(result);
        });
      } else if (errors.fields.subject !== undefined && errors.fields.subject.length > 0) {
        this.messageError(errors.fields.subject, 'subject').then(result => {
          this.helperService.setMessage(result);
        });
      } else if (errors.fields.content !== undefined && errors.fields.content.length > 0) {
        this.messageError(errors.fields.content, 'message').then(result => {
          this.helperService.setMessage(result);
        });
      }

    });

  }

  messageError(arr, key): Promise<any> {
    return new Promise(resolve => {
      let message = '';
      arr.forEach(element => {
        if (element === '101') {
          message = this.translate.instant("REQUIRED_FIELD", { field: key });
        } else if (element === '107') {
          message = this.translate.instant("INVALID_EMAIL");
        } else if (element === '117') {
          message = this.translate.instant("MIN_LENGTH");
        }
      })
      resolve(message);
    });
  }

}
