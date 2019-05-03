import { Injectable } from '@angular/core';
import { GoogleAnalytics } from '@ionic-native/google-analytics';

// Services
import { ConfigService } from '../providers/config';

// Redux
import { select } from 'ng2-redux';

@Injectable({ providedIn: 'root' })
export class GA {

  @select('settings') settings;

  trackID: string;

  constructor(
    public googleAnalytics: GoogleAnalytics,
    public configService: ConfigService
  ) {

    this.settings.subscribe(data => {
      if (Object.keys(data).length > 0) {
        this.trackID = data.settings.integrations['google']['trackID'];
      }
    });

  }

  async gaMenus(title = '') {
    try {
      if (this.trackID && this.trackID != '') {
        await this.googleAnalytics.startTrackerWithId(this.trackID);
        await this.googleAnalytics.trackView('menu: ' + title);
        console.log('menu: ' + title + ' was tracked!');
      }
    } catch (e) {
      this.getError(e);
    }
  }

  async gaDirectory(title = '') {
    try {
      if (this.trackID && this.trackID != '') {
        await this.googleAnalytics.startTrackerWithId(this.trackID);
        await this.googleAnalytics.trackView('directory: ' + title);
        console.log('directory: ' + title + ' was tracked!');
      }
    } catch (e) {
      this.getError(e);
    }
  }

  async gaCategory(title = '') {
    try {
      if (this.trackID && this.trackID != '') {
        await this.googleAnalytics.startTrackerWithId(this.trackID);
        await this.googleAnalytics.trackView('category: ' + title);
        console.log('category ' + title + ' was tracked!');
      }
    } catch (e) {
      this.getError(e);
    }
  }

  async gaListingDetail(title = '') {
    try {
      if (this.trackID && this.trackID != '') {
        await this.googleAnalytics.startTrackerWithId(this.trackID);
        await this.googleAnalytics.trackView('listing: ' + title);
        console.log('listing: ' + title + ' was tracked!');
      }
    } catch (e) {
      this.getError(e);
    }
  }

  async gaReviewDetail(title = '') {
    try {
      if (this.trackID && this.trackID != '') {
        await this.googleAnalytics.startTrackerWithId(this.trackID);
        await this.googleAnalytics.trackView('review: ' + title);
        console.log('review: ' + title + ' was tracked!');
      }
    } catch (e) {
      this.getError(e);
    }
  }

  getError(e) {
    console.log('Error starting GoogleAnalytics', e);
  }

}