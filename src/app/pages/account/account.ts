import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateService } from '@ngx-translate/core';
import { GooglePlus } from '@ionic-native/google-plus';
import { Facebook } from '@ionic-native/facebook';

// Services
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { HelperService } from '../../providers/helper';

@IonicPage()
@Component({
  selector: 'page-account',
  templateUrl: 'account.html'
})
export class AccountPage {

  dataParams: any;
  pageParams: any;
  backgroundColor = '';

  user: any = {};

  isLoggedIn: boolean;

  status: any = {
    enableMyFavorites: false,
    enableMyListings: false,
    enableMyReviews: false
  }

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public translate: TranslateService,
    public configService: ConfigService,
    public helperService: HelperService,
    public authService: AuthService,
    private googlePlus: GooglePlus,
    private facebook: Facebook
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('accountPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('accountPage').dataParams, navParams.get('dataParams'));
    this.status = this.getStatus(this.configService.dataConfig.menus);  

    console.log('ACCOUNT constructor');
  }

  getStatus(menus) {
    let data = {
      enableMyFavorites: false,
      enableMyListings: false,
      enableMyReviews: false
    }
    if (menus.length > 0) {
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].items.length > 0) {
          for (let j = 0; j < menus[i].items.length; j++) {
            if (menus[i].items[j].params.pageParams.enableMyFavorites || menus[i].items[j].params.pageParams.enableMyListings || menus[i].items[j].params.pageParams.enableMyReviews) {
              data = menus[i].items[j].params.pageParams;
              break;
            }
          }
        }
      }
    }
    return data;
  }

  ionViewDidLoad() {
    this.statusBar.overlaysWebView(false);
    this.backgroundColor = this.configService.getHeaderBackgroundHexColor();

    if (!this.authService.isLoggedIn()) {
      this.navCtrl.setRoot('LoginPage');
    }

    this.authService.getMember().then((member) => {
      if (member) {
        this.user = member;
      }
    });

    console.log('ACCOUNT ionViewDidLoad');
  }

  ionViewWillEnter() {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  logout() {
    this.authService.logout();
    if(this.authService.login_type === 'facebook') {
      this.facebook.logout();
    } else if(this.authService.login_type === 'google') {
      this.googlePlus.logout();
    }

    this.helperService.setMessage(this.translate.instant("LOG_OUT_SUCCESS"))
    // Go back to start page on log out
    let startpage = this.configService.dataConfig.menus[0].items[0];
    this.navCtrl.setRoot(startpage.page,startpage.params);
  }

  goToMyListings() {
    this.navCtrl.push('ListingsPage', {
      dataParams: {},
      pageParams: { pageType: 'my-listings', headerTitle: this.translate.instant("ACCOUNT_MY_LISTINGS") }
    });
  }

  goToMyReviews() {
    this.navCtrl.push('ReviewsPage', {
      whichTitle: 'listing',
      dataParams: {},
      pageParams: { myReviews: true, headerTitle: this.translate.instant("ACCOUNT_MY_REVIEWS") }
    });
  }

  goToMyFavorites() {
    this.navCtrl.push('ListingsPage', {
      dataParams: {},
      pageParams: { pageType: 'my-favorites', userId: this.user.id, headerTitle: this.translate.instant("ACCOUNT_MY_FAVORITES") }
    });
  }

}
