import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ConfigService } from '../../providers/config';

@Component({
  selector: 'overall-ratings',
  templateUrl: 'overall-ratings.html'
})
export class OverallRatings implements OnChanges {

  @Input('type') type;
  @Input('size') size;
  @Input('listing') listing;

  reviews: any;

  ratingScale: number = 5;
  ratingPercent: string = '0%';

  ratingStyle: number = 1;
  ratingColor: string = 'blue';

  classes: string[] = [];
  displayRatings: boolean = false;

  constructor(
    public configService: ConfigService
  ) {
    
  }

  /**
   * Need to use ngOnChanges instead of ngOnInit so the template updates correctly when using VirtualScroll
   * @return {[type]} [description]
   */

  ngOnChanges(changes: SimpleChanges) {

    if (this.type == 'editor') {
      this.reviews = this.listing['reviews'][this.type];
    } else if (this.type == 'user') {
      this.reviews = this.listing['reviews'][this.type+'s'];
    }
    
    // get listing type settings
    let listingType = this.listing.listing_type.id;

    this.displayRatings = this.configService.getListingTypeSetting(listingType, 'allow_ratings');
    this.ratingScale = this.configService.getListingTypeSetting(listingType, 'rating_scale');
    this.ratingStyle = this.configService.getListingTypeSetting(listingType, this.type + '_rating_style');
    this.ratingColor = this.configService.getListingTypeSetting(listingType, this.type + '_rating_color');

    if (this.reviews.rating){
      this.ratingPercent = Math.round((this.reviews.rating / this.ratingScale) * 100) + '%';
    } else {
      this.ratingPercent = '0%';
    }

    this.classes = [
      'rating-stars',
      'rating-stars-'+this.type,
      'ratings-style'+this.ratingStyle,
      'ratings-'+this.ratingColor
    ];    

  }
}
