import { Component, Input } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'reviews-list',
  templateUrl: 'reviews-list.html'
})
export class ReviewsList {

  @Input('review') review;
  @Input('whichTitle') whichTitle;
  @Input('showDiscussionCount') showDiscussionCount;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams
  ) {
  }

}
