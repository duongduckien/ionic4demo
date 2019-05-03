import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { MenusPage } from './menus';

@NgModule({
  declarations: [
    MenusPage,
  ],
  imports: [
    IonicPageModule.forChild(MenusPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    MenusPage
  ]
})
export class MenusPageModule {}