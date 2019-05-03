import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthAccountPage } from './auth-account';

@NgModule({
  declarations: [
    AuthAccountPage
  ],
  imports: [
    IonicPageModule.forChild(AuthAccountPage),
    TranslateModule.forChild()
  ],
  exports: [
    AuthAccountPage
  ]
})
export class AuthAccountPageModule {}
