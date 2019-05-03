import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { ListingDetailPage } from './listing-detail';

import { PipesModule } from "../../pipes/pipes.module";

@NgModule({
  declarations: [
    ListingDetailPage
  ],
  imports: [
    IonicPageModule.forChild(ListingDetailPage),
    TranslateModule.forChild(),
    ComponentsModule,
    PipesModule
  ],
  exports: [
    ListingDetailPage
  ]
})
export class ListingDetailPageModule {}
