import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
  name: 'pipesUrl',
})
export class PipesUrlPipe implements PipeTransform {

  constructor(private _dom: DomSanitizer) {

  }

  transform(value: string, ...args) {
    return this._dom.bypassSecurityTrustResourceUrl(value);
  }
}
