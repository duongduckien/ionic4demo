import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { PhotosPage } from './photos';

@NgModule({
  declarations: [
    PhotosPage,
  ],
  imports: [
    IonicPageModule.forChild(PhotosPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    PhotosPage
  ]
})
export class PhotosPageModule {}