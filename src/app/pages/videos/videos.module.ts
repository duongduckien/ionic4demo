import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { VideosPage } from './videos';

@NgModule({
  declarations: [
    VideosPage,
  ],
  imports: [
    IonicPageModule.forChild(VideosPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    VideosPage
  ]
})
export class VideosPageModule {}