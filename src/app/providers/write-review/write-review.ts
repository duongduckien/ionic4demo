import { Injectable } from '@angular/core';
import { App } from 'ionic-angular';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import 'rxjs/add/operator/map';

import { AuthService } from '../auth';

@Injectable({ providedIn: 'root' })
export class WriteReviewService {

  navCtrl: any;
  apiService: any;
  listing: any;
  dataParams: any;
  pageParams: any;

  postLoginCallback = (loader,user) => {
    
    this.authService.authenticated().then(isLoggedIn => {
      
      if (loader) 
        loader.dismiss();

      if ( !isLoggedIn && this.listing ) {
        this.dataParams.review_photo_upload = this.listing.permissions.review_photo_upload;
        this.goToWriteReviewPage(user);
      } else {
        this.apiService.getListing({ listing_id: this.listing.id }).subscribe(data => {
          this.dataParams.review_photo_upload = data.permissions.review_photo_upload;
          this.dataParams.is_editor = data.permissions.is_editor;
          this.goToWriteReviewPage(undefined);
        });
      }

    });

    console.log('WriteReview postLogin Callback');
  };

  constructor(
      private app: App,
      private transfer: FileTransfer,
      public authService: AuthService,
  ) {
    this.navCtrl = this.app.getActiveNavs()[0];
  }

  addApiService(apiService) {
    this.apiService = apiService;
    return this;
  }  

  async showForm(listing, dataParams, pageParams) {
    let res: boolean;
    this.listing = listing;
    this.dataParams = dataParams;
    this.pageParams = pageParams;

    this.authService.authenticated().then(isLoggedIn => {
      if (isLoggedIn) {
        this.navCtrl.push('WriteReviewPage', {
          dataParams: dataParams
        });
        res = true
      } else {
        this.navCtrl.push('AuthAccountPage', {
          activity: 'write-review',
          callback: this.postLoginCallback,
          dataParams: dataParams,
          pageParams: pageParams
        });

        res = false;
      }
    });   

    return await res;
  }

  goToWriteReviewPage(user) {
    this.navCtrl.push('WriteReviewPage', {
      listing: this.listing,
      dataParams: this.dataParams,
      pageParams: this.pageParams,
      guest: user
    }).then(() => {
      this.navCtrl.remove(this.navCtrl.getViews().length - 2);
    });
  }

  /**
   * Function upload photos
   */
  uploadPhoto(name: string, email: string, caption: string, file: any, url: string, token: string): Promise<any> {

    return new Promise((resolve, reject) => {

      const fileTransfer: FileTransferObject = this.transfer.create();

      // Upload image
      let options: FileUploadOptions = {
        fileKey: 'photo',
        fileName: `${new Date().getTime()}.jpg`,
        chunkedMode: false,
        mimeType: "image/jpg",
        params: {
          'caption': caption,
          'name': name,
          'email': email
        },
        headers: {
          Authorization: 'Bearer ' + token
        }
      }

      fileTransfer.upload(file.toString(), encodeURI(url), options)
        .then(data => {
          console.log(data);
          resolve(data);
        }, err => {
          console.log(err);
          reject(err);
        });

    });

  }

  /**
   * Get field & group field control
   */
  getFieldControlled(reviewData) {

    let arrControlled = [];
    
    // List of group fields controlled by another field
    if (reviewData.field_groups.length > 0) {
      for (let i = 0; i < reviewData.field_groups.length; i++) {
        if (reviewData.field_groups[i].control_by !== 0) {
          arrControlled.push({
            id: reviewData.field_groups[i].groupid,
            control_by: reviewData.field_groups[i].control_by,
            control_value: reviewData.field_groups[i].control_value,
            type: 'field_groups',
            auto_active: reviewData.field_groups[i].control_value.length == 0 ? true : false
          });
        }
      }
    }

    // List of fields controlled by another fields
    if (reviewData.fields.length > 0) {
      for (let i = 0; i < reviewData.fields.length; i++) {
        if (reviewData.fields[i].control_by !== 0) {
          arrControlled.push({
            id: reviewData.fields[i].fieldid,
            control_by: reviewData.fields[i].control_by,
            control_value: reviewData.fields[i].control_value,
            type: 'fields',
            auto_active: reviewData.fields[i].control_value.length == 0 ? true : false
          });
        }
      }
    }

    return arrControlled;

  }

