import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ConfigService } from '../../providers/config';

declare var google: any;

@IonicPage()
@Component({
  selector: 'page-get-direction',
  templateUrl: 'get-direction.html',
})
export class GetDirectionPage {

  lat: any;
  long: any;
  data: any;
  apiKey: any;
  imageUrl: string = '';
  pageParams: any;

  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events,    
    public configService: ConfigService
  ) {

    this.pageParams = Object.assign({}, this.configService.getPageDefaults('getDirectionsPage').pageParams, navParams.get('pageParams'));

    this.apiKey = this.configService.dataConfig['settings']['integrations']['google']['webApiKey'];
    this.lat = this.navParams.get('lat');
    this.long = this.navParams.get('long');
    this.data = this.navParams.get('data');

    if (this.configService.dataConfig['settings']['headerImg'] && this.configService.dataConfig['settings']['headerImg'] !== '') {
      this.imageUrl = this.configService.dataConfig['settings']['headerImg'];
    }
    
  }
  ionViewDidLoad(){
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
    this.initGoogleMap();
  }

  initGoogleMap(){
    let exist_api = document.getElementById("googleMaps");
    if (exist_api === null){
      let script = document.createElement("script");
      script.id = "googleMaps";
      if (this.apiKey) {
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.apiKey;
        document.body.appendChild(script);
        setTimeout(() => { this.loadMap(parseFloat(this.lat), parseFloat(this.long)) }, 1000);
      } 
    } else {
      setTimeout(() => { this.loadMap(parseFloat(this.lat), parseFloat(this.long)) }, 1000);
    }
  }

  loadMap(lat, long) {
    let ltlng = { lat: lat, lng: long };    
    let map = new google.maps.Map(document.getElementById('gmap'), {
      zoom: 16,
      center: ltlng
    });
    let marker = new google.maps.Marker({
      position: ltlng,
      map: map,
      icon: "assets/markers/default.png",
      title: this.data.title
    });
    marker.addListener('click', function () {
      infowindow.open(map, marker);
    });
    var infowindow = new google.maps.InfoWindow({
      content: this.data.title
    });
  }

  goBack(){
    this.navCtrl.pop();
  }

}
