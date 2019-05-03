import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'convertlinks'
})
export class ConvertLinksPipe implements PipeTransform {

  constructor(private _dom: DomSanitizer) {
  }

  transform(value:string, linkType = '_system') {

    let replaced = false;
    let output = value;

  	if (value !== '') {
	    let regex = /href="([\S]+)"/g;
	    output = value.replace(regex, function(match, url) {
        replaced = true;
        return "href=\"#\" onclick=\"window.open('"+url+"', '"+linkType+"')\"";
	    });
  	}

    return replaced ? this._dom.bypassSecurityTrustHtml(output) : output;
  }

}
