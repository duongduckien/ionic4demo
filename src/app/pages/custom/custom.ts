import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { DomSanitizer } from '@angular/platform-browser';

// Services
import { ConfigService } from '../../providers/config';

@IonicPage()
@Component({
  selector: 'page-custom',
  templateUrl: 'custom.html'
})
export class CustomPage {

  dataParams: any;
  pageParams: any;
  html: any;

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events,
    public configService: ConfigService,
    public domSanitizer: DomSanitizer
  ) {
    this.pageParams = Object.assign({}, configService.getPageDefaults('customPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('customPage').dataParams, navParams.get('dataParams'));  
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);

    if (this.pageParams.pageHtml) {
      this.html = this.pageParams.pageHtml;
    }
  }
}
