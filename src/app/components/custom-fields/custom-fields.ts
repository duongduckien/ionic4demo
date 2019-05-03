import { Component, Input, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { ConvertLinksPipe } from '../../pipes/convertlinks.pipe';

@Component({
  selector: 'custom-fields',
  templateUrl: 'custom-fields.html',
  providers: [ConvertLinksPipe]
})
export class CustomFields implements OnInit {

  @Input('entry') entry;
  @Input('layout') layout;

  fieldGroups: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public _dom: DomSanitizer,
    public convertlinks: ConvertLinksPipe
  ) {

  }

  // Runs before template is loaded
  ngOnInit() {
    
    this.fieldGroups = this.entry.field_groups_filtered;
    
    if (Array.isArray(this.fieldGroups) && this.fieldGroups.length > 0) {
      this.fieldGroups.forEach(element => {
        if (element.fields.length > 0) {
          element.fields.forEach(field => {
            if (field.selected.length > 0) {
              for (let i = 0; i < field.selected.length; i++) {
                if (field.type !== 'formbuilder') {
                  field.selected[i].output = this.convertlinks.transform(field.selected[i].output);
                }
              }
            }
          });
        }
      });
    }
  }

  goToListingDetail(listingId: number) {

    this.navCtrl.push('ListingDetailPage', {
      dataParams: { listing_id: listingId },
      pageParams: {}
    });
  }  

}