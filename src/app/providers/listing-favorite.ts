import { Injectable } from '@angular/core';
import { App } from "ionic-angular";

import { NgRedux, select } from 'ng2-redux';
import { UPDATE_LISTING_FAVORITE_STATE } from '../actions';
import _ from 'lodash';

import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class ListingFavoriteService {

	@select() listingFavoriteState;

	navCtrl: any;
	apiService: any;
	listing: any;

	postLoginCallback = (loader) => {

      if (loader) 
        loader.dismiss();

		this.process().subscribe(data => {
			console.log('Favorite add',this.listing.me);
			this.navCtrl.pop().then(() => {
			});
		});
  	};

	constructor(
      	private app: App,
    	public ngRedux: NgRedux<any>,
    	public authService: AuthService,
	) {
		// Replaced getActiveNavs()[] with getRootNav because the former generates an error when using tabs navigation
		this.navCtrl = this.app.getRootNav();
	}

	// Need to use this method because otherwise 'apiBase' doesn't have the right value when the service is autoloaded
	addApiService(apiService) {
		this.apiService = apiService;
		return this;
	}

	async changeState(listing) {
		
		this.listing = listing;

	    await this.authService.authenticated().then(isLoggedIn => {
			if (isLoggedIn) {
				this.process().subscribe(data => {
					console.log('Favorite',this.listing.me);
				});
			} else {
				this.navCtrl.push('AuthAccountPage', {
					activity: 'favorite',
					callback: this.postLoginCallback
				});
			}
	    });		
	}

	process() {
		if ( this.listing.me.favorite ) {
      		// Change the display here so the user can see it right away instead of waiting for API request to finish
      		this.listing.me.favorite = false;
			this.updateStore(this.listing.id,false);
			return this.apiService.removeFavorite(this.listing.id);
		} else {
      		// Change the display here so the user can see it right away instead of waiting for API request to finish
      		this.listing.me.favorite = true;
			this.updateStore(this.listing.id,true);
			return this.apiService.addFavorite(this.listing.id);
		}
	}

	updateStore(listingId, state) {
		this.listingFavoriteState.subscribe(data => {
			data[listingId] = state;
			this.ngRedux.dispatch({
				type: UPDATE_LISTING_FAVORITE_STATE,
				payload: data
			});
		});
	}

	addBackFavoriteState(listings) {
		if (listings.length > 0) {
			this.listingFavoriteState.subscribe(data => {
				if (!_.isEmpty(data)) {
					listings.forEach(listing => {
						if (data[listing.id] !== undefined) {
							listing.me.favorite = data[listing.id];
						}
					});
				}
			});	
		}
	}
}
