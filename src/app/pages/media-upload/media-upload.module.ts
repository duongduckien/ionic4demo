import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { MediaUploadPage } from './media-upload';

@NgModule({
  declarations: [
    MediaUploadPage,
  ],
  imports: [
    IonicPageModule.forChild(MediaUploadPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    MediaUploadPage
  ]
})
export class MediaUploadPageModule {}
