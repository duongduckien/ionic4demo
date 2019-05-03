import { BaseRequestOptions, RequestOptionsArgs, RequestOptions } from '@angular/http';
import { Injectable, Injector } from '@angular/core';

// Services
import { ConfigService } from './config';

@Injectable({ providedIn: 'root' })
export class AppRequestOptions extends BaseRequestOptions {

  constructor (
    private injector: Injector
  ) {
    super();
  }

  merge(options?: RequestOptionsArgs): RequestOptions {
    let newOptions = super.merge(options);
    this.injector.get(ConfigService).settings;
    return newOptions;
  }

}