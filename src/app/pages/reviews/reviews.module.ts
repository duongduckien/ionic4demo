import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { ReviewsPage } from './reviews';

@NgModule({
  declarations: [
    ReviewsPage,
  ],
  imports: [
    IonicPageModule.forChild(ReviewsPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    ReviewsPage
  ]
})
export class ReviewsPageModule {}