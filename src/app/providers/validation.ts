import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ValidationService {

  selectImages: any;

  constructor(){

  }
  
  getValidateImages = () => {
      return this.selectImages;
  }

  isEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  replaceNumberByString(str) {
    return str.replace(/[0-9]/g, "X");
  }

  removeStringFromArray(arr: Array<any>, str: String){
    arr.forEach(el => {      
      if (str.includes(el)){
        str = str.replace(el, " ");
      }
    });    
    return str;
  }

}