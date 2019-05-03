import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './../../components/components.module';
import { DirectoriesPage } from './directories';

@NgModule({
  declarations: [
    DirectoriesPage,
  ],
  imports: [
    IonicPageModule.forChild(DirectoriesPage),
    TranslateModule.forChild(),
    ComponentsModule
  ],
  exports: [
    DirectoriesPage
  ]
})
export class DirectoriesPageModule {}