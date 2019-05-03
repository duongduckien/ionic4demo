import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

// Providers
import { ConfigService } from '../../providers/config';

@Component({
  selector: 'listings-grid',
  templateUrl: 'listings-grid.html'
})
export class ListingsGrid {

  @Input('listing') listing;
  @Output('onGoToListingDetail') onGoToListingDetailEmitter = new EventEmitter();
  @Output('onToggleFavorite') onToggleFavoriteEmitter = new EventEmitter();

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public configService: ConfigService
  ) {
  }

  goToListingDetail(listing) {
    this.onGoToListingDetailEmitter.emit(listing);
  }

  toggleFavorite(listing) {
    this.onToggleFavoriteEmitter.emit(listing);
  }

  allowsFavorites(listing) {
    return this.configService.getListingTypeSetting(listing.listing_type.id, 'favorites');
  }
}

