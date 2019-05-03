import { Injectable } from '@angular/core';
import { Http, URLSearchParams, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

// Services
import { select } from 'ng2-redux';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class APIService {

  @select('storeDirectories') storeDirectories;
  @select('storeCategories') storeCategories;
  @select('environment') environment;

  directories: any = [];
  categories: any = [];
  env: any;

  apiBase: string;

  constructor(
    public http: Http,
    public authService: AuthService,
  ) {

    this.storeDirectories.subscribe(data => {
      this.directories = data;
    });

    this.storeCategories.subscribe(data => {
      this.categories = data;
    });

    this.environment.subscribe(data => {
      this.env = data;
    });
  }

  /**
   * Function convert json params to query string
   */
  paramsToQueryString(params) {

    let queryString = new URLSearchParams();

    for (let key in params) {
      queryString.set(key, params[key])
    }

    return queryString.toString();

  }

  /**
   * Function set header for requests
   */
  setHeaders(auth = false): Promise<any> {

    return new Promise((resolve) => {

      let headers = new Headers();

      headers.append('Content-Type', 'aplication/json');

      if (auth) {

        // get token
        this.authService.getToken().then((token) => {

          if (token != '') {
            headers.append('Authorization', 'Bearer ' + token);
          }

          resolve(headers);

        }, err => {
          resolve(headers);
        });

      } else {
        resolve(headers);
      }

    });

  }

  /**
   * Function get token
   */
  getAuthorization(): Promise<any> {

    return new Promise((resolve) => {

      this.authService.getToken()
        .then(token => {
          resolve({
            Authorization: 'Bearer ' + token
          });
        });

    });

  }

  /**
   * Function get data by url
   */
  getByUrl(url, type?, dataParams?) {

    return this.http.get(url).map(res => {

      if (this.isIframe()) {

        let dirId = Array.isArray(dataParams.dir_id) ? dataParams.dir_id[0] : dataParams.dir_id;

        if (!type) {
          return res.json();
        } else if (type && type === 'subCategories' && dataParams.dir_id) {
          return this.overwriteImages(res.json(), this.directories, this.categories, 'subCategories', dirId);
        } else if (type && type === 'subCategories' && !dataParams.dir_id) {
          return res.json();
        }

      } else {
        return res.json();
      }

    });

  }

  getByUrlWithHeaders(url, limit?): Observable<any> {

    if (limit) {
      return Observable
        .fromPromise(this.setHeaders(true))
        .switchMap((headers) => {
          return this.http.get(url + '&limit=' + limit, { headers: headers })
            .map(res => res.json());
        });
    } else {
      return Observable
        .fromPromise(this.setHeaders(true))
        .switchMap((headers) => {
          return this.http.get(url, { headers: headers })
            .map(res => res.json());
        });
    }

  }

  /**
   * Function get all directories
   */
  getDirectories() {

    return this.http.get(this.apiBase + '/directories').map(res => {
      return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'directories') : res.json();
    });

  }

  /**
   * Function get categories
   */
  getCategories(params: any) {

    if (params.dir_id) {

      let dirId = Array.isArray(params.dir_id) ? params.dir_id[0] : params.dir_id;

      return this.http.get(this.apiBase + '/directories/' + dirId + '/categories').map(res => {
        return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'categories', dirId) : res.json();
      });

    } else {

      return this.http.get(this.apiBase + '/categories/' + params.cat_id)
        .map(res => res.json());

    }

  }

  /**
   * Function get categories on map page
   */
  getCategoriesForMap(dirId): Promise<any> {
    return new Promise((resolve, reject) => {
      if (dirId) {
        this.http.get(this.apiBase + '/directories/' + dirId + '/categories')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data);
          }, err => {
            reject(err);
          });
      }
    });
  }

  // Categories shortcut on menu
  getCategoriesShortcut = (cat_id) => {

    return this.http.get(this.apiBase + '/categories/' + cat_id)
      .map(res => res.json());

  }

  // Config Photo
  getConfigPhoto() {

    return this.http.get(this.apiBase + '/listing_types/reviews/config_photo')
      .map(res => res.json());

  }

  /**
   * Function get listing types
   */
  getListingTypes() {
    return this.http.get(this.apiBase + '/listing_types?includes=config').map(res => res.json());
  }

  getListingTypeReviewData(params: any) {

    let type_id = params.type_id;

    return this.http.get(this.apiBase + '/listing_types/' + type_id + '/reviews')
      .map(res => res.json());

  }

  getListingTypeListingData(params: any) {
    let type_id = params.type_id;
    return this.http.get(this.apiBase + '/listing_types/' + type_id + '/listings').map(res => res.json());
  }

  /**
   * 
   */
  getConfig(param) {
    return this.http.get(this.apiBase + '/listing_types/config/' + param).map(res => res.json());
  }

  /**
   * Function get listings
   */
  getListings(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/listings?' + queryString, { headers: headers }).map(res => {

            return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'listings') : res.json();

          });

        } else {

          return this.http.get(this.apiBase + '/listings', { headers: headers }).map(res => {

            return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'listings') : res.json();

          });

        }

      });
  }

  getListing(params: any): Observable<any> {

    let listingId = params.listing_id;

    delete params.listing_id;

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/listings/' + listingId + '?' + queryString, { headers: headers }).map(res => {
            return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'listingDetail') : res.json();
          });

        } else {

          return this.http.get(this.apiBase + '/listings/' + listingId, { headers: headers }).map(res => {
            return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'listingDetail') : res.json();
          });

        }

      });

  }

  /**
   * Function get reviews
   */
  getReviews(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/reviews?' + queryString, { headers: headers }).map(res => {
            
            return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'reviews') : res.json();

          });

        } else {

          return this.http.get(this.apiBase + '/reviews', { headers: headers }).map(res => {
            
            return this.isIframe() ? this.overwriteImages(res.json(), this.directories, this.categories, 'reviews') : res.json();

          });

        }

      });
  }

  /**
   * Function get all reviews of listings
   */
  getReviewsForListing(params?: any): Observable<any> {

    let listingId = params.listing_id;

    delete params.listing_id;

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap(headers => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/listings/' + listingId + '/reviews?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/listings/' + listingId + '/reviews', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getReview(params: any) {

    let review_id = params.review_id;

    delete params.review_id;

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/reviews/' + review_id + '?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/reviews/' + review_id)
            .map(res => res.json());

        }

      });

  }

  createReview(listingId, review): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        return this.http.post(this.apiBase + '/listings/' + listingId + '/reviews', JSON.stringify(review), { headers: headers })
          .map(res => {
            return { statusCode: res.status, data: res.json() }
          });

      });

  }

  // Review Discussions

  getReviewComments(params?: any) {

    let review_id = params.review_id;

    delete params.review_id;

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);

      return this.http.get(this.apiBase + '/reviews/' + review_id + '/comments?' + queryString)
        .map(res => res.json());

    } else {

      return this.http.get(this.apiBase + '/reviews/' + review_id + '/comments')
        .map(res => res.json());

    }

  }

  /**
   * Function search
   */
  search(params: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        let queryString = this.paramsToQueryString(params);

        console.log(this.apiBase + '/search?' + queryString);

        return this.http.get(this.apiBase + '/search?' + queryString, { headers: headers })
          .map(res => res.json())
          .catch(error => Observable.throw(error));

      });

  }

  // Fields

  getFieldOptions(params: any) {

    return this.http.get(this.apiBase + '/fields/' + params.name + '/?q=' + params.q)
      .map(res => res.json());

  }

  getRelatedFieldOptions(params: any) {

    return this.http.get(this.apiBase + '/fields/' + params.name + '/' + params.value)
      .map(res => res.json());

  }

  // Profiles - Authenticated

  getAuthUserInfo(): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        return this.http.get(this.apiBase + '/me', { headers: headers })
          .map(res => res.json());

      });

  }

  getAuthUserListings(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/me/listings?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/me/listings', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getAuthUserListingsFavorites(params?: any, user_id?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/users/' + user_id + '/favorite?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/users/' + user_id + '/favorite', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getAuthUserReviews(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/me/reviews?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/me/reviews', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getAuthUserReviewComments(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/me/comments?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/me/comments', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getAuthUserPhotos(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/me/photos?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/me/photos', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getAuthUserVideos(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/me/videos?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/me/videos', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getAuthUserMedia(params?: any): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/me/media?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/me/media', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  // Users

  getUserListings(params: any): Observable<any> {

    let user_id = params.user_id;

    delete params.user_id;

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/users/' + user_id + '/listings?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/users/' + user_id + '/listings', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getUserReviews(params: any): Observable<any> {

    let user_id = params.user_id;

    delete params.user_id;

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        if (params && Object.getOwnPropertyNames(params).length > 0) {

          let queryString = this.paramsToQueryString(params);

          return this.http.get(this.apiBase + '/users/' + user_id + '/reviews?' + queryString, { headers: headers })
            .map(res => res.json());

        } else {

          return this.http.get(this.apiBase + '/users/' + user_id + '/reviews', { headers: headers })
            .map(res => res.json());

        }

      });

  }

  getUserReviewComments(params: any) {

    let user_id = params.user_id;

    delete params.user_id;

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);

      return this.http.get(this.apiBase + '/users/' + user_id + '/comments?' + queryString)
        .map(res => res.json());

    } else {

      return this.http.get(this.apiBase + '/users/' + user_id + '/comments')
        .map(res => res.json());

    }

  }

  getUserPhotos(params: any) {

    let user_id = params.user_id;

    delete params.user_id;

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);

      return this.http.get(this.apiBase + '/users/' + user_id + '/photos?' + queryString)
        .map(res => res.json());

    } else {

      return this.http.get(this.apiBase + '/users/' + user_id + '/photos')
        .map(res => res.json());

    }

  }

  getUserVideos(params: any) {

    let user_id = params.user_id;

    delete params.user_id;

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);

      return this.http.get(this.apiBase + '/users/' + user_id + '/videos?' + queryString)
        .map(res => res.json());

    } else {

      return this.http.get(this.apiBase + '/users/' + user_id + '/videos')
        .map(res => res.json());

    }

  }

  getUserMedia(params: any) {

    let user_id = params.user_id;

    delete params.user_id;

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);

      return this.http.get(this.apiBase + '/users/' + user_id + '/media?' + queryString)
        .map(res => res.json());

    } else {

      return this.http.get(this.apiBase + '/users/' + user_id + '/media')
        .map(res => res.json());

    }

  }

  // Photos

  getPhotos(params?: any) {

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);

      console.log(this.apiBase + '/photos?' + queryString);

      return this.http.get(this.apiBase + '/photos?' + queryString)
        .map(res => res.json());

    } else {

      console.log(this.apiBase + '/photos');

      return this.http.get(this.apiBase + '/photos')
        .map(res => res.json());

    }

  }

  uploadReviewPhoto(review_id, data): Observable<any> {

    return Observable
      .fromPromise(this.setHeaders(true))
      .switchMap((headers) => {

        headers['Content-Type'] = 'multipart/form-data';

        return this.http.post(this.apiBase + '/reviews/' + review_id + '/photos', data, { headers: headers })
          .map(res => res.json());

      });

  }

  /**
   * Function get videos
   */
  getVideos(params?: any) {

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);

      return this.http.get(this.apiBase + '/videos?' + queryString).map(res => res.json());

    } else {

      return this.http.get(this.apiBase + '/videos').map(res => res.json());

    }

  }

  /**
   * Function get media
   */
  getMedia(params?: any) {

    if (params && Object.getOwnPropertyNames(params).length > 0) {

      let queryString = this.paramsToQueryString(params);
      return this.http.get(this.apiBase + '/media?' + queryString).map(res => res.json());

    } else {

      return this.http.get(this.apiBase + '/media').map(res => res.json());

    }

  }

  /**
   * Function get base url
   */
  getBaseUrl() {
    return this.apiBase;
  }

  /**
   * Function get all config
   */
  getConfigAll(): Observable<any> {
    return this.http.get(this.apiBase + '/config/all')
      .map(res => res.json());
  }

  /**
   * Function send email contact
   */
  sendEmail(email) {
    return Observable.fromPromise(this.setHeaders(true)).switchMap((headers) => {
      return this.http.post(this.apiBase + '/contact', JSON.stringify(email), { headers: headers })
        .map(res => res.json());
    });
  }

  /**
   * Function add favorite
   */
  addFavorite(listingId) {
    return Observable.fromPromise(this.setHeaders(true)).switchMap((headers) => {
      return this.http.post(this.apiBase + `/listings/${listingId}/favorites/add`, JSON.stringify(listingId), { headers: headers })
        .map(res => res.json());
    });
  }

  /**
   * Function remove favorite
   */
  removeFavorite(listingId) {
    return Observable.fromPromise(this.setHeaders(true)).switchMap((headers) => {
      return this.http.post(this.apiBase + `/listings/${listingId}/favorites/remove`, JSON.stringify(listingId), { headers: headers })
        .map(res => res.json());
    });
  }

  /**
   * Function search option write review
   */
  searchOption(item, str) {
    return Observable.fromPromise(this.setHeaders(true)).switchMap((headers) => {
      return this.http.get(this.apiBase + `/fields/${item}?q=${str}`).map(res => res.json());
    });
  }

  /**
   * Function request href
   */
  requestUrl(url) {
    return this.http.get(url).map(res => res.json());
  }

  /**
   * Function get config from Origami
   */
  getOrigamiConfig(apiURL, appId, appHash) {
    
    let origamiApiUrl = `${apiURL}/mobile-app/${parseInt(appId)}/config?key=${appHash}`;

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    return this.http.get(origamiApiUrl, { headers: headers }).map(res => res.json());
    
  }

  /**
   * Function overwrite images of directories & categories
   */
  overwriteImages(listingsData, directories, categories, type: string, dirId?) {

    switch (type) {

      case 'listings': {

        if (listingsData.listings.items.length > 0) {
          
          listingsData.listings.items.forEach(item => {
    
            item = this.replaceImages(item, directories, categories);
    
          });
    
        }

        break;
      }

      case 'reviews': {

        if (listingsData.reviews.items.length > 0) {
          
          listingsData.reviews.items.forEach(item => {
    
            item.listing = this.replaceImages(item.listing, directories, categories);
    
          });
    
        }

        break;
      }

      case 'directories': {

        if (listingsData.directories.items.length > 0) {

          listingsData.directories.items.forEach(item => {

            if (directories.length > 0) {

              directories.forEach(data => {

                if (data.dir_id === item.id && data.image) {
                  item.image = data.image;
                }

              });

            }

          });

        }

        break;

      }

      case 'categories': {
        
        if (listingsData.categories.items.length > 0) {

          listingsData.categories.items.forEach(item => {

            if (categories.length > 0) {

              categories.forEach(data => {

                if (data.cat_id === item.id && data.image !== '') {
                  item.image = data.image;
                } else if (data.cat_id === item.id && data.image === '') {

                  if (directories.length > 0) {
                    
                    directories.forEach(el => {
      
                      if (el.dir_id === dirId && el.image) {
                        item.image = el.image;
                      }
      
                    });
      
                  }

                }

              });

            }

          });

        }

        break;

      }

      case 'subCategories': {
        
        if (listingsData.children.length > 0) {

          listingsData.children.forEach(item => {

            if (categories.length > 0) {

              categories.forEach(data => {

                if (data.cat_id === item.id && data.image !== '') {
                  item.image = data.image;
                } else if (data.cat_id === item.id && data.image === '') {

                  if (directories.length > 0) {
                    
                    directories.forEach(el => {
      
                      if (el.dir_id === dirId && el.image) {
                        item.image = el.image;
                      }
      
                    });
      
                  }

                }

              });

            }

          });

        }

        break;

      }

      case 'listingDetail': {
        listingsData = this.replaceImages(listingsData, directories, categories);
        break;
      }

      default: {
        break;
      }

    }

    return listingsData;

  }

  /**
   * Function replace images
   */
  replaceImages(item, directories, categories) {

    if (directories.length > 0) {
      
      directories.forEach(data => {

        if (item.directory && data.dir_id === item.directory.id && data.image) {

          item.directory.image = data.image;

        }

      });

    }

    if (categories.length > 0) {

      categories.forEach(data => {

        if (item.category && data.cat_id === item.category.id && data.image && data.image) {

          item.category.image = data.image;

        }

      });

    }

    return item;

  }

  /**
   * Check environment is iframe
   */
  isIframe() {
    return this.env === 'iframe' ? true : false;
  }

}
