import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ListingFilters } from './listing-filters';

@NgModule({
  declarations: [
    ListingFilters,
  ],
  imports: [
    IonicPageModule.forChild(ListingFilters),
    TranslateModule.forChild()
  ],
  exports: [
    ListingFilters
  ]
})
export class ListingFiltersModule {}