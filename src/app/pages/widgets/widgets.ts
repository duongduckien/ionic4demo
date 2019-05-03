import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import _ from 'lodash';

// Services
import { HelperService } from '../../providers/helper';
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { APIService } from '../../providers/api';
import { GA } from '../../providers/ga';
import { ListingFavoriteService } from '../../providers/listing-favorite';

@IonicPage()
@Component({
  selector: 'page-widgets',
  templateUrl: 'widgets.html'
})
export class WidgetsPage {

  dataParams: any;
  pageParams: any;

  widgets: any = [];

  isLoggedIn: boolean = false;

  private widgetsService: any = [];

  private href: any = [];

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public apiService: APIService,
    public configService: ConfigService,
    public authService: AuthService,
    public helperService: HelperService,
    public listingFavorite: ListingFavoriteService,
    public events: Events,
    public ga: GA
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('widgetsPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('widgetsPage').dataParams, navParams.get('dataParams'));

    this.ga.gaMenus('Home');
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
    this.authService.authenticated().then(value => {
      this.isLoggedIn = value;
      this.loadData();
    });

    console.log('WIDGETS ionViewDidLoad');    
  }

  ionViewWillEnter() {
    if (this.navParams.get('toggleStatusBar') === undefined) {
      this.events.publish('page.statusbartoggle');
    }
    this.authService.authenticated().then(value => {
      this.isLoggedIn = value;
      if (this.isLoggedIn) {
        this.refreshListingFavorites();
      }
    });
    console.log('WIDGETS ionViewWillEnter');
  }

  ionViewDidEnter() {
    this.statusBar.overlaysWebView(false);
    console.log('WIDGETS ionViewDidEnter');
  }

  ionViewWillLeave() {
    this.helperService.queueRequest(this.href);
    this.widgetsService.forEach(widget => {
      widget.unsubscribe();
    });
    console.log('WIDGETS ionViewWillLeave');
  }

  onToggleFavorite(listingIndex, widgetIndex) {

    let listing = this.widgets[widgetIndex].data[listingIndex];

    this.listingFavorite
      .addApiService(this.apiService)
      .changeState(listing);
  }

  loadData() {

    this.widgets = this.pageParams.widgets;

    if (this.widgets) {

      this.widgets.forEach((widget, index) => {

        if (widget.type === 'ListingsPage') {

          widget.dataParams = _.merge({ excludes:'summary,description,fields,field_groups,directory' }, widget.dataParams);

          let mediaSize = _.get(widget.widgetParams,'mediaSize','small');

          this.widgetsService[index] = this.apiService.getListings(widget.dataParams).subscribe(result => {

            let resultOfPrepare = this.helperService.prepareListingsThumbs(result.listings.items, mediaSize);
            result.listings.items = resultOfPrepare.listingsData;
            this.href = _.union(this.href, resultOfPrepare.hrefData);
            this.href = _.union(this.href, this.helperService.prepareAvatar(result.listings.items, 'owner'));

            this.widgets[index].data = result.listings.items;
          });

        } else if (widget.type === 'ReviewsPage') {

          let mediaSize = _.get(widget.widgetParams,'mediaSize',widget.widgetParams.layout == 'slider' ? 'medium' : 'small');

          this.widgetsService[index] = this.apiService.getReviews(widget.dataParams).subscribe(result => {

            let resultOfPrepare = this.helperService.prepareReviewsThumbs(result.reviews.items, mediaSize);
            result.reviews.items = resultOfPrepare.listingsData;
            this.href = _.union(this.href, resultOfPrepare.hrefData);
            this.href = _.union(this.href, this.helperService.prepareAvatar(result.reviews.items, 'reviewer'));

            this.widgets[index].data = [];
            this.widgets[index].data = result.reviews.items;
          });

        }
        
      });
    
    }
  }

  refreshListingFavorites() {
    if (this.isLoggedIn && this.widgets.length > 0) {

      this.widgets.forEach((value, index) => {
        if (value.type === 'ListingsPage') {
          // Update favorite state for logged in user
          if (this.widgets[index].data !== undefined) {
            this.listingFavorite.addBackFavoriteState(this.widgets[index].data);            
          }      
        }
      });
    }    
  }

  toPage(pageType, dataParams, title) {
    this.navCtrl.push(pageType, {
      toggleStatusBar: false,
      whichTitle: 'listing',
      fromComponent: true,
      dataParams: dataParams,
      pageParams: {
        headerTitle: title
      }
    });
  }
}
