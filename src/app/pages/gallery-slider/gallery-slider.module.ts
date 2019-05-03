import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GallerySliderPage } from './gallery-slider';

import { PipesModule } from "../../pipes/pipes.module";

@NgModule({
  declarations: [
    GallerySliderPage,
  ],
  imports: [
    IonicPageModule.forChild(GallerySliderPage),
    PipesModule
  ],
})
export class GallerySliderPageModule {}
