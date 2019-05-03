import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';

// Services
import { HelperService } from '../../providers/helper';
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { GA } from '../../providers/ga';
import _ from 'lodash';

@IonicPage()
@Component({
  selector: 'page-review-detail',
  templateUrl: 'review-detail.html'
})
export class ReviewDetailPage {

  dataParams: any;
  pageParams: any;
  listingTypeData: any = {};
  originListingTypeData: any;
  loader: any;
  reviewWasLoaded: boolean = false;
  fieldsLoaded: boolean = false;
  goToListing: boolean = false;

  review: any;
  loadingReviewComments: boolean = false;
  showMoreReviewCommentsLink: boolean = false;

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events, 
    public loadingCtrl: LoadingController,
    public configService: ConfigService,
    public helperService: HelperService,
    public apiService: APIService,
    public ga: GA
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('reviewDetailPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('reviewDetailPage').dataParams, navParams.get('dataParams'));
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);

    this.goToListing = this.navParams.get('goToListing') === true;

    this.review = this.navParams.get('review') || {};
    if (!_.isEmpty(this.review)) {
      this.processReview();
    } 

    console.log('REVIEW DETAIL ionViewDidLoad');
  }

  ionViewWillEnter() {

    if (!this.reviewWasLoaded) {
      if (_.isEmpty(this.review)) {
          this.loader = this.loadingCtrl.create();
          this.loader.present();
          this.apiService.getReview(this.dataParams).subscribe(data => {
            this.review = data;
            this.loader.dismiss();
            this.processReview();
          });
      } else {
        this.processReview();
      }
    }

    console.log('REVIEW DETAIL ionViewWillEnter');
  }  

  processReview() {
      this.loadComments();
      this.prepareFields();
      this.reviewWasLoaded = true;

      this.ga.gaReviewDetail(this.review.listing.title + ' - ' + this.review.title);
  }

  prepareFields() {
    if (this.review.field_groups !== undefined && this.review.fields !== undefined) {
      let hiddenFieldsArr = this.configService.get('fieldReviewsHidden');
      this.review.field_groups_filtered = [];
      this.review.field_groups_filtered = this.helperService.fieldGroupFiltered(this.review.field_groups, this.review.fields, hiddenFieldsArr);
      this.fieldsLoaded = true;
    }
  }

  openPhoto(currentIndex) {
    let tmp = [];
    this.review.photos.forEach(el => {
      tmp.push({
        url: el.image,
        caption: this.review.title,
        date: el.created,
        listing: this.review.listing.title,
        id: null,
        user: this.review.reviewer.name,
        avatarUrl: this.review.reviewer.avatar.image
      });
    });
    this.navCtrl.push('GallerySliderPage', {
      type: 'photo',
      items: tmp,
      initialSlide: currentIndex
    });
  }

  openVideo(currentIndex) {
    let tmp = [];
    this.review.videos.forEach(el => {
      tmp.push({
        url: el.image,
        caption: this.review.title,
        date: el.created,
        listing: this.review.listing.title,
        id: null,
        user: this.review.reviewer.name,
        avatarUrl: this.review.reviewer.avatar.image
      });
    });
    this.navCtrl.push('GallerySliderPage', {
      type: 'video',
      items: tmp,
      initialSlide: currentIndex
    });
  }

  loadComments() {

    if (this.review.discussions === undefined || this.review.discussions.total > 0) {

      this.loadingReviewComments = true;

      if (this.review.discussions === undefined) {

        this.apiService.getReviewComments({review_id: this.review.id}).subscribe(data => {
          this.review.discussions.items = data.comments.items;
          this.loadingReviewComments = false;
          if (data.comments.items.length < data.comments.pagination.total) {
            this.showMoreReviewCommentsLink = true;
          }
        });

      }
      else {

        this.apiService.getByUrlWithHeaders(this.review.discussions.href).subscribe(data => {
          this.review.discussions.items = data.comments.items;
          this.loadingReviewComments = false;
          if (data.comments.items.length < data.comments.pagination.total) {
            this.showMoreReviewCommentsLink = true;
          }
        });

      }
    }

  }

  gotoListingDetail() {
    if (this.goToListing) {
      this.navCtrl.push('ListingDetailPage', {
        dataParams: {
          listing_id: this.review.listing.id
        }
      });
    }
  }

}
