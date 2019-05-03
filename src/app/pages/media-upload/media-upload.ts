import { Component } from '@angular/core';
import { Platform, IonicPage, NavController, NavParams, Events, ToastController, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';

// Services
import { ConfigService } from '../../providers/config';
import { HelperService } from '../../providers/helper';
import { AuthService } from '../../providers/auth';

@IonicPage()
@Component({
  selector: 'page-media-upload',
  templateUrl: 'media-upload.html',
})
export class MediaUploadPage {

  dataParams: any;
  pageParams: any;

  images: any = [];

  options: CameraOptions = {
    quality: 100,
    destinationType: this.camera.DestinationType.DATA_URL,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE
  }

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events, 
    public camera: Camera,
    public translate: TranslateService,
    public configService: ConfigService,
    public authService: AuthService,
    public helperService: HelperService,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController
    ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('loginPage'), navParams.get('pageParams'));
    this.dataParams = Object.assign({}, navParams.get('dataParams'));

  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
  }

  addPhoto() {

    this.platform.ready().then(() => {

      this.camera.getPicture(this.options).then((imageData) => {
        let base64Image = 'data:image/jpeg;base64,' + imageData;
        this.images.push(base64Image);
      }, (err) => {
        this.helperService.setMessage(err);
      });

    });

  }

}
