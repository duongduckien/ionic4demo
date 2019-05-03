import { Component, ComponentRef, Injector, ApplicationRef, ComponentFactoryResolver, NgZone } from '@angular/core';
import { Platform, Events, IonicPage, NavController, NavParams, ToastController, ModalController, LoadingController, MenuController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';

// Dynamic rendering of component
import { MapInfowindow} from '../../components/map-infowindow/map-infowindow';

// Services
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { HelperService } from '../../providers/helper';

// Redux
import { NgRedux, select } from 'ng2-redux';
import { MAP_SHOW_MESSAGE } from '../../actions';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  LocationService,
  MarkerOptions,
  HtmlInfoWindow,
  Marker,
  Geocoder,
  VisibleRegion
} from '@ionic-native/google-maps';

@IonicPage()
@Component({
  selector: 'page-map',
  templateUrl: 'map.html'
})
export class MapPage {

  @select('mapSelectedCategory') mapSelectedCategory;

  catSelected: any;

  address: string = '';
  q: string = '';
  placeholder: string = '';
  dataRequest = {};
  categories: any;

  mediaSize = 'small';

  initialZoom: number = 13;
  lastZoom: number = 13;
  minUpdateZoomLevel: number = 5;

  dataParams: any;
  pageParams: any;
  searchParams: any = {};

  mapInitialized: boolean = false;
  map: GoogleMap;
  marker: Marker;

  listingsService: any;

  currentPosition: {
    lat: any,
    lng: any
  };

  currentCountry: any;

  bbox: any = [];

  firstLoad: boolean = true;
  searching: boolean = false;
  loadingMarkers: boolean = false;

  showRedoSearchButton: boolean = false;

  markers: any = {};
  removedMarkers: any = [];

  /**
   * Any zoom above this will trigger loading listings for the map
   */
  minLoadZoom = 4;

  constructor(
    public platform: Platform,
    private injector: Injector,
    private zone: NgZone,
    private resolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public menuCtrl: MenuController,
    public configService: ConfigService,
    public helperService: HelperService,
    public apiService: APIService,
    public translate: TranslateService,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    public events: Events,
    private ngRedux: NgRedux<any>
  ) {

    this.pageParams = Object.assign({}, configService.getPageDefaults('mapPage').pageParams, navParams.get('pageParams'));
    this.dataParams = Object.assign({}, configService.getPageDefaults('mapPage').dataParams, navParams.get('dataParams'));

    // Set search object and optimize response size to include the minimum data required for display
    this.searchParams = {
      object: 'listing',
      sort: 'featured',
      includes: 'geolocation,photos,videos,reviews,listing_type',
      excludes: 'summary,description'
    };
    
    this.mapSelectedCategory.subscribe(data => {
      if (data) {
        this.searchParams['cat'] = data;
      }
    });

    this.events.subscribe('map:update-start', () => {
      console.log('UPDATE START');
      this.zone.run(() => {
        this.loadingMarkers = true;
      });      
    });

    this.events.subscribe('map:update-stop', () => {
      console.log('UPDATE STOP!');
      this.zone.run(() => {
        this.loadingMarkers = false;
      });
    });
  }

