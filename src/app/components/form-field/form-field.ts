import { Component, Input } from '@angular/core';

@Component({
  selector: 'form-field',
  templateUrl: 'form-field.html'
})
export class FormField {

  @Input('type') type;
  @Input('options') options;

  constructor(

    ) {
    console.log('Hello FormField Component');
  }

}
