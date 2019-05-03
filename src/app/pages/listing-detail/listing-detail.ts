import { Component, ElementRef, Renderer, ViewChild, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Platform, IonicPage, Content, NavController, NavParams, LoadingController, ToastController, Events } from 'ionic-angular';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { StatusBar } from '@ionic-native/status-bar';
import { NgRedux, select } from 'ng2-redux';
import _ from 'lodash';

// Services
import { TranslateService } from '@ngx-translate/core';
import { HelperService } from '../../providers/helper';
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { GA } from '../../providers/ga';
import { ListingFavoriteService } from '../../providers/listing-favorite';
import { WriteReviewService } from '../../providers/write-review/write-review';

@IonicPage()
@Component({
  selector: 'page-listing-detail',
  templateUrl: 'listing-detail.html'
})
export class ListingDetailPage {

  // Global
  @select('listing_type_config') listing_type_config;
  @ViewChild('header') header: ElementRef;
  @ViewChild(Content) content: Content;

  dataParams: any;
  pageParams: any;
  pageSetting = {};
  listingAddress: any = [];
  listingPhone: any = '';

  listing: any;
  loadingUserReviews: boolean = false;
  showMoreUserReviewsLink: boolean = false;
  loadingEditorReviews: boolean = false;
  showMoreEditorReviewsLink: boolean = false;
  reviewSubmission: string = 'none';
  review_photo_upload: any;
  review_submit: any;

  // Check user review & editor review
  user_reviews: any;
  editor_reviews: any;

  showWriteReview: any = false;
  listingTypeId: any;

  loader: any;
  isLoggedIn: boolean = false;
  listingWasLoaded: boolean = false;
  listingCoverLoaded = false;
  fieldsLoaded = false;

  showHeader: boolean = false;

  headerScrollThreshold: number = 400;

