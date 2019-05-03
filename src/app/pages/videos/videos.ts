import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Events, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import _ from 'lodash';

// Services
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { HelperService } from '../../providers/helper';

@IonicPage()
@Component({
  selector: 'page-videos',
  templateUrl: 'videos.html'
})
export class VideosPage {

  dataParams: any;
  pageParams: any;

  showSpinner: boolean = true;
  message: string = '';

  loader: any;

  videos: any = [];
  gallery: any = [];
  pagination: any = {
    total: 0
  };

  gridRows: any = [];
  gridColumns = Array(3);  

  private videosService: any;

  private href: any = [];

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public apiService: APIService,
    public helperService: HelperService,
    public configService: ConfigService,
    public modalCtrl: ModalController,
    public events: Events,
    public loadingCtrl: LoadingController
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('videosPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('videosPage').dataParams, navParams.get('dataParams'));

    if (this.pageParams.limit) {
      this.dataParams.limit = this.pageParams.limit
    }

    if (_.get(this.pageParams,'mediaSize','') == '') {
      switch (this.pageParams.layout) {
        case 'grid': {
          this.pageParams.mediaSize = 'small';
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

    this.presentLoading();

    this.events.subscribe('loadmorevideos', (data) => {
      this.processNewPage(data);
    });
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
    this.loadVideos();
  }

  ionViewWillEnter() {
    this.statusBar.show();
  }

  ionViewDidEnter() {
  }

  ionViewWillLeave() {
    if (this.videosService) {
      this.videosService.unsubscribe();
    }
    this.helperService.queueRequest(this.href);
  }

  ionViewWillUnload() {
    this.videos = [];
    this.gallery = [];
    this.gridRows = [];
    console.log('Videos ionViewWillUnload');
  }

  loadVideos(infiniteScroll?) {

    // First load
    if (this.videos.length === 0) {

      this.videosService = this.apiService.getVideos(this.dataParams).subscribe(data => {
        this.videos = data.videos.items;
        this.pagination = data.videos.pagination;
        let resultOfPrepare = this.helperService.prepareMediaThumbs(this.videos, this.pageParams.mediaSize);
        this.videos = resultOfPrepare.listingsData;
        this.addToGallery(this.videos);
        this.href = resultOfPrepare.hrefData;
        this.href = _.union(this.href, this.helperService.prepareAvatar(this.videos, 'user'));
        if (this.pageParams.layout == 'grid') {
          this.gridRows = this.helperService.reformatForGrid(this.videos,this.gridColumns.length);
        }
        this.loader.dismiss();
      });

    } else if (this.pagination.links.next !== undefined) {

      this.videosService = this.apiService.getByUrlWithHeaders(this.pagination.links.next).subscribe(data => {
        if(infiniteScroll) {
          infiniteScroll.complete();
        }
        this.processNewPage(data);
      });

    }

  }

  processNewPage(data) {
    let newVideos = [];
    let startIndex = this.videos.length;
    this.pagination = data.videos.pagination;
    let resultOfPrepare = this.helperService.prepareMediaThumbs(data.videos.items, this.pageParams.mediaSize);
    newVideos = resultOfPrepare.listingsData;
    this.addToGallery(newVideos);
    this.videos = this.videos.concat(newVideos);
    if (this.pageParams.layout == 'grid') {
      this.gridRows = this.gridRows.concat(this.helperService.reformatForGrid(newVideos,this.gridColumns.length,startIndex));
    }
    this.href = resultOfPrepare.hrefData;
    this.href = _.union(this.href, this.helperService.prepareAvatar(newVideos, 'user'));
  }

  addToGallery(newItems) {
    newItems.forEach(item => {
      this.gallery.push({
        url: item.video,
        caption: item.caption,
        date: item.created,
        listing: item.listing.title,
        id: item.listing.id,
        user: item.user.name,
        avatarUrl: item.user.avatar.image
      });
    });
  }

  openVideo(index) {
    this.navCtrl.push('GallerySliderPage', {
      type: 'video',
      items: this.gallery,
      pageParams: this.pageParams,
      dataParams: this.dataParams,
      currentPage: this.pagination.current_page,
      initialSlide: index
    });
  }

  moreVideos() {
    return (this.pagination.total > this.videos.length) ? true : false;
  }

  presentLoading() {
    this.loader = this.loadingCtrl.create();
    this.loader.present();
  }

  showUser(video) {
    return video.user != null && video.user !== undefined;
  }

  showCreated(video) {
    return video.created != null && video.user !== undefined;
  }  
}
