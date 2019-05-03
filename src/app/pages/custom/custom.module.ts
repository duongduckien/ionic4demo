import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { CustomPage } from './custom';

import { PipesModule } from "../../pipes/pipes.module";

@NgModule({
  declarations: [
    CustomPage
  ],
  imports: [
    IonicPageModule.forChild(CustomPage),
    TranslateModule.forChild(),
    ComponentsModule,
    PipesModule
  ],
  exports: [
    CustomPage
  ]
})
export class CustomPageModule {}