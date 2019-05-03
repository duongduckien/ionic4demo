import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';

// Services
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { GA } from '../../providers/ga';

@IonicPage()
@Component({
  selector: 'page-directories',
  templateUrl: 'directories.html'
})
export class DirectoriesPage {

  dataParams: any;
  pageParams: any;
  directories: any = [];
  loader: any;

  constructor (
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events,
    public configService: ConfigService,
    public apiService: APIService,
    public loadingCtrl: LoadingController,
    public ga: GA
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('directoriesPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('directoriesPage').dataParams, navParams.get('dataParams'));
  }

  async ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);

    try {

      let result = await this.getDirectories();

      this.directories = result.directories.items;

      // Filter directories by config from Origami
      if (this.dataParams.dir && this.dataParams.dir.length > 0) {

        let listings = [];
        
        if (this.directories.length > 0) {
          for (let i = 0; i < this.directories.length; i++) {
            if (this.dataParams.dir.indexOf(this.directories[i].id) !== -1) {
              listings.push(this.directories[i]);
            }
          }
        }
  
        this.directories = listings;

      }

    } catch (e) {
      console.log(e);
    }

  }

  /**
   * Function get all categories
   */
  getDirectories(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiService.getDirectories().subscribe(res => {
        resolve(res);
      }, err => {
        reject(err);
      });
    });
  }

  /**
   * Function push to category page
   */
  goToCategoriesPage(directory) {
    this.navCtrl.push('CategoriesPage', {
      dataParams: { dir_id: directory.id },
      pageParams: {}
    });
  }

  /**
   * Function tracking with Google Analytics
   */
  trackView(directory) {
    this.ga.gaDirectory(directory.title);
  }

  /**
   * Function create loading
   */
  presentLoading() {
    this.loader = this.loadingCtrl.create();
    this.loader.present();
  }

}
