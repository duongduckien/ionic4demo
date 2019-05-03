import { Component, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ViewController, ToastController, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import { ImagePicker } from '@ionic-native/image-picker/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Storage } from '@ionic/storage';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { AlertController, normalizeURL } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import _ from 'lodash';

// Services
import { APIService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { AuthService } from '../../providers/auth';
import { ValidationService } from '../../providers/validation';
import { HelperService } from '../../providers/helper';
import { WriteReviewService } from '../../providers/write-review/write-review';

// Interfaces
import { AutocompleteSuggestion } from '../../interfaces/autocomplete-suggestion';
import { Account } from '../../interfaces/write-review-interface';

// Redux
import { NgRedux } from 'ng2-redux';
import { MAP_SHOW_MESSAGE } from '../../actions';

@IonicPage()
@Component({
  selector: 'page-write-review',
  templateUrl: 'write-review.html'
})
export class WriteReviewPage {

  public keyUp = new Subject<any>();
  public searchListing = new Subject<any>();
  public optionName: any;
  public fieldId: any;
  public tagsInput: any = {};
  public msgInput: any = {};
  public arrControlled: any = [];
  public relationOfSelectField: any = [];
  public originalDataOfSelectField: any = [];
  public listingTypeData: any = {};
  public review: any = {
    ratings: {},
    fields: {}
  };
  public account: Account = {
    name: '',
    email: ''
  }
  public tmp: any;
  public dataParams: any;
  public pageParams: any;
  public guest: any;
  public user: any;
  public reviewIdToRedirect: any;
  public permissionUpload: boolean = true;
  public create_review: boolean;
  public loader: any;
  public showForm: boolean = false;
  public showListingSearch: boolean = false;
  public searching: boolean = false;
  public message: string = '';
  public listings: any = [];
  public imageSelected: any = [];
  public fileSelected: any = [];
  public errorValidatePhotos: any = [];
  public messageAfterSubmit: any = [];
  public autocompleteValue: any = [];
  public configPhoto: any;
  public isSubmit: boolean = false;
  public validates: any = {};
  public autocompleteResult: AutocompleteSuggestion;
  public control_field_name: any = '';
  public showSuggestion: boolean = false;
  public hint: String = this.translate.instant('TYPING_SUGGESTION');
  public showRatingError=false;
  public fieldsError: any = [];
  
  constructor(
    public navCtrl: NavController,
    public statusBar: StatusBar,
    public navParams: NavParams,
    public events: Events, 
    public viewCtrl: ViewController,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController,
    public translate: TranslateService,
    public apiService: APIService,
    public configService: ConfigService,
    public storage: Storage,
    public validationService: ValidationService,
    public alertCtrl: AlertController,
    public helperService: HelperService,
    public authService: AuthService,
    public element: ElementRef,
    private imagePicker: ImagePicker,
    private camera: Camera,
    private transfer: FileTransfer,
    private writeReviewService: WriteReviewService,
    private ngRedux: NgRedux<any>
  ) {

    this.pageParams = _.merge({}, configService.getPageDefaults('writeReviewsPage').pageParams, navParams.get('pageParams'));
    this.dataParams = _.merge({}, configService.getPageDefaults('writeReviewsPage').dataParams, navParams.get('dataParams'));

    this.permissionUpload = this.dataParams.review_photo_upload;
    this.create_review = this.dataParams.create_review;

    this.presentLoading();

    this.keyUp.map(event => event.target.value)
      .debounceTime(300)
      .distinctUntilChanged()
      .flatMap(search => Observable.of(search).delay(0))
      .subscribe((data) => {
        this.onChangeInput(data);
      });

    this.searchListing.map(event => {
      this.listings = [];
      this.showForm = false;
      return event.target.value
    })
    .debounceTime(300)
    .distinctUntilChanged()
    .flatMap(search => Observable.of(search).delay(0))
    .subscribe((data) => {
      this.findListings(data);
    });

  }

  ionViewDidLoad() {
    this.events.publish('page.didload');
    this.statusBar.overlaysWebView(false);
    
    if (this.dataParams.listing_id) {
      this.showForm = true;
    } else {
      this.showListingSearch = true;
      this.loader.dismiss();
    }

    // Get data of listing
    if (this.dataParams.type_id) {
      this.getListingTypeData();
    }

    // Set user info for guests
    this.authService.authenticated().then(value => {

      const guest = this.navParams.get('guest');

      if (!value && guest) {

        this.review.email = guest.email;
        this.review.name = guest.name;
        this.account.email = guest.email;
        this.account.name = guest.name;
      }

    });
  }

  ionViewWillEnter() {
    this.statusBar.overlaysWebView(false);
    console.log('WriteReview ionViewWillEnter');
  }

  ionViewDidEnter() {
    this.statusBar.overlaysWebView(false);
    console.log('WriteReview ionViewDidEnter');
  }

  /**
   * Function get listing type data
   */
  async getListingTypeData() {

    try {

      let reviewData = await this.getReviewData(this.dataParams);
      this.configPhoto = await this.getPhotoConfig();

      // Create field relationship
      this.arrControlled = this.writeReviewService.getFieldControlled(reviewData);
      this.originalDataOfSelectField = this.writeReviewService.getOriginDataOfSelectField(reviewData.fields);
      this.relationOfSelectField = this.writeReviewService.relationOfSelectField(reviewData.fields);
      this.listingTypeData = reviewData;

      // Setup form review
      let resultUpdate = this.writeReviewService.updateReviewForm(this.listingTypeData.field_groups, this.listingTypeData.fields);
      this.listingTypeData.field_groups_filtered = resultUpdate.fieldGroupsFiltered;
      this.tagsInput = resultUpdate.tagsInput;
      this.msgInput = resultUpdate.msgInput;

      this.loader.dismiss();

    } catch (e) {
      console.log(e);
      this.loader.dismiss();
    }

  }

  /**
   * Function get autocomplete
   */
  chooseSuggestion(value, text, fieldName, fieldId) {

    if (this.arrControlled.length > 0) {
      for (let i = 0; i < this.arrControlled.length; i++) {
        if (this.arrControlled[i].control_by === fieldId) {
          this.showFieldOrGroupField(this.arrControlled[i], value);
        }
      }
    }

    this.autocompleteValue.push({
      data_field_name: this.control_field_name,
      data_text: text,
      data_value: value,
      field_name: fieldName
    });

    this.review.fields[this.control_field_name] = '';
    this.tmp = '';

    if (this.tagsInput[fieldName]) {
      if (this.tagsInput[fieldName].length > 0) {
        if (!this.writeReviewService.checkExistInArray(this.tagsInput[fieldName], value, 'value')) {
          this.tagsInput[fieldName].push({
            text: text,
            value: value,
            fieldId: fieldId,
            show: true
          });
        }
      } else {
        this.tagsInput[fieldName].push({
          text: text,
          value: value,
          fieldId: fieldId,
          show: true
        });
      }
    }

    setTimeout(() => {
      this.showSuggestion = false;
    }, 300);

  }

  /**
   * Function show field or group field
   */
  showFieldOrGroupField(data, value) {

    // Value of autocomplete field not empty
    if (value != '') {

      if (data.type === 'field_groups') {
        if (data.control_value.indexOf(value) >= 0) {
          for (let i = 0; i < this.listingTypeData.field_groups_filtered.length; i++) {
            if (this.listingTypeData.field_groups_filtered[i].groupid === data.id) {
              this.listingTypeData.field_groups_filtered[i].show = true;
            }
          }
        }
      }

      if (data.type === 'fields') {
        if (data.control_value.indexOf(value) >= 0) {
          for (let i = 0; i < this.listingTypeData.field_groups_filtered.length; i++) {
            for (let j = 0; j < this.listingTypeData.field_groups_filtered[i].fields.length; j++) {
              if (this.listingTypeData.field_groups_filtered[i].fields[j].fieldid === data.id) {
                this.listingTypeData.field_groups_filtered[i].fields[j].show = true;
              }
            }
          }
        }
      }

    }

  }

  onChangeValue(optionName, fieldId, event) {
    this.optionName = optionName;
    this.fieldId = fieldId;
  }

  /**
   * Function when on change input
   */
  async onChangeInput(event) {

    let optionName = this.optionName;

    this.showSuggestion = true;
    this.control_field_name = optionName;
    this.autocompleteResult = {
      name: optionName,
      data: []
    };

    if (event.trim() != '') {

      try {

        // Set message for not found result
        this.msgInput[optionName] = ' ';

        let resultSearch = await this.searchData(optionName, event);

        if (resultSearch.field_options && resultSearch.field_options.items.length > 0) {
          if (this.listingTypeData.fields.length > 0) {
            for (let i = 0; i < this.listingTypeData.fields.length; i++) {
              if (this.listingTypeData.fields[i].name === optionName) {
                this.listingTypeData.fields[i].options = resultSearch.field_options.items;
              }
            }
          }
        }

        // this.autocompleteResult = resultSearch.field_options.items;

        let resultGetObject = this.getObjectOfFields(optionName, this.listingTypeData.fields);
        let resultCheckObject = this.checkObjectInArrayObject(resultGetObject, resultSearch.field_options.items);

        this.autocompleteResult = {
          name: optionName,
          data: resultCheckObject
        }

      } catch (e) {

        console.log(e);

        this.msgInput[optionName] = 'No results found, try a different spelling.';
        this.autocompleteResult = {
          name: optionName,
          data: []
        };

      }

    } else {
      this.showSuggestion = false;
      this.msgInput[optionName] = ' ';
    }

  }

  /**
   * Function search data from API
   */
  searchData(optionName, event): Promise<any> {

    return new Promise((resolve, reject) => {
      this.apiService.searchOption(optionName, event).subscribe(res => {
        console.log(res);
        resolve(res);
      }, err => {
        reject(err);
      });
    });

  }

  /**
   * Function get object of field
   */
  getObjectOfFields(optionName, arrSrc) {
    let arrValue = [];
    if (arrSrc.length > 0) {
      for (let i = 0; i < arrSrc.length; i++) {
        if (arrSrc[i].name === optionName) {
          for (let j = 0; j < arrSrc[i].options.length; j++) {
            arrValue.push(arrSrc[i].options[j].value);
          }
        }
      }
    }
    return arrValue;
  }

  /**
   * Function check object in array object
   */
  checkObjectInArrayObject(arrVal, arrDes) {
    let arrNew = [];
    for (let i = 0; i < arrDes.length; i++) {
      if (arrVal.indexOf(arrDes[i].value) >= 0) {
        arrNew.push(arrDes[i]);
      }
    }
    return arrNew;
  }

  /**
   * Function set status tag
   */
  setStatusTag(value, fieldName) {

    // Set empty error field
    // this.fieldsError = [];
    this.fieldsError = [];

    if (this.tagsInput[fieldName] && this.tagsInput[fieldName].length > 0) {
      for (let i = 0; i < this.tagsInput[fieldName].length; i++) {
        if (this.tagsInput[fieldName][i].value === value) {
          this.tagsInput[fieldName][i].show = this.tagsInput[fieldName][i].show ? false : true;
          this.statusOfField(this.tagsInput[fieldName][i].fieldId, value, this.tagsInput[fieldName][i].show);
        }
      }
    }
  }

  /**
   * Function show or hide field relation
   */
  statusOfField(fieldId, value, status: boolean) {
    if (this.arrControlled.length > 0) {
      for (let i = 0; i < this.arrControlled.length; i++) {

        if (status) {

          if (this.arrControlled[i].control_by === fieldId) {
            this.showFieldOrGroupField(this.arrControlled[i], value);
          }

        } else {

          if (this.arrControlled[i].control_by === fieldId && (this.arrControlled[i].control_value.indexOf(value) !== -1) && this.arrControlled[i].type === 'field_groups') {
            this.hideGroupField(this.arrControlled[i].id);
          }

          if (this.arrControlled[i].control_by === fieldId && (this.arrControlled[i].control_value.indexOf(value) !== -1) && this.arrControlled[i].type === 'fields') {
            this.hideField(this.arrControlled[i].id);
          }

        }

      }
    }
  }

  /**
   * Function on select changed
   */
  onSelectChange(event, fieldid) {

    console.log(event);
    console.log(fieldid);
    console.log(this.review);

    if (this.arrControlled.length > 0) {
      for (let i = 0; i < this.arrControlled.length; i++) {

        // Type field group
        if (this.arrControlled[i].control_by === fieldid && this.arrControlled[i].type === 'field_groups') {
          if (this.arrControlled[i].control_value.length > 0) {
            if (this.arrControlled[i].control_value.indexOf(event) !== -1) {
              this.showGroupField(this.arrControlled[i].id);
            } else {
              this.hideGroupField(this.arrControlled[i].id);
            }
          } else {
            this.showGroupField(this.arrControlled[i].id);
          }
        }

        // Type field
        if (this.arrControlled[i].control_by === fieldid && this.arrControlled[i].type === 'fields') {
          if (this.arrControlled[i].control_value.length > 0) {
            if (this.arrControlled[i].control_value.indexOf(event) !== -1) {
              this.showField(this.arrControlled[i].id);
            } else {
              this.hideField(this.arrControlled[i].id);
            }
          } else {

            // Check relation select field
            let arrValueSelected = this.helperService.getValueOfSelectField(event, fieldid, this.relationOfSelectField);

            // Convert listing type data
            this.listingTypeData.field_groups_filtered = this.helperService.convertListingTypeData(arrValueSelected, this.listingTypeData.field_groups_filtered);

            this.showField(this.arrControlled[i].id);

          }
        }

      }
    }

  }

  /**
   * Function hide group field
   */
  hideGroupField(id) {
    this.listingTypeData.field_groups_filtered = this.helperService.statusGroupFieldService(this.listingTypeData.field_groups_filtered, id, 'hide');
  }

  /**
   * Function hide field
   */
  hideField(id) {
    this.listingTypeData.field_groups_filtered = this.helperService.statusFieldService(this.listingTypeData.field_groups_filtered, id, 'hide');
  }

  /**
   * Function show group field
   */
  showGroupField(id) {
    this.listingTypeData.field_groups_filtered = this.helperService.statusGroupFieldService(this.listingTypeData.field_groups_filtered, id, 'show');
  }

  /**
   * Function show field
   */
  showField(id) {
    this.listingTypeData.field_groups_filtered = this.helperService.statusFieldService(this.listingTypeData.field_groups_filtered, id, 'show');
  }

  validators = {
    "required": (value) => {
      const result = {
        text: 'VALIDATION_REQUIRED',
        error: false
      };

      if (!value || value === '') {
        result.error = true;
      }

      return result;
    },

    "url": (value) => {
      const result = {
        text: 'INVALID_WEBSITE_ADDRESS',
        error: false
      };
      if (!value.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)) {
        result.error = true;
      }
      return result;
    }

  }

  validatorTypes = {
    "website": (value) => {
      return this.execValidate(["required", "url"], value);
    }
  }

  execValidate(validators, value) {
    let result;
    for (let i = 0; i < validators.length; i++) {
      const validator = this.validators[validators[i]];
      result = validator(value);

      if (result && result.error) {
        return result;
      }
    }
  }

  validateField(field, value) {

    const validator = this.validatorTypes[field.type];

    if (validator) {
      return validator(value);
    }

    return { text: '', error: false };

  }

  isBlured = false;
  onBlurField(event, field) {
    if (!this.isBlured) {
      this.isBlured = true;
      this.validateFields([field.name]);
    }
  }

  onChangeField(event, field) {
    if (this.isBlured) {
      this.validateFields([field.name]);
    }
  }

  validateFields(fieldNames = ['websitereviews']) {

    let isValid = true;

    if (fieldNames.length > 0) {

      for (let i = 0; i < fieldNames.length; i++) {

        const fieldName = fieldNames[i];
        const fieldValue = this.review.fields[fieldName];
        const [group, field] = this.getFieldFromListingByName(fieldName);

        this.validates[fieldName] = (group && group.show) && field && this.validateField(field, fieldValue);

        if (this.validates[fieldName] && this.validates[fieldName].error) {
          isValid = false;
        }

      }

    }

    return isValid;

  }

  /**
   * Function check error to show border bottom red color
   */
  checkErrorTemplate(fieldName) {
    if (this.fieldsError.length > 0) {
      let arrName = [];
      this.fieldsError.forEach(item => {
        arrName.push(item.name);
      });
      if (arrName.indexOf(fieldName) !== -1) {
        return true;
      }
      return false;
    }
    return false;
  }

  /**
   * Function diable error in form
   */
  disableError(fieldName) {
    if (this.fieldsError.length > 0) {
      for (let i = 0; i < this.fieldsError.length; i++) {
        if (this.fieldsError[i].name === fieldName) {
          this.fieldsError.splice(i, 1);
        }
      }
    }
  } 

  getFieldFromListingByName(name) {
    const groups = this.listingTypeData.field_groups_filtered;
    if (groups && groups.length > 0) {

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const field = group.fields && group.fields.find((f) => {
          return f.name === name;
        });

        if (field) {
          return [group, field];
        }
      }
    }

    return [null, null]
  }

  onClearRating(event, criterion) {
    if (this.review.ratings[criterion.id]) {
      this.review.ratings[criterion.id] = 0;
    }
  }

  /**
   * Function submit reviews
   */
  async dataSubmit() {

    let loader = this.loadingCtrl.create({
      content: this.translate.instant("SUBMITTING_REVIEW"),
    });

    // if (!this.validateFields()) {
    //   return;
    // }

    if(!this.checkValidateRating()) {
      this.showRatingError = true;
      return;
    }

    this.isSubmit = true;

    loader.present();

    try {

      this.errorValidatePhotos = [];
      this.messageAfterSubmit = [];

      // If user selected photo when submit reviews
      if (this.fileSelected.length > 0) {

        let reviewData = this.writeReviewService.removeOptionToSubmit(this.tagsInput, this.listingTypeData.field_groups_filtered, this.review);
        let reviewDataSubmit = this.writeReviewService.addAutoCompleteFieldToSubmit(reviewData.reviewData, reviewData.arrHidden, reviewData.arrParent, this.tagsInput, 'fields');
        let resultOfData = await this.submitReviewData(this.dataParams.listing_id, reviewDataSubmit);

        this.reviewIdToRedirect = this.writeReviewService.getIdSubmitReview(resultOfData.data);

        // Upload photos
        let resultOfPhoto = await this.uploadImages(this.account.name, this.account.email, '', this.reviewIdToRedirect);

        if ((resultOfData.statusCode === this.configService.statusCode.published) && (resultOfPhoto[0] === this.configService.statusCode.published)) {
          this.helperService.setMessage(this.translate.instant("SUCCESS_REVIEW"));
          this.navCtrl.push('ReviewDetailPage', {
            dataParams: { review_id: this.reviewIdToRedirect },
            pageParams: this.pageParams
          }).then(() => {
            this.removeItemStack();
          });
        } else if ((resultOfData.statusCode === this.configService.statusCode.moderated) && (resultOfPhoto[0] === this.configService.statusCode.moderated)) {
          this.helperService.setMessage(this.translate.instant("PENDING_VERIFY"));
          this.navCtrl.push('ListingDetailPage', {
            dataParams: this.dataParams,
            pageParams: this.pageParams
          }).then(() => {
            this.removeItemStack();
          });
        } else if ((resultOfData.statusCode === this.configService.statusCode.published) && (resultOfPhoto[0] === this.configService.statusCode.moderated)) {
          this.helperService.setMessage(this.translate.instant("PENDING_REVIEW_PHOTO"));
          this.navCtrl.push('ReviewDetailPage', {
            dataParams: { review_id: this.reviewIdToRedirect },
            pageParams: this.pageParams
          }).then(() => {
            this.removeItemStack();
          });
        }

        this.isSubmit = false;
        loader.dismiss();

      } else {

        let reviewData = this.writeReviewService.removeOptionToSubmit(this.tagsInput, this.listingTypeData.field_groups_filtered, this.review);
        let reviewDataSubmit = this.writeReviewService.addAutoCompleteFieldToSubmit(reviewData.reviewData, reviewData.arrHidden, reviewData.arrParent, this.tagsInput, 'fields');
        let result = await this.submitReviewData(this.dataParams.listing_id, reviewDataSubmit);

        this.reviewIdToRedirect = this.writeReviewService.getIdSubmitReview(result.data);

        if (result.statusCode === this.configService.statusCode.published) {
          this.helperService.setMessage(this.translate.instant("SUCCESS_REVIEW"));
          this.navCtrl.push('ReviewDetailPage', {
            dataParams: { review_id: this.reviewIdToRedirect },
            pageParams: this.pageParams
          }).then(() => {
            this.removeItemStack();
          });
        } else if (result.statusCode === this.configService.statusCode.moderated) {
          this.helperService.setMessage(this.translate.instant("PENDING_VERIFY"));
          this.navCtrl.push('ListingDetailPage', {
            dataParams: this.dataParams,
            pageParams: this.pageParams
          }).then(() => {
            this.removeItemStack();
          });;
        }

        this.isSubmit = false;
        loader.dismiss();
      }

    } catch (e) {

      this.fieldsError = this.helperService.getErrorSubmit(JSON.parse(e._body).fields);

      console.log(this.fieldsError);

      loader.dismiss();

    }

  }

  /**
   * Function upload all photos
   */
  async uploadImages(name: string, email: string, caption: string, reviewId: number) {

    try {

      let token = await this.authService.getToken();
      let url = `${this.apiService.getBaseUrl()}/reviews/${reviewId}/photos`;

      let resultUpload = [];

      for (let i = 0; i < this.fileSelected.length; i++) {
        let result = await this.writeReviewService.uploadPhoto(name, email, caption, this.fileSelected[i], url, token);
        if (result.responseCode) {
          resultUpload.push(result.responseCode);
        }
      }

      return resultUpload;

    } catch (e) {
      console.log(e);
    }

  }

  /**
   * Function get review data
   */
  getReviewData(dataParams): Promise<any> {

    return new Promise((resolve, reject) => {

      this.apiService.getListingTypeReviewData(dataParams).subscribe(data => {
        resolve(data);
      }, err => {
        reject(err);
      });

    });

  }

  /**
   * Function get config of photo
   */
  getPhotoConfig(): Promise<any> {

    return new Promise((resolve, reject) => {

      this.apiService.getConfigPhoto().subscribe(data => {
        resolve(data);
      }, err => {
        reject(err);
      });

    });

  }

  /**
   * Function submit review data
   */
  submitReviewData(listingId, reviewData): Promise<any> {
    console.log('Submit review data', listingId, reviewData);
    return new Promise((resolve, reject) => {
      this.apiService.createReview(listingId, reviewData).subscribe(res => {
        resolve(res);
      }, err => {
        reject(err);
      })
    })
  }

  /**
   * 
   */
  onTextareaChange() {
    this.events.publish('onTextareaChange');
  }

  /**
   * 
   */
  closeModal() {
    this.viewCtrl.dismiss();
  }

  /**
   * Function action when change rating
   * @param event - detail of event
   */
  onRatingChange(event) {
    this.review.ratings[event.id] = event.value;
  }

  /**
   * 
   */
  removeItemStack() {
    this.navCtrl.remove(this.navCtrl.getViews().length - 2);
  }

  /**
   * 
   */
  validatePhotos(): Promise<any> {

    return new Promise((resolve, reject) => {

      const fileTransfer: FileTransferObject = this.transfer.create();

      let options: FileUploadOptions = {
        fileKey: 'photo',
        fileName: 'name.jpg',
        chunkedMode: false,
        mimeType: "image/jpg",
      }

      let count = 0;
      for (let i = 0; i < this.fileSelected.length; i++) {
        fileTransfer.upload(this.fileSelected[i].toString(), encodeURI(this.apiService.getBaseUrl() + "/reviews/validate_photos"), options)
          .then(data => {
            resolve(this.errorValidatePhotos);
          }, err => {
            count++;

            if (this.helperService.convertJson(err.body)) {
              this.errorValidatePhotos.push(this.helperService.convertJson(err.body));
            }

            if (count == this.fileSelected.length) {
              resolve(this.errorValidatePhotos);
            }
          });
      }

    });

  }

  /**
   * 
   */
  pickerImage() {
    let options = {
      maximumImagesCount: this.validationService.getValidateImages().maximumImagesCount,
      width: this.validationService.getValidateImages().width,
      height: this.validationService.getValidateImages().height,
      quality: this.validationService.getValidateImages().quality
    };
    this.imagePicker.getPictures(options);
  }

  /**
   * Function show popup select method upload photos
   */
  showRadio() {
    let alert = this.alertCtrl.create();
    alert.setTitle(this.translate.instant("TITLE_CHOOSE_ACTION"));

    alert.addInput({
      type: 'radio',
      label: this.translate.instant("PHOTO"),
      value: '1',
      checked: true
    });

    alert.addInput({
      type: 'radio',
      label: this.translate.instant("CAPTURE"),
      value: '2',
    });

    alert.addButton(this.translate.instant("BTN_CANCEL"));
    alert.addButton({
      text: this.translate.instant('BTN_OK'),
      handler: data => {
        if (data == '1') {
          this.addPhotos();
        } else {
          this.captureImage();
        }
      }
    });
    alert.present();
  }

  /**
   * Function get photo from library
   */
  addPhotos() {

    let options = {
      maximumImagesCount: this.validationService.getValidateImages().maximumImagesCount,
      width: this.validationService.getValidateImages().width,
      height: this.validationService.getValidateImages().height,
      quality: this.validationService.getValidateImages().quality
    };

    // Check permision
    this.imagePicker.hasReadPermission().then((permission) => {
      if (permission) {
        this.imagePicker.getPictures(options).then(images => {
          for (let i = 0; i < images.length; i++) {
            this.imageSelected.push(normalizeURL(images[i]));
            this.fileSelected.push(images[i]);
          }
        });
      } else {
        this.imagePicker.getPictures(options).then(results => {
          setTimeout(() => {
            this.imagePicker.getPictures(options).then(images => {
              if (images !== 'OK') {
                for (let i = 0; i < images.length; i++) {
                  this.imageSelected.push(normalizeURL(images[i]));
                  this.fileSelected.push(images[i]);
                }
              }
            });
          }, 2000);
        });
      }
    });

  }

  /**
   * Function remove image from list
   */
  removeImage(index) {

    let confirm = this.alertCtrl.create({
      title: this.translate.instant('TITLE_DELETE_IMAGE'),
      message: this.translate.instant('CONTENT_DELETE_IMAGE'),
      buttons: [
        {
          text: this.translate.instant("BTN_CANCEL"),
          handler: () => {

          }
        },
        {
          text: this.translate.instant('BTN_OK'),
          handler: () => {
            if (this.imageSelected.length > 0) {
              this.imageSelected.splice(index, 1);
              this.fileSelected.splice(index, 1);
            }
          }
        }
      ]
    });

    confirm.present();

  }

  /**
   * Function capture image
   */
  captureImage() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true
    }

    this.camera.getPicture(options)
      .then(imageURI => {
        this.imageSelected.push(normalizeURL(imageURI));
        this.fileSelected.push(imageURI);
      }, err => {
        console.log(err);
      });

  }

  /**
   * Function search listing
   */
  findListings(dataSearch) {

    this.message = '';

    if (dataSearch && dataSearch.length > 2) {

      this.searching = true;

      this.listings = [];

      let params = {
        q: dataSearch,
        object: 'listing',
        limit: 5
      }

      params = Object.assign(this.dataParams, params);

      for (let key in params) {
        if (Array.isArray(params[key]) && params[key].length === 0) {
          delete params[key];
        }
      }

      this.apiService.search(params).subscribe(data => {

        this.message = '';
        this.searching = false;       

        for (let i = 0; i < data.listings.items.length; i++) {
          if (!this.checkExist(this.listings, data.listings.items[i])) {
            this.listings.push(data.listings.items[i]);
          }
        }

        if (this.listings.length > 0) {
          this.ngRedux.dispatch({ type: MAP_SHOW_MESSAGE, payload: { status: false, message: '' } });
        }

      }, err => {
        this.searching = false;
        this.ngRedux.dispatch({ type: MAP_SHOW_MESSAGE, payload: { status: true, message: this.translate.instant('NO_LISTING') } });
        this.listings = [];
      });

    }

  }

  /**
   * Function clear search reviews
   */
  clearListingReviews() {
    this.listings = [];
    this.showForm = false;
  }

  /**
   * Function check exist 
   */
  checkExist(listings, item) {
    let arr = [];
    if (listings.length > 0) {
      for (let i = 0; i < listings.length; i++) {
        if (item && (listings[i].id === item.id)) {
          arr.push(i);
        }
      }
    }
    return (arr.length > 0) ? true : false;
  }

  /**
   * 
   */
  updateReviewForm(listing_id) {

    this.showForm = false;

    let params = {
      listing_id: listing_id
    }

    this.apiService.getListing(params).subscribe((data) => {
      this.dataParams.type_id = data.listing_type.id;
      this.dataParams.listing_id = data.id;
      this.getListingTypeData();
      this.showForm = true;
    });
  }

  /**
   * Function show loading
   */
  presentLoading() {
    this.loader = this.loadingCtrl.create();
    this.loader.present();
  }

  checkValidateRating() {

    let listRequired = [];

    if (this.listingTypeData.criteria && this.listingTypeData.criteria.length > 0) {
      this.listingTypeData.criteria.forEach(e => {
        if (e.required) {
          listRequired.push(e.id)
        }
      });
    }

    if (listRequired.length > 0) {
      for (let i = 0; i < listRequired.length; i++) {
        if (!this.review.ratings[listRequired[i]]) {      
          return false;
        }
      }
    }

    return true;
    
  }

}