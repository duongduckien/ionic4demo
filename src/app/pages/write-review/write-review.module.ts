import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { WriteReviewPage } from './write-review';

@NgModule({
  declarations: [
    WriteReviewPage,
  ],
  imports: [
    IonicPageModule.forChild(WriteReviewPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    WriteReviewPage
  ]
})
export class WriteReviewPageModule {}
