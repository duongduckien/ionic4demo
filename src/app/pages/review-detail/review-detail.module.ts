import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { ReviewDetailPage } from './review-detail';

import { PipesModule } from "../../pipes/pipes.module";

@NgModule({
  declarations: [
    ReviewDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(ReviewDetailPage),
    TranslateModule.forChild(),
    ComponentsModule,
    PipesModule
  ],
  exports: [
    ReviewDetailPage
  ]
})
export class ReviewDetailPageModule {}