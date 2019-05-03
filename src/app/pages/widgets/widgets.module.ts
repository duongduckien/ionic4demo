import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { WidgetsPage } from './widgets';

@NgModule({
  declarations: [
    WidgetsPage
  ],
  imports: [
    IonicPageModule.forChild(WidgetsPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    WidgetsPage
  ]
})
export class WidgetsPageModule {}