import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertString',
})
export class ConvertStringPipe implements PipeTransform {

  transform(value: string, ...args) {
    return value.substring(0,1).toUpperCase();
  }

}
