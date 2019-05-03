import { Component, OnInit } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'map-infowindow',
  templateUrl: 'map-infowindow.html'
})
export class MapInfowindow implements OnInit {

  listing: any = {};

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public events: Events
  ) {
  }

  // Runs before template is loaded
  ngOnInit() {
  }

  goToListingDetail() {

    this.navCtrl.push('ListingDetailPage', {
      listing: this.listing,
      dataParams: {
        listing_id: this.listing.id
      }
    });    
  }
}