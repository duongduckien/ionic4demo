import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';

import { ConfigService } from '../../providers/config';

@IonicPage()
@Component({
  selector: 'layout-tabs',
  templateUrl: 'tabs.html'
})
export class TabsLayout {

  tabPages: any;
  tabsBg: string;
  menus: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public configService: ConfigService
    ) {

    this.tabPages = this.configService.tabPages;

    this.tabsBg = this.configService.get('tabsBg');

    this.menus = this.configService.morePages;

  }

  ionViewDidLoad() {
    console.log(this.tabPages);
    console.log(this.tabsBg);
    console.log('ionViewDidLoad TabsLayout');
  }

}
