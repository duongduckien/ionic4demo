import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'rating-selector',
  templateUrl: 'rating-selector.html'
})
export class RatingSelectorComponent {

  // inputValue: any;

  @Output() onChange = new EventEmitter();

  @Input('class') class;
  @Input('data') data;
  @Input('name') name;
  @Input('max') max;
  @Input('min') min;
  @Input('step') step;
  @Input('label') label;
  @Input('type') type;
  @Input('inputValue') inputValue = 0;

  constructor() {
  }

  handleOnChange(event) {
    // this.inputValue = 0;
    this.onChange.emit({
      value: event,
      id: this.name
    });
  }

  removeData() {
    this.handleOnChange(undefined);
  }

}
