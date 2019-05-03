import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'reviews-widget',
  templateUrl: 'reviews-widget.html'
})
export class ReviewsWidget {

  @Input('reviews') reviews;
  @Input('layout') layout;

  constructor(
    public navCtrl: NavController,
  ) {
  }

  goToReviewDetail(review: any) {
    this.navCtrl.push('ReviewDetailPage', {
      review: review,
      goToListing: true,
      dataParams: {
        review_id: review.id,
      },
      pageParams: {}
    });
  }

}
