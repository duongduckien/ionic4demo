import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { ListingSearchbar } from './listing-searchbar/listing-searchbar';
import { ListingsList } from './listings-list/listings-list';
import { ListingsCard } from './listings-card/listings-card';
import { ListingsGrid } from './listings-grid/listings-grid';
import { ListingsWidget } from './listings-widget/listings-widget';
import { FormField } from './form-field/form-field';
import { ReviewsList } from './reviews-list/reviews-list';
import { ReviewsWidget } from './reviews-widget/reviews-widget';
import { CustomFields } from './custom-fields/custom-fields';
import { OverallRatings } from './overall-ratings/overall-ratings';
import { Rating } from './rating/rating';
import { StaticMapComponent } from './static-map/static-map';
import { PipesModule } from '../pipes/pipes.module';
import { TranslateModule } from '@ngx-translate/core';
import { RatingSelectorComponent } from './rating-selector/rating-selector';
import { MapInfowindow } from './map-infowindow/map-infowindow';

@NgModule({
  declarations: [
    ListingSearchbar,
    ListingsList,
    ListingsCard,
    ListingsGrid,
    ListingsWidget,
    FormField,
    ReviewsList,
    ReviewsWidget,
    CustomFields,
    OverallRatings,
    Rating,
    StaticMapComponent,
    RatingSelectorComponent,
    MapInfowindow
  ],
  entryComponents: [
    MapInfowindow,
    OverallRatings
  ],
  imports: [
    IonicModule,
    PipesModule,
    TranslateModule.forChild()
  ],
  exports: [
    ListingSearchbar,
    ListingsList,
    ListingsCard,
    ListingsGrid,
    ListingsWidget,
    FormField,
    ReviewsList,
    ReviewsWidget,
    CustomFields,
    OverallRatings,
    Rating,
    StaticMapComponent,
    RatingSelectorComponent,
    PipesModule
  ]
})
export class ComponentsModule {}