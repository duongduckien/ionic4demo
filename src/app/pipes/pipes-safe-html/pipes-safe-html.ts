import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
  name: 'pipesSafeHtml',
  pure: false
})
export class PipesSafeHtmlPipe implements PipeTransform {

  constructor(private _dom: DomSanitizer) {
    
  }

  transform(value: any, ...args) {
    return this._dom.bypassSecurityTrustHtml(value);
  }

}
