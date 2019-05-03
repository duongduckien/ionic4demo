import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, LoadingController, ToastController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';

// Services
import { HelperService } from '../../providers/helper';
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { ListingFavoriteService } from '../../providers/listing-favorite';

@IonicPage()
@Component({
  selector: 'page-search',
  templateUrl: 'search.html'
})

export class SearchPage {

  dataParams: any = {};
  pageParams: any = {
    search: [
      'listings',
      'reviews'
    ]
  };

  searchMode: string = 'listings';
  showListings: boolean = false;
  showReviews: boolean = false;
  listingsMessage: boolean = false;
  reviewsMessage: boolean = false;

  loader_listings: any;
  loader_reviews: any;

  listingSearch: any = {
    object: 'listing',
    q: '',
    excludes:'summary,description,fields,field_groups,directory',    
    limit: 10
  };

  reviewSearch: any = {
    object: 'review',
    q: '',
    limit: 10
  };

  listings: any = [];
  reviews: any = [];

  listingsPagination: any = {
    total: 0
  };
  reviewsPagination: any = {
    total: 0
  };

  isLoggedIn: boolean = false;
  isSubmit: boolean = false;

  private listingsService: any;
  private reviewsService: any;

  private href: any = [];

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events, 
    public helperService: HelperService,
    public apiService: APIService,
    public configService: ConfigService,
    public listingFavorite: ListingFavoriteService,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public authService: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController
    ) {

    this.pageParams = _.merge({}, configService.getPageDefaults('searchPage').pageParams, this.pageParams, navParams.get('pageParams'));
    this.dataParams = _.merge({}, configService.getPageDefaults('searchPage').dataParams, this.dataParams, navParams.get('dataParams'));

    if (this.pageParams.search.indexOf('listings') !== -1) {
      this.searchMode = 'listings';
    } else {
      this.searchMode = 'reviews';
    }
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
  }

  ionViewWillEnter() {
    this.authService.authenticated().then(value => {
      this.isLoggedIn = value;
      if(this.searchMode === 'listings' && this.isSubmit) {
        this.findListings();
        this.isSubmit = false;
      } else if(this.searchMode === 'reviews' && this.isSubmit) {
        this.findReviews();
        this.isSubmit = false;
      }      
    }); 
  }

  ionViewWillLeave() {
    this.helperService.queueRequest(this.href);
    if (this.reviewsService) {
      this.reviewsService.unsubscribe();
    }
    if (this.listingsService) {
      this.listingsService.unsubscribe();
    }
    console.log('SEARCH ionViewWillLeave');    
  }

  findListings(infiniteScroll?) {

    if (infiniteScroll === undefined) {

      this.showListings = false;
      
      const params = Object.assign(this.listingSearch, this.dataParams);

      this.presentLoadingListings();
      
      this.listingsService = this.apiService.search(params).subscribe(data => {
        this.listingsMessage = false;
        this.loader_listings.dismiss();
        this.listingsPagination = data.listings.pagination;
        let resultOfPrepare = this.helperService.prepareListingsThumbs(data.listings.items, _.get(this.pageParams,'mediaSize','small'));
        this.listings = resultOfPrepare.listingsData;
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(data.listings.items, 'owner'));
        this.showListings = true;
      }, err => {
        this.loader_listings.dismiss();
        this.listingsMessage = true;
        this.showListings = false;
      });
    } else if (infiniteScroll && this.listingsPagination.links.next !== undefined) {      
      this.listingsService = this.apiService.getByUrlWithHeaders(this.listingsPagination.links.next).subscribe(data => {
        let newListings = [];
        this.listingsPagination = data.listings.pagination;
        infiniteScroll.complete();
        let resultOfPrepare = this.helperService.prepareListingsThumbs(data.listings.items, _.get(this.pageParams,'mediaSize','small'));
        newListings = resultOfPrepare.listingsData;
        this.listings = this.listings.concat(newListings);
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(newListings, 'owner'));
      });
    } else {
      this.refreshListingFavorites();
    }    
  }

  findReviews(infiniteScroll?) {

    if (infiniteScroll === undefined) {

      this.showReviews = false;

      const params = Object.assign(this.reviewSearch, this.dataParams);
      this.isSubmit = true;
      this.presentLoadingReviews();

      this.reviewsService = this.apiService.search(params).subscribe((data) => {
        this.reviewsMessage = false;
        this.loader_reviews.dismiss();
        this.reviewsPagination = data.reviews.pagination;
        this.reviews = data.reviews.items;
        this.showReviews = true;
      }, (err) => {
        this.loader_reviews.dismiss();
        this.reviewsMessage = true;
        this.showReviews = false;
      });

      this.isSubmit = false;

    } else if (infiniteScroll && this.reviewsPagination.links.next !== undefined) {      
      this.reviewsService = this.apiService.getByUrlWithHeaders(this.reviewsPagination.links.next).subscribe(data => {
        this.reviews = this.reviews.concat(data.reviews.items);
        this.reviewsPagination = data.reviews.pagination;
        infiniteScroll.complete();
      });
    }

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
      .changeState(listing);
  }

 goToReviewDetail(review: any) {
    this.navCtrl.push('ReviewDetailPage', {
        review: review,
        goToListing: true,
        dataParams: { review_id: review.id },
        pageParams: {}
    });
  }

  presentLoadingListings() {
    this.loader_listings = this.loadingCtrl.create();
    this.loader_listings.present();
  }

  presentLoadingReviews() {
    this.loader_reviews = this.loadingCtrl.create();
    this.loader_reviews.present();
  }

  moreResults() {
    let res = false;
    if ( this.searchMode === 'listings' && (this.listingsPagination.total > this.listings.length) ) {
      res = true;
    } else if (this.searchMode === 'reviews' && (this.reviewsPagination.total > this.reviews.length)) {
      res = true;
    }
    return res;
  }

  findResults(event) {
    if (this.searchMode == 'listings') {
      this.findListings(event);
    } else {
      this.findReviews(event);
    }
  }

  refreshListingFavorites() {
    if (this.isLoggedIn && this.listings.length > 0) {
      this.listingFavorite.addBackFavoriteState(this.listings);
    }    
  }   
}