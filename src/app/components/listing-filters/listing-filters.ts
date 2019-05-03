import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'listing-filters',
  templateUrl: 'listing-filters.html'
})
export class ListingFilters {

  filters: any = {
    sort: 'user-rating',
    radius: 30
  }

  constructor(public navParams: NavParams, public viewCtrl: ViewController) {
    console.log('Hello ListingFilters Component');

    this.filters = this.navParams.get('filters');
  }

  close() {
    this.viewCtrl.dismiss(this.filters);
  }
 
}
