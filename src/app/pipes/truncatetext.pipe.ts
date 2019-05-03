import { Pipe, PipeTransform } from '@angular/core';

declare const Buffer;

@Pipe({
  name: 'truncatetext'
})
export class TruncateTextPipe implements PipeTransform {

  transform(value, length: number): string {

    const ellipsis = "...";
    const origLength = length;
    while (Buffer.byteLength(value) > origLength) {
        value = this.slice(value, 0, length--);
    }
    if (length < origLength) {
      value += ellipsis;
    }

    return value;
  }

  slice(string, start, end) {
      var accumulator = "";
      var character;
      var stringIndex = 0;
      var unicodeIndex = 0;
      var length = string.length;

      while (stringIndex < length) {
        character = this.charAt(string, stringIndex);
        if (unicodeIndex >= start && unicodeIndex < end) {
          accumulator += character;
        }
        stringIndex += character.length;
        unicodeIndex += 1;
      }
      return accumulator;
    }

    charAt(string, index) {
      var first = string.charCodeAt(index);
      var second;
      if (first >= 0xD800 && first <= 0xDBFF && string.length > index + 1) {
        second = string.charCodeAt(index + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
          return string.substring(index, index + 2);
        }
      }
      return string[index];
    }    
}
