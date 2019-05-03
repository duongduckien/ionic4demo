import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ToastController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateService } from '@ngx-translate/core';

// Services
import { APIService } from '../../providers/api';
import { HelperService } from '../../providers/helper';
import { AuthService } from '../../providers/auth';
import { ConfigService } from '../../providers/config';
import { ListingFavoriteService } from '../../providers/listing-favorite';
import { GA } from '../../providers/ga';

// Redux
import { NgRedux, select } from 'ng2-redux';
import { GO_TO_SUB_CAT } from '../../app/actions';

@IonicPage()
@Component({
  selector: 'page-categories',
  templateUrl: 'categories.html'
})
export class CategoriesPage {

  @select('goToSubCat') goToSubCat;

  pageParams: any;
  dataParams: any;
  pagination: any;
  categories: any;
  listings: any = [];
  cat_id: any;
  loader: any;
  flag: any;

  isCatPage: boolean = false;
  isSubCatPage: boolean = false;
  isListingPage: boolean = false;
  isLoggedIn: boolean = false;

  private href: any = [];

  constructor (
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public configService: ConfigService,
    public authService: AuthService,
    public helperService: HelperService,
    public apiService: APIService,
    public loadingCtrl: LoadingController,
    public listingFavorite: ListingFavoriteService,
    public toastCtrl: ToastController,
    public translate: TranslateService,
    public events: Events,
    public ga: GA,
    public ngRedux: NgRedux<any>
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('categoriesPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('categoriesPage').dataParams, navParams.get('dataParams'));

    console.log("pageParams: ", this.pageParams);
    console.log("dataParams: ", this.dataParams);

    this.isLoggedIn = this.authService.isLoggedIn();

    this.goToSubCat.subscribe(data => {
      this.flag = data;
    })

  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);

    this.presentLoading();

    this.apiService.getCategories(this.dataParams).subscribe(data => {

      this.loader.dismiss();

      if (data.hasOwnProperty('categories')) {

        this.isCatPage = true;
        this.categories = data.categories.items;

        // Get subcategories
        this.categories.forEach(parentCategory => {

          if (parentCategory.children_count > 0) {

            parentCategory.subcategories = [];

            this.apiService.getByUrl(parentCategory.href, 'subCategories', this.dataParams).subscribe(category => {
              if (category.children.length) {
                parentCategory.subcategories = category.children;
              }
            });

          }

        });

      } else if (data.hasOwnProperty('children') && data.children_count > 0) {

        this.isSubCatPage = true;
        this.categories = data;

      } else if (data.hasOwnProperty('children') && data.children_count === 0) {

        this.navCtrl.push('ListingsPage', {
          dataParams: { cat: this.dataParams.cat_id  },
          pageParams: {}
        });

      }

    });
  }

  ionViewWillEnter() {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  /**
   * Function action favorite
   */
  onToggleFavorite(data) {
    this.listingFavorite
      .addApiService(this.apiService)
      .changeState(this.listings[data.index]);
  }

  /**
   * Function push to listing page
   */
  goToListingsPage(category) {
    if (!this.flag) {
      this.navCtrl.push('ListingsPage', {
        dataParams: { cat: category.id },
        pageParams: {}
      });
    }
  }

  /**
   * Function push to listing page
   */
  goToListingsSubPage(category) {
    this.ngRedux.dispatch({ type: GO_TO_SUB_CAT, payload: true });
    this.navCtrl.push('ListingsPage', { 
      dataParams: { cat: category.id },
      pageParams: {}
    });
  }

  /**
   * Function tracking with Google Analytics
   */
  trackView(category) {
    this.ga.gaCategory(category.title);
  }

  /**
   * Function create loading
   */
  presentLoading() {
    this.loader = this.loadingCtrl.create();
    this.loader.present();
  }

  /**
   * Function run request thumbnail before leave page
   */
  ionViewWillLeave() {
    this.helperService.queueRequest(this.href);
  }

}