  private href: any = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    public zone: NgZone,
    public loadingCtrl: LoadingController,
    public launchNavigator: LaunchNavigator,
    public renderer: Renderer,
    public configService: ConfigService,
    public helperService: HelperService,
    public listingFavorite: ListingFavoriteService,
    public writeReviewService: WriteReviewService,
    public apiService: APIService,
    public sanitizer: DomSanitizer,
    public geolocation: Geolocation,
    public authService: AuthService,
    public toastCtrl: ToastController,
    public ngRedux: NgRedux<any>,
    public events: Events,
    public screenOrientation: ScreenOrientation,
    public translate: TranslateService,
    private statusBar: StatusBar,
    public ga: GA,

  ) {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.dataParams = Object.assign({}, this.configService.getPageDefaults('listingDetailPage').dataParams, this.navParams.get('dataParams'));
    this.pageParams = Object.assign({}, this.configService.getPageDefaults('listingDetailPage').pageParams, this.navParams.get('pageParams'));

    // Re-write the static marker image URL until a setting is added to OrigamiAppBuilder
    this.pageParams.static_map.marker =  this.pageParams.apiBase+'/images/default-marker.png';
  }

  ionViewDidLoad() {

    this.listing = this.navParams.get('listing') || {};
    if (!_.isEmpty(this.listing)) {
      this.processListing();
      this.listingWasLoaded = true;
    }
    console.log('LISTING DETAIL ionViewDidLoad');
  }

  ionViewWillEnter() {
    if(this.content.scrollTop > this.headerScrollThreshold) {
      this.renderer.setElementStyle(this.header.nativeElement, 'display', 'none');
      setTimeout(() => {
        this.renderer.setElementStyle(this.header.nativeElement, 'display', 'block');
      },25);
      this.events.publish('page.statusbartoggle');
    } else {
      this.statusBar.overlaysWebView(true);
    }

    this.authService.authenticated().then(value => {
      this.isLoggedIn = value;

      let listingExists = !_.isEmpty(this.listing);

      if (!listingExists || this.listing.fields === undefined) {
          if (!listingExists) {
            this.loader = this.loadingCtrl.create();
            this.loader.present();
          }
          this.apiService.getListing(this.dataParams).subscribe(data => {
            this.listing = data;
            this.processListing();
            this.listingWasLoaded = true;
          });
      }
    });

    console.log('LISTING DETAIL ionViewWillEnter');
  }

  ionViewDidEnter() {
    this.renderer.setElementStyle(this.header.nativeElement, 'display', 'block');
    if(this.content.scrollTop < this.headerScrollThreshold) {
      this.renderer.setElementStyle(this.header.nativeElement, 'visibility', 'hidden');
    } else {
      this.statusBar.show();
    }
    console.log('LISTING DETAIL ionViewDidEnter');
  }

  ionViewWillLeave() {
    this.statusBar.overlaysWebView(false);
    this.statusBar.backgroundColorByHexString(this.configService.getHeaderBackgroundHexColor());
    this.renderer.setElementStyle(this.header.nativeElement, 'display', 'none');

    this.helperService.queueRequest(this.href);

    console.log('LISTING DETAIL ionViewWillLeave');
  }

  ionViewDidLeave() {
    this.statusBar.overlaysWebView(false);
    console.log('LISTING DETAIL ionViewDidLeave');
  }

  ionViewWillUnload() {
    this.statusBar.overlaysWebView(false);
    this.statusBar.backgroundColorByHexString(this.configService.getHeaderBackgroundHexColor());

    console.log('LISTING DETAIL ionViewWillUnload');
  }

  ngAfterViewInit() {
    this.content.ionScroll.subscribe((event)=>{
      this.zone.run(() => {
        if (event.scrollTop > this.headerScrollThreshold && this.header.nativeElement !== undefined) {
          this.statusBar.overlaysWebView(false);
          this.renderer.setElementStyle(this.header.nativeElement, 'visibility', 'visible');
          this.statusBar.backgroundColorByHexString(this.configService.getHeaderBackgroundHexColor());
        } else {
          this.renderer.setElementStyle(this.header.nativeElement, 'visibility', 'hidden');
          this.statusBar.overlaysWebView(true);
        }
      })
    });
  }

  processListing() {

      let tmp = [];
      tmp.push(this.listing);

      // Prepare thumb for listing cover photo
      let resultOfPrepare = this.helperService.prepareListingsThumbs(tmp, 'large');
      this.listing = resultOfPrepare.listingsData[0];

      // Prepare thumb for listing photos
      if (this.listing.photos.length > 0) {
        let resultOfPrepareMedia = this.helperService.prepareMediaThumbs(this.listing.photos, 'small');
        this.listing.photos = resultOfPrepareMedia.listingsData;
        this.href = _.union(this.href, resultOfPrepareMedia.hrefData);
      }

      // Prepare thumb for listing videos
      if (this.listing.videos.length > 0) {
        let resultOfPrepareMedia = this.helperService.prepareMediaThumbs(this.listing.videos, 'small');
        this.listing.videos = resultOfPrepareMedia.listingsData;
        this.href = _.union(this.href, resultOfPrepareMedia.hrefData);
      }

      this.href = _.union(this.href, resultOfPrepare.hrefData);
      this.href = _.union(this.href, this.helperService.prepareAvatar(tmp, 'owner'));

      this.review_photo_upload = this.listing.permissions.review_photo_upload;
      this.review_submit = this.listing.permissions.create_review;
      this.listingTypeId = this.listing.listing_type.id;
      this.checkReviewPermissions(this.listing);
      this.prepareSubmitReview();
      this.prepareFields();
      this.loadReviews();
      this.processFieldAssignments();

      if (this.loader) {
        this.loader.dismiss();
      }
        
      this.ga.gaListingDetail(this.listing.title);
  }


  processFieldAssignments() {
    let self = this;

    if (this.listing.fields !== undefined) {
    
      let addressFields = _.get(this.pageParams,'fieldAssigment.address',[]);
      let phoneField = _.get(this.pageParams,'fieldAssigment.numberPhone',[]);

      _.forEach(this.listing.fields, function(field) { 
        if (field.selected.length) {
          // Use the index to put the address fields in the correct order
          let index = addressFields.indexOf(field.name);
          if (index !== -1) {
            self.listingAddress[index] = _.map(field.selected, 'text').join(', ');
          }

          if (self.listingPhone == '' && phoneField.indexOf(field.name) !== -1) {
            self.listingPhone = field.selected[0].text;
          }
        }
      });
    }
  }

  // Check reviews of user & editor
  checkReviews(listingData): Promise<any> {

    return new Promise((resolve, reject) => {

      if (listingData.reviews !== undefined) {

        // Check editor
        if (listingData.reviews.editor != null) {

          if (listingData.reviews.editor.comment_count > 0 && listingData.reviews.editor.items === undefined) {
            this.apiService.getReviewsForListing({ listing_id: listingData.id, rtype: 'editor' })
              .subscribe(data => {
                listingData.reviews.editor.items = data.reviews.items;
                resolve(listingData);
              });
          }

        }

      }

    });
  }

  checkReviewPermissions(listing) {
    
    let listingTypeId = this.listing.listing_type.id;

    this.listing_type_config.subscribe(data => {

      for (let i = 0; i < data.listing_types.items.length; i++) {

        if (data.listing_types.items[i].id == listingTypeId) {

          this.user_reviews = data.listing_types.items[i].config.user_reviews;
          this.editor_reviews = data.listing_types.items[i].config.editor_reviews;

          if (this.user_reviews && !this.editor_reviews) {
            this.showWriteReview = true;
          } else if (!this.user_reviews && this.editor_reviews) {
            if (listing.permissions.is_editor) {
              this.showWriteReview = true;
            } else {
              this.showWriteReview = false;
            }
          } else if (this.user_reviews && this.editor_reviews) {
            this.showWriteReview = true;
          }

        }

      }

    })
  }

  allowsReviews() {
    return this.showWriteReview && this.reviewSubmission !== 'none';
  }

  prepareSubmitReview() {

    // Check if reviews/comments submissions are enabled
    let allowComments = this.configService.getListingTypeSetting(this.listing.listing_type.id, 'allow_comments');
    let allowRatings = this.configService.getListingTypeSetting(this.listing.listing_type.id, 'allow_ratings');

    if (allowComments && allowRatings) {
      this.reviewSubmission = 'review';
    } else if (allowComments && !allowRatings) {
      this.reviewSubmission = 'comment';
    } else {
      this.reviewSubmission = 'none';
    }

  }

  prepareFields() {
    if (this.listing.field_groups !== undefined && this.listing.fields !== undefined) {
      let hiddenFieldsArr = this.configService.get('fieldsListingHidden');
      this.listing.field_groups_filtered = [];
      this.listing.field_groups_filtered = this.helperService.fieldGroupFiltered(this.listing.field_groups, this.listing.fields, hiddenFieldsArr);
      this.fieldsLoaded = true;
    }
  }

  /**
   * Function load reviews
   */
  loadReviews() {

    // Load editor reviews
    if (_.get(this.listing,'reviews.editor') && this.listing.reviews.editor.comment_count > 0) {

      this.loadingEditorReviews = true;
      this.apiService.getByUrlWithHeaders(this.listing.reviews.editor.href, this.configService.getReviewLimit()).subscribe(data => {
        this.listing.reviews.editor.items = data.reviews.items;
        this.listing.reviews.editor.pagination = data.reviews.pagination;
        this.loadingEditorReviews = false;
        if (data.reviews.items.length < data.reviews.pagination.total) {
          this.showMoreEditorReviewsLink = true;
        }
      });
    }

    // Load user reviews
    if (_.get(this.listing,'reviews.users') && this.listing.reviews.users.comment_count > 0) {

      this.loadingUserReviews = true;
      this.apiService.getByUrlWithHeaders(this.listing.reviews.users.href, this.configService.getReviewLimit()).subscribe(data => {
        this.listing.reviews.users.items = data.reviews.items;
        this.listing.reviews.users.pagination = data.reviews.pagination;
        this.loadingUserReviews = false;
        if (data.reviews.items.length < data.reviews.pagination.total) {
          this.showMoreUserReviewsLink = true;
        }
      });
    }

  }

  /**
   * Function open images in slider
   */
  openPhoto(currentIndex) {

    this.exitPage(true);

    let tmp = [];

    this.listing.photos.forEach(item => {
      tmp.push({
        url: item.originalImage,
        title: item.caption,
        date: item.created,
        listing: this.listing.title,
        id: null,
        user: item.user.name,
        avatarUrl: item.user.avatar.image
      });
    });

    this.navCtrl.push('GallerySliderPage', {
      type: 'photo',
      items: tmp,
      initialSlide: currentIndex
    });

  }

  /**
   * Function open videos in slider 
   */
  openVideo(currentIndex) {

    this.exitPage(true);

    let tmp = [];

    this.listing.videos.forEach(item => {
      tmp.push({
        type: 'video',
        url: item.video,
        title: '',
        date: item.created,
        listing: item.title,
        id: null,
        user: item.user.name,
        avatarUrl: item.user.avatar.image
      });
    });

    this.navCtrl.push('GallerySliderPage', {
      type: 'video',
      items: tmp,
      initialSlide: currentIndex
    });

  }

  onToggleFavorite() {

    if (!this.isLoggedIn) {
      this.exitPage();
    }

    this.listingFavorite
      .addApiService(this.apiService)
      .changeState(this.listing);
  }

  allowsFavorites() {
    return this.configService.getListingTypeSetting(this.listing.listing_type.id, 'favorites');
  }  

  goToReviewDetail(review: any) {

    this.exitPage();

    this.navCtrl.push('ReviewDetailPage', {
        review: review,
        goToListing: false,
        dataParams: { review_id: review.id },
        pageParams: {}
    });
  }

  writeReview() {

    this.exitPage();

    const dataParams = {
      listing_id: this.listing.id,
      listing_type_id: this.listing.listing_type.id,
      type_id: this.listing.listing_type.id,
      review_photo_upload: this.listing.permissions.review_photo_upload,
      review_submit: this.listing.permissions.review_submit,
      is_editor: this.listing.permissions.is_editor,
      from: 'listing'
    };

    const pageParams = this.pageParams;

    this.writeReviewService
          .addApiService(this.apiService)
          .showForm(this.listing, dataParams, pageParams);
  }

  /**
   * Function get direction
   */
  async getDirection() {

    try {

      let coordinateDestination: number[] = [this.listing.geolocation.lat, this.listing.geolocation.lng];
      
      let optionsPosition: GeolocationOptions = {
        maximumAge: 3600,
        timeout: 10000,
        enableHighAccuracy: false
      }

      let result = await this.geolocation.getCurrentPosition(optionsPosition);

      let coordinateStart: number[] = [result.coords.latitude, result.coords.longitude];

      let options: LaunchNavigatorOptions = {
        start: coordinateStart,
        appSelection: {
          rememberChoice: {
            enabled: false
          },
          dialogHeaderText: this.translate.instant("DIRECTIONS_SELECT_APP"),
          cancelButtonText: this.translate.instant("BTN_CANCEL")
        }
      };

      await this.launchNavigator.navigate(coordinateDestination, options)

    } catch (e) {
      console.log(e);
    }

  }

  showFieldAssignments() {
    return this.showPhoneNumber() || this.showAddress();
  }

  showPhoneNumber() {
    return this.listingPhone != '';
  }

  showAddress() {
    return this.listingAddress.length > 0;
  }

  showGetDirections() {
    return (this.listing.geolocation.lat !== null && this.listing.geolocation.lng !== null) && this.pageParams.directions.enabled;
  }

  /**
   * Function go to direction page
   */
  getPageDirection() {
    this.navCtrl.push('GetDirectionPage', {
      lat: this.listing.geolocation.lat,
      long: this.listing.geolocation.lng,
      data: this.listing
    });
  }

  viewAllReviews(reviewType) {
    this.navCtrl.push('ReviewsPage', {
      whichTitle: 'review',      
      dataParams: {
        listing_id: this.listing.id,
        rtype: reviewType
      }
    });
  }

  backPreviousPage() {
    this.navCtrl.pop();
  }

  exitPage(hide = false) {
    if (hide) {
      this.statusBar.hide();
    }
    this.statusBar.overlaysWebView(false);
    this.statusBar.backgroundColorByHexString(this.configService.getHeaderBackgroundHexColor());
  }
}
