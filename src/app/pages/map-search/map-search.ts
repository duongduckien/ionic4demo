import { Component, HostListener, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ToastController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateService } from '@ngx-translate/core';
import { Geocoder } from '@ionic-native/google-maps';
import { AlertController } from 'ionic-angular';
import _ from 'lodash';

// Services
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { HelperService } from '../../providers/helper';

// Redux
import { NgRedux } from 'ng2-redux';
import { MAP_CATEGORY_SELECT } from '../../app/actions';

declare var google: any;

@IonicPage()
@Component({
  selector: 'page-map-search',
  templateUrl: 'map-search.html',
})
export class MapSearchPage {

  pageParams: any;
  dataParams: any;
  categories: any;

  directories: any;
  isCategories: boolean = false;

  unChecked: boolean = false;
  q: string = '';
  address: string = '';
  bbox: any = [];
  restriction: any = [];
  autocomplete: any;
  placesService: any;
  autocompleteItems: Array<any>;
  timeout: any;
  placeID: string = '';

  translations: any;

  catSelected: any = null;

  @HostListener('window:keydown', ['$event']) keyboardInput(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      this.search();
    }
  }

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams, 
    public events: Events,
    public toastCtrl: ToastController,
    public configService: ConfigService,
    public viewCtrl: ViewController,
    public translate: TranslateService,
    public apiService: APIService,
    public helperService: HelperService,
    public zone: NgZone,
    private ngRedux: NgRedux<any>,
    private alertCtrl: AlertController
  ) {

    // For some reason the translatin pipe is not working in the modal template
    this.translations = {
      cancel: this.translate.instant('BTN_CANCEL'),
      search: this.translate.instant('BTN_SEARCH')
    };

    this.pageParams = Object.assign({}, configService.getPageDefaults('mapPage'), navParams.get('pageParams'));
    this.dataParams = Object.assign({}, navParams.get('dataParams'));
    this.categories = Object.assign({}, navParams.get('categories')).categories;

    this.q = navParams.get('q');
    this.address = navParams.get('address');
    this.bbox = navParams.get('bbox');    

    if (this.bbox.length) {
      this.address = this.translate.instant('PLACEHOLDER_SEARCH_INPUT');
    }

    this.autocomplete = new google.maps.places.AutocompleteService();
    this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);

    console.log("Search Address: ", this.address);

    this.restriction = this.pageParams.restriction ? this.pageParams.restriction : [];

    console.log('Search restriction',this.restriction);
  }

  cancel() {    
    this.viewCtrl.dismiss();
  }

  clearInput(type) {

    switch (type) {
      case 'q': {
        this.q = '';
        break;
      }
      case 'address': {
        this.address = '';
        this.autocompleteItems = [];
        break;
      }
      default: {
        break;
      }
    }

  }

  search() {
    console.log('Search address', this.address,this.translate.instant('PLACEHOLDER_SEARCH_INPUT'));

    if (this.address === '') {
      let alert = this.alertCtrl.create({
        subTitle: this.translate.instant('ENTER_LOCATION'),
        buttons: [this.translate.instant('BTN_OK')]
      });
      alert.present();
    } else {
      // Search a new location
      if (this.address !== this.translate.instant('PLACEHOLDER_SEARCH_INPUT')) {

        if (this.placeID !== '') {
          this.placesService.getDetails({placeId: this.placeID}, (place, status) => {
                this.zone.run(() => {
                  console.log('Places results', place);

                  if (status == google.maps.places.PlacesServiceStatus.OK) {

                    let types = place.types;
                    let location = place.geometry.location;

                    const latLng = {
                      lat: location.lat(),
                      lng: location.lng()
                    }

                    this.viewCtrl.dismiss({
                      q: this.q,
                      address: this.address,
                      latLng: latLng,
                      zoom: this.setSearchZoomLevelPlace(types)
                    });

                  } else {
                    let alert = this.alertCtrl.create({
                      subTitle: this.translate.instant('MAP_ADDRESS_NOT_FOUND'),
                      buttons: [this.translate.instant('BTN_OK')]
                    });
                    alert.present();
                  }
              });
          });
        } else {
          Geocoder.geocode({ address: this.address }).then(items => {
            if (!this.helperService.isEmpty(items)) {

              console.log('Geocoder results',items);

              const latLng = {
                lat: items[0].position.lat,
                lng: items[0].position.lng
              }

              this.viewCtrl.dismiss({
                q: this.q,
                address: this.address,
                latLng: latLng,
                zoom: this.setSearchZoomLevel(items[0])
              });

            } else if (this.helperService.isEmpty(items)) {
              let alert = this.alertCtrl.create({
                subTitle: this.translate.instant('MAP_ADDRESS_NOT_FOUND'),
                buttons: [this.translate.instant('BTN_OK')]
              });
              alert.present();
            }
          }); 
        }
           
      } 
      // Search current map area
      else if (this.bbox.length > 0) {

        this.viewCtrl.dismiss({
          q: this.q
        });

      } 
    }
  }

  setSearchZoomLevelPlace(types) {

    let zoom: number;

    if(_.indexOf(types,'country') > -1) {
      zoom = 6;
    } else if (_.indexOf(types,'administrative_area_level_1') > -1
          ||
          _.indexOf(types,'administrative_area_level_2') > -1
          ||
          _.indexOf(types,'administrative_area_level_3') > -1
          ||
          _.indexOf(types,'administrative_area_level_4') > -1
          ||
          _.indexOf(types,'administrative_area_level_5') > -1
      ) {
      zoom = 7;
    } else if (_.indexOf(types,'locality') > -1) {
      zoom = 14;
    } else if (_.indexOf(types,'sublocality') > -1 
          ||
          _.indexOf(types,'sublocality_level_1') > -1
          ||
          _.indexOf(types,'sublocality_level_2') > -1
          ||
          _.indexOf(types,'sublocality_level_3') > -1
          ||
          _.indexOf(types,'sublocality_level_4') > -1
          ||
          _.indexOf(types,'sublocality_level_5') > -1
          ) {
      zoom = 16;
    } else if (_.indexOf(types,'postal_code') > -1) {
      zoom = 13;
    } else if (_.indexOf(types,'neighborhood') > -1 || _.indexOf(types,'sublocality_level_1') > -1) {
      zoom = 17;
    } else if (_.indexOf(types,'street_address') > -1 || _.indexOf(types,'establishment') > -1 || _.indexOf(types,'point_of_interest') > -1) {
      zoom = 17;
    }

    return zoom;
  }

  setSearchZoomLevel(results) {

    let zoom: number;
    
    if (results.subThoroughfare !== undefined) {
      zoom = 17;
    } else if (results.thoroughfare !== undefined) {
      zoom = 17;
    } else if (results.subLocality !== undefined) {
      zoom = 16;
    } else if (results.locality !== undefined) {
      zoom = 14;
    } else if (results.postalCode !== undefined) {
      zoom = 13;
    } else if (results.subAdminArea !== undefined) {
      zoom = 9;
    } else if (results.adminArea !== undefined) {
      zoom = 7;
    } else if (results.country !== undefined) {
      zoom = 6;
    }

    return zoom;
  }

  chooseCategories(title, id) {
    if (parseInt(this.catSelected) === parseInt(id)) {
      if (this.unChecked) {
        this.unChecked = false;
        this.ngRedux.dispatch({ type: MAP_CATEGORY_SELECT, payload: '' });
      } else {
        this.unChecked = true;
        this.ngRedux.dispatch({ type: MAP_CATEGORY_SELECT, payload: '' });
      }
    } else {
      this.unChecked = false;
      this.ngRedux.dispatch({ type: MAP_CATEGORY_SELECT, payload: id });
    }
  }

  showCategories() {
    this.isCategories = true;
  }

  showSuggestion() {
    this.isCategories = false;
  }

  chooseAddress(item) {
    this.address = item.description;
    this.placeID = item.place_id;
  }

  updateAutoCompletes() {
    
    this.placeID = '';

    if (this.address == '') {
      this.autocompleteItems = [];
      return;
    }

    this.autocomplete.getPlacePredictions({
      input: this.address,
      componentRestrictions: {
        country: this.restriction
      }
    },(predictions, status) => {
      this.autocompleteItems = [];
      this.zone.run(() => {
        if (predictions !== null) {
          predictions.forEach((prediction) => {
            this.autocompleteItems.push({description:prediction.description,place_id:prediction.place_id});
          });
        }
      });
    });
  }

}
