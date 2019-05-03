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
  selector: 'page-photos',
  templateUrl: 'photos.html'
})
export class PhotosPage {

  dataParams: any;
  pageParams: any;
  message: string = '';
  loader: any;
  photos: any = [];
  gallery: any = [];
  pagination: any = {
    total: 0
  };

  gridRows: any = [];
  gridColumns = Array(3);

  private photosService: any;

  private href: any = [];

  constructor (
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

    this.pageParams = Object.assign({}, configService.getPageDefaults('photosPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('photosPage').dataParams, navParams.get('dataParams'));

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

    this.events.subscribe('loadmorephotos', (data) => {
      this.processNewPage(data);
    });
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
    this.loadPhotos();
  }

  ionViewWillEnter() {
    this.statusBar.show();
  }

  ionViewDidEnter() {
  }

  ionViewWillLeave() {
    if (this.photosService) {
      this.photosService.unsubscribe();
    }
    this.helperService.queueRequest(this.href);
  }

  ionViewWillUnload() {
    this.photos = [];
    this.gallery = [];
    this.gridRows = [];
    console.log('Photos ionViewWillUnload');
  }

  loadPhotos(infiniteScroll?) {

    if (this.photos.length === 0) {

      this.photosService = this.apiService.getPhotos(this.dataParams).subscribe(data => {
        this.photos = data.photos.items;
        this.pagination = data.photos.pagination;
        let resultOfPrepare = this.helperService.prepareMediaThumbs(this.photos, this.pageParams.mediaSize);
        this.photos = resultOfPrepare.listingsData;
        this.addToGallery(this.photos);
        this.href = _.union(this.href, resultOfPrepare.hrefData);
        this.href = _.union(this.href, this.helperService.prepareAvatar(this.photos, 'user'));
        if (this.pageParams.layout == 'grid') {
          this.gridRows = this.helperService.reformatForGrid(this.photos,this.gridColumns.length);
        }
        this.loader.dismiss();
      });

    } else if (this.pagination.links.next !== undefined) {

      this.photosService = this.apiService.getByUrlWithHeaders(this.pagination.links.next).subscribe(data => {
        if(infiniteScroll) {
          infiniteScroll.complete();
        }
        this.processNewPage(data);
      });
    }

  }

  processNewPage(data) {
    let newPhotos = [];
    let startIndex = this.photos.length;
    this.pagination = data.photos.pagination;
    let resultOfPrepare = this.helperService.prepareMediaThumbs(data.photos.items, this.pageParams.mediaSize);
    newPhotos = resultOfPrepare.listingsData;
    this.addToGallery(newPhotos);
    this.photos = this.photos.concat(newPhotos);
    if (this.pageParams.layout == 'grid') {
      this.gridRows = this.gridRows.concat(this.helperService.reformatForGrid(newPhotos,this.gridColumns.length,startIndex));
    }
    this.href = _.union(this.href, resultOfPrepare.hrefData);
    this.href = _.union(this.href, this.helperService.prepareAvatar(newPhotos, 'user'));
  }

  addToGallery(newItems) {
    newItems.forEach(item => {
      this.gallery.push({
        url: item.originalImage,
        caption: item.caption,
        date: item.created,
        listing: item.listing.title,
        id: item.listing.id,
        user: item.user.name,
        avatarUrl: item.user.avatar.image
      });
    });
  }

  openPhoto(index) {
    this.navCtrl.push('GallerySliderPage', {
      type: 'photo',
      items: this.gallery,
      pageParams: this.pageParams,
      dataParams: this.dataParams,
      currentPage: this.pagination.current_page,
      initialSlide: index
    });
  }

  morePhotos() {
    return (this.pagination.total > this.photos.length) ? true : false;
  }

  presentLoading() {
    this.loader = this.loadingCtrl.create();
    this.loader.present();
  }

  showUser(photo) {
    return photo.user != null && photo.user !== undefined;
  }

  showCreated(photo) {
    return photo.created != null && photo.user !== undefined;
  }
}