  async ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);

    this.platform.ready().then(() => {
      this.initMap();
    });

    // Get all categories to filter
    this.categories = await this.getCategories(this.dataParams);    
    console.log('MAP ionViewDidLoad');
  }

  ionViewWillLeave() {
    this.showRedoSearchButton = false;
  }

  ionViewDidLeave() {
    // Don't clear/remove the map because it's needed when coming back from listing detail page
  }

  /**
   * Initialize map
   */
  initMap() {

      this.mapInitialized = true;

      LocationService.getMyLocation({enableHighAccuracy: true}).then((myLocation) => {

        this.loadMap(myLocation.latLng);

        // Set user location address in search bar
        Geocoder.geocode({position: myLocation.latLng}).then((results) => {
          this.address = _.get(results,[0,'extra','lines',0],'');
          this.setTextSearchBar('', '', this.address);
        });

      }).catch((error: any) => {
        // Can not get location, permission refused, and so on...
        console.log(error);
        this.loadMap();
        this.openSearchModal();
      });
  }

  loadMap(location?) {

    let options: GoogleMapOptions = {
      controls: {
        compass: false,
        myLocationButton: false,
        indoorPicker: false,
        zoom: false,
        mapToolbar: false     // android only
      },
      camera: {
        zoom: this.initialZoom
      },
      gestures: {
        tilt: false,
        rotate: false
      }
    };

    if (location) {
      options.camera['target'] = location;
    }

    this.map = GoogleMaps.create('map_view', options);

    // Events triggered with different map interactions
    this.map.on(GoogleMapsEvent.MAP_READY).subscribe(() => {
      
      console.log('MAP_READY');
      if (location) {
        let visibleRegion: VisibleRegion = this.map.getVisibleRegion();
        if (visibleRegion.northeast.lat !== 0 && visibleRegion.southwest.lng !== 0 && visibleRegion.southwest.lat !== 0 && visibleRegion.northeast.lng !== 0) {
          const bbox = [visibleRegion.northeast.lat,visibleRegion.southwest.lng,visibleRegion.southwest.lat,visibleRegion.northeast.lng];
          this.updateMap(bbox,this.initialZoom);
        }
      }

      // Events triggered with different map interactions
      this.map.on(GoogleMapsEvent.MAP_CLICK).subscribe(() => {
        this.removeMapMessage();
      });

      this.map.on(GoogleMapsEvent.MAP_LONG_CLICK).subscribe(() => {
        this.removeMapMessage();
      });

      this.map.on(GoogleMapsEvent.CAMERA_MOVE_START).subscribe(() => {
      });
      
      this.map.on(GoogleMapsEvent.CAMERA_MOVE_END).subscribe((data: any[]) => {
        console.log('CAMERA_MOVE_END',data,this.minUpdateZoomLevel);
        this.removeMapMessage();
        const bbox = [data[0].northeast.lat,data[0].southwest.lng,data[0].southwest.lat,data[0].northeast.lng];
        // Update map only if zoom changed
        if (data[0].zoom <= this.minUpdateZoomLevel) {
          console.log('MIN ZOOM THRESHOLD NOT MET');
          let param = {
            status: true,
            message: this.translate.instant('ZOOM_IN_SPECIFIC_LOCATION')
          }
          this.ngRedux.dispatch({ type: MAP_SHOW_MESSAGE, payload: param });
        } else if (this.lastZoom != data[0].zoom || this.searching) {
          console.log('DO MAP UPDATE');
          this.searching = false;
          this.zone.run(() => {
            this.showRedoSearchButton = false;
          });
          this.updateMap(bbox,data[0].zoom);
          this.lastZoom = data[0].zoom;
        } else {
          console.log('DONE',this.firstLoad);
          this.zone.run(() => {
            this.showRedoSearchButton = this.firstLoad ? false : true;
          });
          this.firstLoad = false;
        }
      });
    });
  }

  redoMapSearch() {
    this.showRedoSearchButton = false;
    let visibleRegion: VisibleRegion = this.map.getVisibleRegion();
    const bbox = [visibleRegion.northeast.lat,visibleRegion.southwest.lng,visibleRegion.southwest.lat,visibleRegion.northeast.lng];
    this.updateMap(bbox,this.lastZoom);
  }

  /**
   * Function research when click button
   */
  updateMap(bbox,zoom) {

    this.events.publish('map:update-start');

    // Store value so it can be used within search modal
    this.bbox = bbox;

    let dataParams = Object.assign(this.dataParams,{ bbox: bbox },this.searchParams);

    this.setTextSearchBar(this.translate.instant("PLACEHOLDER_SEARCH_INPUT"), this.q);
    
    let listings = [];

    if (!_.isEmpty(this.listingsService)) {
      this.listingsService.unsubscribe();
    }

    this.listingsService = this.apiService.search(dataParams).subscribe((data) => {

      this.events.publish('map:update-stop');

      if (data.listings) {
        let results = this.helperService.prepareListingsThumbs(data.listings.items, this.mediaSize);
        listings = results.listingsData;
        listings.forEach(listing => {
          this.addMarker(listing);
        });

        if (data.listings.pagination.total > data.listings.pagination.count && zoom > this.minUpdateZoomLevel) {
          this.removeMapMessage();
          let param = {
            status: true,
            message: this.translate.instant('ZOOM_IN_MORE_RESULTS')
          }
          this.ngRedux.dispatch({ type: MAP_SHOW_MESSAGE, payload: param });
        }
      }
    },
    (err) => {
      // No results found
      this.events.publish('map:update-stop');
      this.hideAllMarkers();      
    },
    () => {
      // All done
      this.hideInvisibleMarkers(listings);
    });
  }  

  hideInvisibleMarkers(listings) {
    if (!_.isEmpty(this.markers)) {
      console.log('HIDE INVISIBLE MARKERS');
      Object.keys(this.markers).forEach((listingId) => {
        listingId = _.toInteger(listingId);
        const index = _.findIndex(listings, ['id', listingId]);
        this.markers[listingId].setVisible(index === -1 ? false : true);
      });          
    }
  }

  hideAllMarkers() {
    if (!_.isEmpty(this.markers)) {
      console.log('HIDE ALL MARKERS');
      Object.keys(this.markers).forEach((listingId) => {
        listingId = _.toInteger(listingId);
        this.markers[listingId].setVisible(false);
      });
    }          
  }

  removeAllMarkers() {
    if (this.map) {
      this.map.clear();
      this.markers = {};
    }
  }  

  async addMarker(listing) {

    let icon = 'assets/markers/default.png';

    if (listing.featured) {
      icon = 'assets/markers/default-featured.png';
    }

    // Add marker options
    let markerOption: MarkerOptions = {
      payload: {
        listing: listing
      },
      visible: true,
      disableAutoPan: true,
      icon: icon,
      position: {
        lat: listing.geolocation.lat,
        lng: listing.geolocation.lng
      }
    };

    if (this.markers[listing.id] === undefined) {
      this.map.addMarker(markerOption).then((marker: Marker) => {
        this.markers[listing.id] = marker;
        marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe((params: any[]) => {
          this.onMarkerClick(params);
        });        
      });
    }
  }

  onMarkerClick(params: any[]) {

    // Add info window
    let htmlInfoWindow = new HtmlInfoWindow();

    // Get a marker instance from the passed parameters
    let marker: Marker = params.pop();

    // Create a component
    const compFactory = this.resolver.resolveComponentFactory(MapInfowindow);
    let compRef: ComponentRef<MapInfowindow> = compFactory.create(this.injector);
    compRef.instance.listing = marker.get('payload').listing;
    this.appRef.attachView(compRef.hostView);

    let div = document.createElement('div');
    div.appendChild(compRef.location.nativeElement);

    // // Dynamic rendering
    this.zone.run(() => {
      htmlInfoWindow.setContent(div);
      htmlInfoWindow.open(marker);
    });

    // // Destroy the component when the htmlInfoWindow is closed.
    htmlInfoWindow.one(GoogleMapsEvent.INFO_CLOSE).then(() => {
      console.log('MAP InfoWindow destroyed!');
      compRef.destroy();
      htmlInfoWindow = null;
      marker = null;
    });
  }

  async openSearchModal() {

    let searchModal = this.modalCtrl.create('MapSearchPage', {
      dataParams: this.dataParams,
      pageParams: this.pageParams,
      categories: {
        categories: this.categories
      },
      bbox: this.bbox,
      q: this.q,
      address: this.address
    });

    searchModal.onDidDismiss((data) => {

      if (data) {

        this.searchParams['q'] = data.q
        this.q = data.q;
        this.address = data.address;
        
        // We have an address, so we need to get the coordinates to move the map
        if (data.latLng) {
          this.removeAllMarkers();
          this.searching = true;
          this.firstLoad = true;
          this.map.moveCamera({
            target: data.latLng,
            zoom: data.zoom || this.initialZoom
          });
        } else if (this.bbox) {
          this.updateMap(this.bbox,this.lastZoom);
          this.setTextSearchBar(this.translate.instant("PLACEHOLDER_SEARCH_INPUT"), data.q);
        } else {
          this.openSearchModal();
        }
      
      } else if (!this.bbox.length) {

      }

    });

    searchModal.present();
  }

  /**
   * Function get all categories
   */
  getCategories(dataParams): Promise<any> {
    
    return new Promise(async (resolve, reject) => {

      try {

        let arr = [];
        let listings = [];

        // Get all directories
        let dirData = await this.getDirectories();

        if (dirData.directories && dirData.directories.items && dirData.directories.items.length > 0) {
          dirData.directories.items.forEach(directory => {
            if (dataParams.dir && dataParams.dir.length > 0) {
              if (dataParams.dir.indexOf(directory.id) !== -1) {
                arr.push({
                  dir: directory.id,
                  title: directory.title
                });
              }
            }
          });
        }

        if (arr.length > 0) {
          for (let i = 0; i < arr.length; i++) {
            let data = await this.apiService.getCategoriesForMap(arr[i].dir);
            listings.push({
              title: arr[i].title,
              items: data.categories.items
            });
          }
        }

        resolve(listings);
      } catch (e) {
        reject(e);
      }

    });

  }

  /**
   * Get all directories
   */
  getDirectories(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiService.getDirectories().subscribe(res => {
        resolve(res);
      }, err => {
        reject(err);
      })
    });
  }

  markersLoading() {
    return this.loadingMarkers;
  }

  removeMapMessage() {
    let param = {
      status: false,
      message: ''
    }
    this.ngRedux.dispatch({ type: MAP_SHOW_MESSAGE, payload: param });
  }

  setTextSearchBar(placeholder: string = '', q: string = '', address: string = '') {
    document.getElementById('placeholder').innerHTML = placeholder;
    document.getElementById('q').innerHTML = q;
    document.getElementById('address').innerHTML = address;
  }
}