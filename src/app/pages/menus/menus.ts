import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';

// Services
import { ConfigService } from '../../providers/config';

@IonicPage()
@Component({
  selector: 'page-menus',
  templateUrl: 'menus.html'
})
export class MenusPage {

  dataParams: any;
  pageParams: any;
  menus: any;

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events, 
    public configService: ConfigService
    ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('widgetsPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('widgetsPage').dataParams, navParams.get('dataParams'));

    this.menus = configService.morePages;
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
  }

  openPage(page) {
    page.params['toggleStatusBar'] = false;
    this.navCtrl.push(page.component, page.params);
  }

}
