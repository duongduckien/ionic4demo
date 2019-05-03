import { Component, Input } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'static-map',
  templateUrl: 'static-map.html'
})
export class StaticMapComponent {

  url: any;

  @Input('lat') lat;
  @Input('long') long;
  @Input('zoom') zoom;
  @Input('size') size;
  @Input('maptype') maptype;
  @Input('marker') marker;
  @Input('style') style;
  @Input('apiKey') apiKey;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams
  ) {
    
  }

  get_static_style(styles) {

    var result = [];

    styles.forEach(function (v, i, a) {
      var style = '';
      if (v.stylers.length > 0) { // Needs to have a style rule to be valid.
        style += (v.hasOwnProperty('featureType') ? 'feature:' + v.featureType : 'feature:all') + '|';
        style += (v.hasOwnProperty('elementType') ? 'element:' + v.elementType : 'element:all') + '|';
        v.stylers.forEach(function (val, i, a) {
          var propertyname = Object.keys(val)[0];
          var propertyval = val[propertyname].toString().replace('#', '0x');
          style += propertyname + ':' + propertyval + '|';
        });
      }
      result.push('style=' + encodeURIComponent(style));
    });

    return result.join('&');
    
  }

  ngAfterContentInit() {
    if (this.apiKey && this.apiKey !== '') {
      this.url = `https://maps.googleapis.com/maps/api/staticmap?center=${this.lat},${this.long}`
      + `&zoom=${this.zoom}&scale=2&size=${this.size}&maptype=${this.maptype}`
      + `&key=${this.apiKey}&format=jpg&visual_refresh=true`
      + `&markers=${this.lat},${this.long}&${this.get_static_style(this.style)}`;
      // + `&markers=icon:${this.marker}|${this.lat},${this.long}&${this.get_static_style(this.style)}`;
    }
  }

}
