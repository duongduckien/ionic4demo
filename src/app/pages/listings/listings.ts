import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ToastController, Events, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { StatusBar } from '@ionic-native/status-bar';
import _ from 'lodash';

// Services
import { HelperService } from '../../providers/helper';
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { ListingFavoriteService } from '../../providers/listing-favorite';

// Redux
import { GO_TO_SUB_CAT } from '../../app/actions';
import { NgRedux, select } from 'ng2-redux';

@IonicPage()
@Component({
  selector: 'page-listings',
  templateUrl: 'listings.html'
})
export class ListingsPage {

  @select() loginStatus;

  dataParams: any;
  pageParams: any;
  fromComponent: any;

  message: string = '';
  loader: any;
  user: any = {};
  apiMethod: string;
  listings: any = [];
  gridRows: any = [];
  gridColumns = Array(2);
  pagination: any = {
    total: 0
  };

  isLoggedIn: boolean = false;

  private listingsService: any;

  private href: any = [];

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public configService: ConfigService,
    public authService: AuthService,
    public helperService: HelperService,
    public apiService: APIService,
    public listingFavorite: ListingFavoriteService,
    public translate: TranslateService,
    public toastCtrl: ToastController,
    public events: Events,
    public ngRedux: NgRedux<any>,
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('listingsPage').pageParams, navParams.get('pageParams'));
    this.dataParams = _.merge(configService.getPageDefaults('listingsPage').dataParams, { excludes:'summary,description,fields,field_groups,directory' }, navParams.get('dataParams'));

    if (_.get(this.pageParams,'mediaSize','') == '') {
      switch (this.pageParams.layout) {
        case 'list': {
          this.pageParams.mediaSize = 'small';
          break;
        }
        case 'grid': {
          this.pageParams.mediaSize = 'medium';
          break;
        }
        case 'card': {
          this.pageParams.mediaSize = 'medium';
          break;
        }
        default: {
          this.pageParams.mediaSize = 'medium';
          break;
        }
      }
    }

    switch(this.pageParams.pageType) {
      case 'my-listings':
        this.apiMethod = 'getAuthUserListings';
      break;
      case 'my-favorites':
        this.apiMethod = 'getAuthUserListingsFavorites';
      break;
      default:
        this.apiMethod = 'getListings';
      break;
    }    

    this.fromComponent = navParams.get('fromComponent');

    if(this.fromComponent){
      this.dataParams.limit = this.pageParams.limit;
    }

    this.presentLoading();

    console.log('LISTINGS constructor');    
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
    this.ngRedux.dispatch({ type: GO_TO_SUB_CAT, payload: false });
    console.log('LISTINGS ionViewDidLoad');    
  }

  ionViewWillEnter() { 
    if (this.navParams.get('toggleStatusBar') === undefined) {
      this.events.publish('page.statusbartoggle');
    }
    this.authService.authenticated().then(value => {
      this.isLoggedIn = value;
      this.loadListings();
    });
    console.log('LISTINGS ionViewWillEnter');
  }

  ionViewDidEnter() {
    console.log('LISTINGS ionViewDidEnter');    
  }

  ionViewWillLeave() {
    if (this.listingsService) {
      this.listingsService.unsubscribe();
    }
    this.helperService.queueRequest(this.href);
     console.log('LISTINGS ionViewWillLeave');    
  }  

  ionViewWillUnload() {
    this.listings = [];
    this.gridRows = [];
    console.log('LISTINGS ionViewWillUnload');
  }

  onGoToListingDetail(listing) {

    this.navCtrl.push('ListingDetailPage', {
      listing: listing,
      dataParams: { listing_id: listing.id },
      pageParams: {}
    });
  }

  onToggleFavorite(listing) {

      this.listingFavorite
          .addApiService(this.apiService)
          .changeState(listing)
          .then( () => {
              console.log(this.pageParams.pageType,listing.me.favorite);
              // In the MyFavorites page instantly remove the listing from the list
              if (this.pageParams.pageType == 'my-favorites' && !listing.me.favorite) {
                this.listings.splice(_.findIndex(this.listings,{'id':listing.id}), 1);
              }
            }
          );
  }

  /**
   * Function get all listings  
   */
  loadListings(infiniteScroll?) {
    if (this.listings.length === 0) {
      this.listingsService = this.apiService[this.apiMethod](this.dataParams,this.pageParams.userId).subscribe(data => {
        if(data.listings.items.length > 0) {
          this.listings = data.listings.items;
          this.pagination = data.listings.pagination;
          let resultOfPrepare = this.helperService.prepareListingsThumbs(this.listings, this.pageParams.mediaSize);
          this.listings = resultOfPrepare.listingsData;
          this.href = _.union(this.href, resultOfPrepare.hrefData);
          this.href = _.union(this.href, this.helperService.prepareAvatar(this.listings, 'owner'));
          if (this.pageParams.layout == 'grid') {
            this.gridRows = this.helperService.reformatForGrid(this.listings,this.gridColumns.length);
          }
          this.loader.dismiss();
        } else {
          this.loader.dismiss();
          this.helperService.setMessage(this.translate.instant('NO_LISTING'));
        }
      }, err => {
        this.loader.dismiss();
        this.helperService.setMessage(this.translate.instant('NO_LISTING'));
      });
    } else if (infiniteScroll && this.pagination.links.next !== undefined) {
      this.listingsService = this.apiService.getByUrlWithHeaders(this.pagination.links.next).subscribe(data => {
        let newListings = [];
        infiniteScroll.complete();
        this.pagination = data.listings.pagination;
        let resultOfPrepare = this.helperService.prepareListingsThumbs(data.listings.items, this.pageParams.mediaSize);
        newListings = resultOfPrepare.listingsData;
        this.listings = this.listings.concat(newListings);
        if (this.pageParams.layout == 'grid') {
          this.gridRows = this.gridRows.concat(this.helperService.reformatForGrid(newListings,this.gridColumns.length));
        }
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(newListings, 'owner'));
      });
    }
    else if (this.isLoggedIn && this.listings.length > 0 && this.pageParams.pageType == 'my-favorites') {
      
      this.refreshListingFavorites();

      this.listings.forEach((listing,index) => {
        if (!listing.me.favorite) {
          this.listings.splice(index, 1);
          this.pagination.total--;
        }
      });
    } else {
      console.log('HERE');
      this.refreshListingFavorites();
    }

  }

  moreListings() {
    return (this.pagination.total > this.listings.length) ? true : false;
  }

  toggleSearchbar() {
    this.pageParams.hideSearchbar = !this.pageParams.hideSearchbar;
  }

  searchListings(ev) {
    if (ev.q.length > 2 || (ev.lat && ev.lng)) {
      let searchParams = {
        object: 'listing'
      }
      searchParams = Object.assign(searchParams, ev);
      this.listings = [];
      this.pagination = { total: 0 };
      this.message = '';
      this.presentLoading();
      this.apiService.search(searchParams).subscribe(data => {

        this.listings = data.listings.items;
        this.pagination = data.listings.pagination;
        this.loader.dismiss();
        let resultOfPrepare = this.helperService.prepareListingsThumbs(this.listings, this.pageParams.mediaSize);
        this.listings = resultOfPrepare.listingsData;
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(this.listings, 'owner'));

      }, (error) => {
        this.loader.dismiss();
        this.message = this.translate.instant('NO_LISTING');
      });
    }
  }

  presentLoading() {
    this.loader = this.loadingCtrl.create();
    this.loader.present();
  }

  refreshListingFavorites() {
    if (this.isLoggedIn && this.listings.length > 0) {
      this.listingFavorite.addBackFavoriteState(this.listings);
    }    
  }  

}
