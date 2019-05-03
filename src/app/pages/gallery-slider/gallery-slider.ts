import { DomSanitizer } from '@angular/platform-browser';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, ViewController, NavController, NavParams, Slides, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';

// Services
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { HelperService } from '../../providers/helper';

@IonicPage()
@Component({
  selector: 'page-gallery-slider',
  templateUrl: 'gallery-slider.html',
})
export class GallerySliderPage {

  dataParams: any;
  pageParams: any;
  items: Array<any> = [];
  type: string = '';
  initialSlide: any;
  currentPage: any;
  mediaSize = '';
  key: any;
  direction: boolean = true;

  @ViewChild(Slides) slides: Slides;

  private href: any = [];

  constructor(
    public viewCtrl: ViewController,
    public statusBar: StatusBar,
    public navCtrl: NavController,
    public domSanitizer: DomSanitizer,
    public navParams: NavParams,
    public apiService: APIService,
    public configService: ConfigService,
    public events: Events,
    private helperService: HelperService
  ) {

    this.items = navParams.get('items');
    this.type = navParams.get('type');
    this.currentPage = navParams.get('currentPage');
    this.initialSlide = navParams.get('initialSlide');
    this.mediaSize = navParams.get('mediaSize');
    this.direction = this.configService.get('langDir') === 'ltr' ? true : false;

    if (navParams.get('type') == 'photo') {
      this.pageParams = Object.assign({}, configService.getPageDefaults('photosPage').pageParams, navParams.get('pageParams'));
      this.dataParams = Object.assign({}, configService.getPageDefaults('photosPage').dataParams, navParams.get('dataParams'));
    } else {
      this.pageParams = Object.assign({}, configService.getPageDefaults('videosPage').pageParams, navParams.get('pageParams'));
      this.dataParams = Object.assign({}, configService.getPageDefaults('videosPage').dataParams, navParams.get('dataParams'));
    }
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.hide();
    this.key = this.initialSlide;
  }

  ionViewWillLeave() {
    this.helperService.queueRequest(this.href);
    console.log('Gallery Slider ionViewWillLeave');
  }

  ionViewWillUnload() {
    this.items = [];
    console.log('Gallery Slider ionViewWillUnload');
  }  

  endChange() {
    this.key = this.slides.getActiveIndex();
  }

  slideEnd() {
    if (this.currentPage) {

      if (this.type === 'photo') {
        this.dataParams['page'] = this.currentPage + 1;
        this.apiService.getPhotos(this.dataParams).subscribe(data => {
          this.currentPage = data.photos.pagination.current_page;
          // Running this event automatically refreshes the 'items' array in the gallery modal
          this.events.publish('loadmorephotos', data);
        });
      } else if (this.type === 'video') {

        this.dataParams['page'] = this.currentPage + 1;
        this.apiService.getVideos(this.dataParams).subscribe(data => {
          this.currentPage = data.videos.pagination.current_page;
          // Running this event automatically refreshes the 'items' array in the gallery modal
          this.events.publish('loadmorevideos', data);
        });

      }

      this.slides.update();
    }
  }

  closeModal($event) {
    if ($event.direction === 8 || $event.direction === 16) {
      if ($event.velocityX >= -0.65 || $event.velocityX <= 0.65) {
        this.viewCtrl.dismiss();
      }
    }
  }

  closeView() {
    this.viewCtrl.dismiss();
  }

  toListingDetail(id) {
    if (id) {
      this.navCtrl.pop().then(() => {
        this.navCtrl.push('ListingDetailPage', {
          dataParams: { listing_id: id }
        });
      })
    }
  }

}