  /**
   * 
   */
  getOriginDataOfSelectField(fieldData) {
    
    let originData = [];

    for (let i = 0; i < fieldData.length; i++) {

      if (fieldData[i].options && (fieldData[i].type === 'select' || fieldData[i].type === 'radiobuttons' || fieldData[i].type === 'selectmultiple' || fieldData[i].type === 'checkboxes') && fieldData[i].options.length > 0) {

        let arrValue = [];

        for (let j = 0; j < fieldData[i].options.length; j++) {
          arrValue.push(fieldData[i].options[j].value);
        }

        originData.push({
          id: fieldData[i].fieldid,
          name: fieldData[i].name,
          value: arrValue
        })
      }

    }

    return originData;

  }

  /**
   * 
   */
  relationOfSelectField(fieldData) {
    
    let realtion = [];

    for (let i = 0; i < fieldData.length; i++) {

      if (fieldData[i].options && (fieldData[i].type === 'select' || fieldData[i].type === 'radiobuttons' || fieldData[i].type === 'selectmultiple' || fieldData[i].type === 'checkboxes') && fieldData[i].options.length > 0 && fieldData[i].control_by !== 0) {

        let arrValue = [];

        for (let j = 0; j < fieldData[i].options.length; j++) {
          arrValue.push({
            value: fieldData[i].options[j].value,
            control_by_value: fieldData[i].options[j].control_value
          });
        }

        realtion.push({
          id: fieldData[i].fieldid,
          control_by: fieldData[i].control_by,
          relation: arrValue
        });

      }

    }

    return realtion;

  }

  /**
   * Setup review form
   */
  updateReviewForm(fieldGroupData, fieldData) {
    
    let field_groups_filtered = [];
    let tagsInput = {};
    let msgInput = {};

    for (let i = 0; i < fieldGroupData.length; i++) {

      let fields_filtered = [];

      for (let j = 0; j < fieldGroupData[i].fields.length; j++) {

        for (let k = 0; k < fieldData.length; k++) {
          if (fieldData[k].name === fieldGroupData[i].fields[j] && fieldData[k].permissions.write === true && fieldData[k].type !== 'formbuilder') {
            fieldData[k].show = fieldData[k].control_by !== 0 ? false : true;

            if (fieldData[k].options && fieldData[k].options.length > 0 && (fieldData[k].type === 'select' || fieldData[k].type === 'radiobuttons' || fieldData[k].type === 'selectmultiple' || fieldData[k].type === 'checkboxes')) {
              for (let l = 0; l < fieldData[k].options.length; l++) {
                fieldData[k].options[l].show = true;
              }
            }
            fields_filtered.push(fieldData[k]);

            if (fieldData[k].params && fieldData[k].params.autocomplete) {
              tagsInput[fieldData[k].name] = [];
              msgInput[fieldData[k].name] = '';
              fields_filtered.push({
                type: 'tag-input',
                parent: fieldData[k].name
              });
            }
          }
        }

      }

      if (fields_filtered.length > 0) {
        field_groups_filtered.push({
          title: fieldGroupData[i].title,
          groupid: fieldGroupData[i].groupid,
          control_by: fieldGroupData[i].control_by,
          control_value: fieldGroupData[i].control_value,
          fields: fields_filtered,
          show: fieldGroupData[i].control_by == 0 ? true : false
        });
      }

    }

    let result = {
      fieldGroupsFiltered: field_groups_filtered,
      tagsInput: tagsInput,
      msgInput: msgInput
    }

    return result;

  }

  /**
   * Check item exist in array
   */
  checkExistInArray(arr, item, key: string) {

    if (arr.length > 0) {

      for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === item) {
          return true;
        }
      }

