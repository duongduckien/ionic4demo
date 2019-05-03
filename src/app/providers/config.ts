import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

// Redux
import { NgRedux } from 'ng2-redux';
import { STORE_DIRECTORIES, STORE_CATEGORIES, ENVIRONMENT, STORE_SETTINGS } from '../actions';

// Services
import { APIService } from './api';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class ConfigService {

  settings: any = {
    apiBase: "",
    navigation: "sidemenu",
    headerBg: "blue",
    tabsBg: "light",
    lang: "en",
    langDir: "ltr",
    ratingSelector: "star",
    integrations: {
      "google": {
        "trackID": "",
        "webApiKey": "",
        "loginKey": "",
        "enableLogin": false
      },
      "facebook": {
        "enableLogin": false
      }
    }
  }

  pageDefaults: any = {
    widgetsPage: {
      pageParams: {
        widgets: []
      },
      dataParams: {}
    },
    listingsPage: {
      pageParams: {
        layout: 'list',
        mediaSize: 'small',
        showSearchIcon: true,
        hideSearchbar: true,
        limit: 10,
        sort: "created"
      },
      dataParams: {}
    },
    listingDetailPage: {
      pageParams: {
        directions: {
          enabled: true
        },
        static_map: {
          enabled: true,
          zoom: 15,
          size: '640x300',
          maptype: 'roadmap',
          marker: "",
          style: []
        },
        review_limit: 5,
        exclude_fields: ["state","city"]
      },
      dataParams : {}
    },
    directoriesPage: {
      pageParams: {},
      dataParams: {}
    },
    categoriesPage: {
      pageParams: {
        layout: 'list'
      },
      dataParams: {}
    },
    writeReviewsPage: {
      pageParams: {},
      dataParams: {}
    },
    reviewsPage: {
      pageParams: {
        sort: "reviews"
      },
      dataParams: {
        limit: 10
      }
    },
    reviewDetailPage: {
      pageParams: {},
      dataParams: {}
    },
    searchPage: {
      pageParams: {
        mediaSize: 'small'
      },
      dataParams: {
        limit: 10
      }
    },
    loginPage: {
      pageParams: {},
      dataParams: {}
    },
    registerPage: {
      pageParams: {},
      dataParams: {}
    },
    accountPage: {
      pageParams: {},
      dataParams: {}
    },
    authAccountPage: {
      pageParams: {},
      dataParams: {}
    },
    photosPage: {
      pageParams: {
        layout: "card"
      },
      dataParams: {}
    },
    videosPage: {
      pageParams: {
        layout: "card"
      },
      dataParams: {}
    },
    customPage: {
      pageParams: {},
      dataParams: {}
    },
    contactPage: {
      pageParams: {},
      dataParams: {}
    },
    mapPage: {
      pageParams: {},
      dataParams: {
        limit: 50
      }
    },
    getDirectionsPage: {
      pageParams: {}
    }
  }

  // Alejandro June 10, 2018
  // Removed the default values for menus from here because it was causing deleted default menus like contact, app info
  // to appear in the mobile app
  menus: Array<any> = [
  ];

  tabPages: any;

  morePages: any;

  listingTypes: any;

  reviewLimit: any;

  validate: any = {
    selectImages: {
      maximumImagesCount: 10,
      width: 2000,
      height: 2000,
      quality: 95
    }
  };

  dataConfig: any;

  public statusCode: any = {
    published: 201,
    moderated: 202
  }

  public environmentApp: string;
  public webClientId: string;
  public hashAppIframe: string;

  constructor(
    public http: Http,
    private apiService: APIService,
    private authService: AuthService,
    private platform: Platform,
    private ngRedux: NgRedux<any>
  ) {
    
  }

  load(): Promise<any> {

    return new Promise(async (resolve, reject) => {

      try {

        let env  = this.getConfig(`assets/data/env.json`);
        let data = this.getConfig(`assets/data/config.json`);

        let resultOfEnv  = await env;
        let resultOfData = await data;

        this.environmentApp = resultOfEnv.environment;
        this.webClientId = resultOfEnv.integrations['google']['loginKey'];

        if (resultOfEnv.environment === 'live') {
          
          let configDataOrigami = await this.getConfigMobileApp(resultOfEnv.apiBase);

          console.log('Result of Origami API', configDataOrigami);
  
          if (configDataOrigami.application.items.length > 0) {

            let origamiData = configDataOrigami.application.items[0].config;

            origamiData.settings.apiBase = resultOfEnv.apiBase;
            origamiData.settings.integrations = Object.assign({}, resultOfEnv.integrations, origamiData.settings.integrations);

            this.webClientId = origamiData.settings.integrations['google']['loginKey'];

            this.updateConfig(origamiData);
            this.dataConfig = origamiData;
            this.ngRedux.dispatch({ type: ENVIRONMENT, payload: 'live' });
            this.ngRedux.dispatch({ type: STORE_SETTINGS, payload: origamiData });
            resolve(origamiData);

          } else {
            this.updateConfig(resultOfData);
            this.dataConfig = resultOfData;
            resolve(resultOfData);
          }

        } else if (resultOfEnv.environment === 'iframe') {

          let configDataOrigami = await this.getConfigOrigami(resultOfEnv.origamiUrl);

          if (configDataOrigami.application[0].app_hash === this.hashAppIframe) {

            console.log('Result of Origami Builder: ', configDataOrigami);
            
            window.parent.postMessage('loading done','*');
  
            let origamiData = JSON.parse(configDataOrigami.application[0].config_info);

            origamiData.settings.apiBase = configDataOrigami.application[0].api_url;
            origamiData.settings.integrations = Object.assign({}, resultOfEnv.integrations, origamiData.settings.integrations);

            // Update directories & categories to Redux
            this.ngRedux.dispatch({ type: STORE_DIRECTORIES, payload: configDataOrigami.directories });
            this.ngRedux.dispatch({ type: STORE_CATEGORIES, payload: configDataOrigami.categories });
            this.ngRedux.dispatch({ type: ENVIRONMENT, payload: 'iframe' });

            this.updateConfig(origamiData);
            this.dataConfig = origamiData;
            resolve(origamiData);
          }

        }

      } catch (e) {
        resolve(e);
      }

    });

  }

  /**
   * 
   */
  getConfig(path): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(path).map(res => res.json()).subscribe(res => {
        resolve(res);
      }, err => {
        reject(err);
      });
    });
  }

  updateConfig(data) {

    this.settings = Object.assign(this.settings, data.settings);

    this.validate = Object.assign(this.validate, data.validate);

    this.menus = Object.assign(this.menus, data.menus);

    this.reviewLimit = data.pageDefaults.listingDetailPage.review_limit || 5;

    // merge config from config.json to config.ts
    for (var pageType in this.pageDefaults) {
      this.pageDefaults[pageType] = Object.assign(this.pageDefaults[pageType], data.pageDefaults[pageType]);
    }

  }

  get(setting) {
    return this.settings[setting];
  }

  getValidate(option) {
    return this.validate[option];
  }

  getReviewLimit() {
    return this.reviewLimit;
  }

  getPageDefaults(page) {

    if (page !== 'menusPage') {

      let pageDefaults = Object.assign({}, this.pageDefaults[page]);

      // Include shared page setings
      pageDefaults.pageParams = Object.assign(pageDefaults.pageParams, this.settings);
  
      return pageDefaults;
      
    }

  }

  getListingTypeSetting(listingTypeId, setting) {

    let listingType = this.listingTypes.filter(lt => {
      if (lt.id === listingTypeId) {
        return lt;
      }
    });
    return listingType[0]['config'][setting];

  }

  /**
   * Load remote configuration
   */
  getConfigMobileApp(apiBase): Promise<any> {
    return new Promise((resolve, reject) => {

      const apiURL = `${apiBase}/origami/mobile-app`;

      this.http.get(apiURL).map(result => result.json()).subscribe(res => {
        resolve(res);
      }, err => {
        reject(err);
      });

    });
  }

  /**
   * Get config from Origami
   */
  getConfigOrigami(origamiURL): Promise<any> { 

    return new Promise((resolve, reject) => {

      let params = new URLSearchParams(window.location.search);
      let appId = params.get('appid');
      this.hashAppIframe = params.get('key');

      this.authService.tokenKey = `jreviews-${appId}`;

      this.apiService.getOrigamiConfig(origamiURL, appId, this.hashAppIframe).subscribe(origami => {
        resolve(origami);
      }, err => {
        reject(err);
      });

    });

  }

  getHeaderBackgroundHexColor() {
    let color = '';
    switch(this.settings.headerBg) {
      case 'light':      
        color = '#f4f4f4';
      break;
      case 'dark':       
        color = '#252525';
      break;
      case 'red':        
        color = '#d42b1e';
      break;
      case 'blue':       
        color = '#0082ca';
      break;
      case 'green':      
        color = '#508759';
      break;
      case 'brown':      
        color = '#645740';
      break;
      case 'orange':     
        color = '#e1501f';
      break;
      case 'yellow':
        color = '#ffef1d';
      break;
      case 'white':
        color = '#ffffff';
      break;
    }

    return this.shadeColor(color,-0.10);
  }  

  private shadeColor(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
  }   

  getStatusBarStyle() {
    let style = 'light';
    switch(this.settings.headerBg) {
      case 'light':      
        style = 'dark';
      break;
      case 'white':
        style = 'dark';
      break;
      case 'yellow':
        style = 'dark';
      break;
    }
    return style;
  }    

}
