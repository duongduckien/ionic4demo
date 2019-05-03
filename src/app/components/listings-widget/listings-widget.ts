import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { ConfigService } from '../../providers/config';

@Component({
  selector: 'listings-widget',
  templateUrl: 'listings-widget.html'
})
export class ListingsWidget {

  @Input('isLoggedIn') isLoggedIn;
  @Input('listings') listings;
  @Input('layout') layout;

  @Output('onToggleFavorite') onToggleFavoriteEmitter = new EventEmitter();

  constructor(
    public navCtrl: NavController,
    public configService: ConfigService
  ) {

  }

  goToListingDetail(listing: any) {

    this.navCtrl.push('ListingDetailPage', {
      listing: listing,
      dataParams: { listing_id: listing.id },
      pageParams: {}
    });
  }

  toggleFavorite(index) {
    this.onToggleFavoriteEmitter.emit(index);
  }

  allowsFavorites(listing) {
    return this.configService.getListingTypeSetting(listing.listing_type.id, 'favorites');
  }
}