      return false;
    
    }

    return false;

  }

  /**
   * Function add auto complete when submit field
   */
  addAutoCompleteFieldToSubmit(dataReview, arrHidden, arrParent, tagsInput, type: string) {
    if (Object.keys(tagsInput).length > 0) {
      for (let key in tagsInput) {
        let arr = [];
        if (tagsInput[key].length > 0) {
          for (let i = 0; i < tagsInput[key].length; i++) {
            arr.push(tagsInput[key][i].value);
          }
        }
        if (dataReview[type]) {
          dataReview[type][key] = arr;
        }
      }
    }

    if (arrHidden.length > 0) {
      for (let i = 0; i < arrHidden.length; i++) {
        if (dataReview.fields[arrHidden[i]]) {
          delete dataReview.fields[arrHidden[i]];
        }
      }
    }

    if (Object.keys(arrParent).length > 0) {

      for (let k in arrParent) {
        if (dataReview.fields[k]) {

          let arrValue = [];

          if (arrParent[k].length > 0) {
            arrParent[k].forEach(item => {
              if (item.status === 'enabled') {
                arrValue.push(item.value);
              }
            });
          }

          dataReview.fields[k] = arrValue;

        }
      }

    }

    return dataReview;
  }

  /**
   * Function remove option if user disable tag
   */
  removeOptionToSubmit(tagsInput, fieldGroupFiltered, reviewData) {

    let arrHidden = [];
    let arrParent = {};

    if (Object.keys(tagsInput).length > 0) {

      for (let key in tagsInput) {

        if (tagsInput[key].length > 0) {

          let statusOfParent = [];

          for (let i = 0; i < tagsInput[key].length; i++) {

            if (!tagsInput[key][i].show) {

              statusOfParent.push({
                value: tagsInput[key][i].value,
                status: 'disabled'
              });

              if (fieldGroupFiltered.length > 0) {
                for (let j = 0; j < fieldGroupFiltered.length; j++) {
                  if (fieldGroupFiltered[j].control_by === tagsInput[key][i].fieldId && (fieldGroupFiltered[j].control_value.indexOf(tagsInput[key][i].value) !== -1)) {
                    if (fieldGroupFiltered[j].fields.length > 0) {
                      for (let k = 0; k < fieldGroupFiltered[j].fields.length; k++) {
                        if (arrHidden.indexOf(fieldGroupFiltered[j].fields[k].name) == -1) {
                          arrHidden.push(fieldGroupFiltered[j].fields[k].name);
                        }
                      }
                    }
                  } else {
                    if (fieldGroupFiltered[j].fields.length > 0) {
                      for (let k = 0; k < fieldGroupFiltered[j].fields.length; k++) {
                        if (fieldGroupFiltered[j].fields[k].control_by === tagsInput[key][i].fieldId && (fieldGroupFiltered[j].fields[k].control_value.indexOf(tagsInput[key][i].value) !== -1)) {
                          if (arrHidden.indexOf(fieldGroupFiltered[j].fields[k].name) == -1) {
                            arrHidden.push(fieldGroupFiltered[j].fields[k].name);
                          }
                        }
                      }
                    }
                  }
                }
              }

            } else {
              statusOfParent.push({
                value: tagsInput[key][i].value,
                status: 'enabled'
              });
            }

          }

          let tmp = [];

          if (statusOfParent.length > 0) {
            statusOfParent.forEach(item => {
              tmp.push(item.status);
            });
          }

          if (tmp.indexOf('enabled') === -1) {
            arrHidden.push(key);
          } else {
            arrParent[key] = statusOfParent
          }

        }

      }

    }
    
    if (arrHidden.length > 0) {
      for (let i = 0; i < arrHidden.length; i++) {
        if (reviewData.fields[arrHidden[i]]) {
          delete reviewData.fields[arrHidden[i]];
        }
      }
    }

    return {
      reviewData: reviewData,
      arrHidden: arrHidden,
      arrParent: arrParent
    }

  }

  /**
   * Function get id after submit review
   */
  getIdSubmitReview(result) {
    if (Object.keys(result).length > 0) {
      for (let key in result) {
        if (key === 'id') {
          return result[key];
        }
      }
    }
  }
}
