import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, LoadingController, ToastController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';

// Services
import { HelperService } from '../../providers/helper';
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';

@IonicPage()
@Component({
  selector: 'page-reviews',
  templateUrl: 'reviews.html'
})
export class ReviewsPage {

  public dataParams: any;
  public pageParams: any;
  public fromComponent: any;
  public whichTitle = '';
  public loader: any;
  public reviews: any = [];
  public pagination: any = {
    total: 0
  };
  public message: string = '';

  private href: any = [];

  constructor (
    public navCtrl: NavController,
    public navParams: NavParams,
    public statusBar: StatusBar,
    public events: Events, 
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public helperService: HelperService,
    public apiService: APIService,
    public configService: ConfigService,
    public translate: TranslateService,
    public toastCtrl: ToastController
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('reviewsPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('reviewsPage').dataParams, navParams.get('dataParams'));

    this.fromComponent = navParams.get('fromComponent');

    this.whichTitle = navParams.get('whichTitle') || 'listing';

    if(this.fromComponent){
      this.dataParams.limit = this.pageParams.limit;
    }

    this.presentLoading();
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
     
    if (this.pageParams.myReviews) {
      this.loadMyReviews();
    } else {
      this.loadReviews();
    }
  }

  ionViewWillLeave() {
    this.helperService.queueRequest(this.href);
  }

  /**
   * Function load reviews
   */
  loadReviews(infiniteScroll?) {

    // First load
    if (this.reviews.length === 0) {

      if(this.dataParams.listing_id){

        this.apiService.getReviewsForListing(this.dataParams).subscribe(data => {

          this.reviews = data.reviews.items;
          this.pagination = data.reviews.pagination;

          let resultOfPrepare = this.helperService.prepareReviewsThumbs(this.reviews, 'small');
          this.reviews = resultOfPrepare.listingsData;
          this.href = _.union(this.href, resultOfPrepare.hrefData);
          this.href = _.union(this.href, this.helperService.prepareAvatar(data.reviews.items, 'reviewer'));

          this.loader.dismiss();

        });

      } else {

        this.apiService.getReviews(this.dataParams).subscribe(data => {
 
          this.reviews = data.reviews.items;
          this.pagination = data.reviews.pagination;

          let resultOfPrepare = this.helperService.prepareReviewsThumbs(this.reviews, 'small');
          this.reviews = resultOfPrepare.listingsData;
          this.href = _.union(this.href, resultOfPrepare.hrefData);
          this.href = _.union(this.href, this.helperService.prepareAvatar(data.reviews.items, 'reviewer'));

          this.loader.dismiss();

        });

      }

    } else if (this.pagination.links.next !== undefined) {

      this.apiService.getByUrlWithHeaders(this.pagination.links.next).subscribe(data => {

        this.reviews = this.reviews.concat(data.reviews.items);
        this.pagination = data.reviews.pagination;

        let resultOfPrepare = this.helperService.prepareReviewsThumbs(this.reviews, 'small');
        this.reviews = resultOfPrepare.listingsData;
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(data.reviews.items, 'reviewer'));

        infiniteScroll.complete();

      });

    }

  }

  /**
   * Function load my reviews
   */
  loadMyReviews(infiniteScroll?) {

    // First load
    if (this.reviews.length === 0) {

      this.apiService.getAuthUserReviews().subscribe(res => {

        this.reviews = res.reviews.items;
        this.pagination = res.reviews.pagination;

        let resultOfPrepare = this.helperService.prepareReviewsThumbs(this.reviews, 'small');
        this.reviews = resultOfPrepare.listingsData;
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(res.reviews.items, 'reviewer'));

        this.loader.dismiss();

      }, err => {

        this.loader.dismiss();
        this.helperService.setMessage(this.translate.instant("NO_REVIEW"));

      });

    } else if (this.pagination.links.next !== undefined) {

      this.apiService.getByUrlWithHeaders(this.pagination.links.next).subscribe(res => {

        this.reviews = this.reviews.concat(res.reviews.items);
        this.pagination = res.reviews.pagination;

        let resultOfPrepare = this.helperService.prepareReviewsThumbs(this.reviews, 'small');
        this.reviews = resultOfPrepare.listingsData;
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(res.reviews.items, 'reviewer'));
        
        infiniteScroll.complete();

      });

    }

  }

  goToReviewDetail(review: any) {
    this.navCtrl.push('ReviewDetailPage', {
        review: review,
        goToListing: this.whichTitle == 'listing',
        dataParams: { review_id: review.id },
        pageParams: {}
    });
  }

  moreReviews() {
    return (this.pagination.total > this.reviews.length) ? true : false;
  }

  presentLoading() {
    this.loader = this.loadingCtrl.create();
    this.loader.present();
  }

}
