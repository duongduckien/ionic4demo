import { Component, Output, EventEmitter } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import { PopoverController, LoadingController } from 'ionic-angular';

import { ConfigService } from '../../providers/config';

declare var google:any;

@Component({
  selector: 'listing-searchbar',
  templateUrl: 'listing-searchbar.html'
})
export class ListingSearchbar {

  @Output() onSearch = new EventEmitter();

  apiKey: any;

  search: any = {
    q: '',
    location: '',
    sort: 'user-rating',
    radius: 35,
    distance_unit: 'mi',
    includes: 'listing_type,reviews,photos'
  };

  constructor(
    public popoverCtrl: PopoverController,
    public loadingCtrl: LoadingController, 
    public geolocation: Geolocation, 
    public configService: ConfigService
    ) {

    console.log('Hello ListingSearchbar Component');

    this.apiKey = this.configService.get('integrations')['google']['webApiKey'];

    this.loadGeocodingAPI();
  }

  locateMe() {

    let loader = this.loadingCtrl.create({
      content: "Locating you",
    });

    loader.present();

    this.geolocation.getCurrentPosition().then((data) => {
      console.log(data);
      loader.dismiss();
      this.search.lat = data.coords.latitude;
      this.search.lng = data.coords.longitude;
      this.performSearch();
      // convert coordinates to real address
      this.reverseGeocode();
    }).catch((error) => { 
      this.search.lat = '';
      this.search.lng = ''
      console.log('Error getting location', error);
    });    
  }

  updateLocation() {

    let geocoder = new google.maps.Geocoder();

    geocoder.geocode({'address': this.search.location}, (results, status) => {
      if (results.length > 0) {
        this.search.lat = results[0].geometry.location.lat();
        this.search.lng = results[0].geometry.location.lng();
        this.performSearch();
      }
    });

  }

  reverseGeocode() {

    let geocoder = new google.maps.Geocoder();
    let latlng = {lat: this.search.lat, lng: parseFloat(this.search.lng)};

    geocoder.geocode({'location': latlng}, (results, status) => {

      if (results.length > 0) {
        this.search.location = results[0].formatted_address;
      }

    });   

  }

  performSearch() {
    console.log("perform search: ", this.search);
    this.onSearch.emit(this.search);
  }

  openFilters(ev) {

    let filters = this.popoverCtrl.create('ListingFilters', { filters: { sort: this.search.sort, radius: this.search.radius } });

    filters.present({
      ev: ev
    });

    filters.onDidDismiss((data) => {
      this.search = Object.assign(this.search, data);
    })
  }
  
  loadGeocodingAPI(){

    // Cannot use Google Maps without a valid API Key
    if (this.apiKey != '' && (typeof google == "undefined" || typeof google.maps == "undefined")) {

      // Load the SDK
      window['mapInit'] = () => {
        console.log("maps api initialized");
      }

      let script = document.createElement("script");
      script.id = "googleMaps";

      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.apiKey + '&callback=mapInit';

      document.body.appendChild(script);

    }

  }

}
