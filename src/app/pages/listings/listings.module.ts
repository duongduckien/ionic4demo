import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { ListingsPage } from './listings';

@NgModule({
  declarations: [
    ListingsPage,
  ],
  imports: [
    IonicPageModule.forChild(ListingsPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    ListingsPage
  ]
})
export class ListingsPageModule {}