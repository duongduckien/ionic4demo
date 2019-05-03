import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TabsLayout } from './tabs';

@NgModule({
  declarations: [
    TabsLayout,
  ],
  imports: [
    IonicPageModule.forChild(TabsLayout),
  ],
  exports: [
    TabsLayout
  ]
})
export class TabsLayoutModule {}