import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ConfigService } from '../../providers/config';

@Component({
  selector: 'rating',
  templateUrl: 'rating.html'
})
export class Rating implements OnChanges {

  @Input('review') review;

  ratingScale: number = 5;
  ratingPercent: string = '0%';

  ratingStyle: number = 1;
  ratingColor: string = 'blue';

  classes: string[] = [];
  displayRating: boolean = false;

  reviewType: any;

  constructor(public configService: ConfigService) {

  }

  /**
   * Need to use ngOnChanges instead of ngOnInit so the template updates correctly when using VirtualScroll
   * @return {[type]} [description]
   */

  ngOnChanges(changes: SimpleChanges) {

    // get listing type settings
    let listingType = this.review.listing_type.id;
    this.reviewType = this.review.editor ? 'editor': 'user';

    //this.displayRating = this.configService.getListingTypeSetting(listingType, 'allow_ratings') && this.configService.getListingTypeSetting(listingType, this.type + '_reviews');
    this.displayRating = this.configService.getListingTypeSetting(listingType, 'allow_ratings');

    this.ratingScale = this.configService.getListingTypeSetting(listingType, 'rating_scale');
    this.ratingStyle = this.configService.getListingTypeSetting(listingType, this.reviewType + '_rating_style');
    this.ratingColor = this.configService.getListingTypeSetting(listingType, this.reviewType + '_rating_color');
    if (this.review.rating){
      this.ratingPercent = Math.round((this.review.rating / this.ratingScale) * 100) + '%';      
    } else {
      this.ratingPercent = '0%';
    }

    this.classes = [
      'rating-stars',
      'rating-stars-'+this.reviewType,
      'ratings-style'+this.ratingStyle,
      'ratings-'+this.ratingColor
    ];

  }

}
