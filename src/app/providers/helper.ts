import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import _ from 'lodash';

// Services
import { APIService } from './api';
import { ConfigService } from './config';

@Injectable({ providedIn: 'root' })
export class HelperService {

  message: string = '';
  isShowMessage: boolean = false;

  constructor(
    public apiService: APIService,
    public configService: ConfigService,
    public events: Events
  ) {

  }

  setMessage(message) {
    this.message = message;
    this.isShowMessage = true;
    this.events.publish('message', {
      message: this.message,
      isShowMessage: true
    });
  }

  closeMessage() {
    this.isShowMessage = false;
  }

  /**
   * Function prepare thumb for listings
   */
  prepareListingsThumbs(listings, thumbSize: string) {

    let arrLink = [];

    if (listings.length > 0) {

      for (let i = 0; i < listings.length; i++) {

        let resultPrepare = this.getListingThumb(listings[i], thumbSize);

        listings[i].thumb = resultPrepare.thumbData;
        
        if (resultPrepare.hrefData !== null) {
          arrLink.push(resultPrepare.hrefData);
        }

      }

    }

    return {
      listingsData: listings,
      hrefData: arrLink
    }

  }

  /**
   * Function prepare thumb for review
   */
  prepareReviewsThumbs(reviews, thumbSize: string) {

    let arrLink = [];

    if (reviews.length > 0) {

      for (let i = 0; i < reviews.length; i++) {

        let resultPrepare = this.getListingThumb(reviews[i].listing, thumbSize);
        
        reviews[i].listing.thumb = resultPrepare.thumbData;
        
        if (resultPrepare.hrefData !== null) {
          arrLink.push(resultPrepare.hrefData);
        }

      }

    }

    return {
      listingsData: reviews,
      hrefData: arrLink
    }

  }

  /**
   * Function prepare thumb for photo & video
   */
  prepareMediaThumbs(media, thumbSize: string) {

    let arrLink = [];

    if (media.length > 0) {

      for (let i = 0; i < media.length; i++) {

        media[i].originalImage = media[i].image;

        if (media[i].thumbnails && media[i].thumbnails[thumbSize] && media[i].thumbnails[thumbSize][0] && media[i].thumbnails[thumbSize][0]['image'] === null) {
          arrLink.push(media[i].thumbnails[thumbSize][0]['href']);
        } else {
          media[i].image = media[i].thumbnails[thumbSize][0]['image'];
        }

      }

    }

    return {
      listingsData: media,
      hrefData: arrLink
    }

  }

  /**
   * Function prepare thumb for avatar
   */
  prepareAvatar(listings, type: string) {

    let arrLink = [];

    if (listings.length > 0) {

      for (let i = 0; i < listings.length; i++) {

        if ( _.get(listings[i],[type,'avatar','href']) !== undefined ) {
          arrLink.push(listings[i][type]['avatar']['href']);
        }

      }

    }

    return arrLink;

  }

  /**
   * Convert to array
   */
  convertToArray(data) {

    if (!Array.isArray(data)) {
      let tmp = [];
      tmp.push(data);
      data = tmp;
      return data;
    }

    return data;

  }

  /**
   * Function get thumb of listing
   */
  getListingThumb(listing, thumbSize: string) {

    listing.photos = listing.photos ? this.convertToArray(listing.photos) : [];
    listing.videos = listing.videos ? this.convertToArray(listing.videos) : [];

    let images = listing.photos.concat(listing.videos);

    let imageSelected = null;
    let thumb = null;
    let href = null;

    if (images.length > 0) {

      for (let i = 0; i < images.length; i++) {
        if (images[i].main_media === 1) {
          imageSelected = images[i];
          break;
        }
      }

      if (imageSelected === null) {
        imageSelected = images[0];
      }

      if (imageSelected['thumbnails'] && imageSelected['thumbnails'][thumbSize] && imageSelected['thumbnails'][thumbSize][0] && imageSelected['thumbnails'][thumbSize][0]['image'] && imageSelected['thumbnails'][thumbSize][0]['image'] !== '' && imageSelected['thumbnails'][thumbSize][0]['image'] !== null) {
        
        thumb = imageSelected['thumbnails'][thumbSize][0]['image'];

      } else {

        thumb = imageSelected['image'];

        // Add link to queue
        href = (imageSelected['thumbnails'] && imageSelected['thumbnails'][thumbSize] && imageSelected['thumbnails'][thumbSize][0]) ? imageSelected['thumbnails'][thumbSize][0]['href'] : null;

      }

    } else if (listing.category && listing.category.image && listing.category.image !== '' && listing.category.image !== null) {

      thumb = listing.category.image;

    } else if (listing.directory && listing.directory.image && listing.directory.image !== '' && listing.directory.image !== null) {

      thumb = listing.directory.image;

    } else {

      thumb = null;

    }

    return {
      thumbData: thumb,
      hrefData: href
    }

  }

  /**
   * Function request queue used for generating thumbnails
   */
  queueRequest(arrRequest) {

    if (arrRequest.length > 0) {
      for (let i = 0; i < arrRequest.length; i++) {
        this.apiService.requestUrl(arrRequest[i]).subscribe(data => {
          // URL requested
        });
      }
    }

  }

  reformatForGrid(items, columns, startIndex = 0) {
    let grid = Array();
    let rowNum = 0; 
    let index = startIndex;

    for (let i = 0; i < items.length; i+=columns) {

      grid[rowNum] = {}; 

      for (let j = 0; j < columns; j++) {
        if (items[i+j] !== undefined) { 
          items[i+j].index = index;
          grid[rowNum][j] = items[i+j]
        } else {
          grid[rowNum][j] = null;
        }
        index++;
      }

      rowNum++;
    }

    return grid;
  }
  
  /**
   * Function get error code from response JSON
   */
  convertJson(data) {

    let dataJson = JSON.parse(data);

    for (let key in dataJson) {
      if (key == 'fields') {
        return dataJson[key];
      }
    }

    return false;

  }

  /**
   * 
   */
  convertMsgFromResponse(msg) {

    let msg_data = JSON.parse(msg);

    for (let key in msg_data) {
      if (key == 'message') {
        return msg_data[key];
      }
    }

    return false;

  }

  /**
   * 
   */
  isEmpty(obj) {
    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
      if (obj.hasOwnProperty.call(obj, key)) return false;
    }

    return true;
  }

  /**
   * Fuction get string
   */
  convertString(num, str) {
    if (num && str) {
      return parseInt(num) > 1 ? `${str}s` : `${str}`;
    }
    return str;
  }

  /**
   * Pre-processing for field groups / fields to show them in listing and review pages
   * Remove fields without read permissions and fields that were hidden directly in Origami App builder
   * @param  {[type]} groupFieldData [description]
   * @param  {[type]} fieldData      [description]
   * @return {[type]}                [description]
   */
  fieldGroupFiltered(groupFieldData, fieldData, hiddenFieldsArr) {

    let field_groups_filtered = [];

    hiddenFieldsArr = hiddenFieldsArr || [];

    groupFieldData.forEach(group => {

      let fields_filtered = [];

      group.fields.forEach(field_name => {
        fieldData.filter(field => {
        if (field.type !== 'formbuilder' && field.type !== 'code' 
              && field.name == field_name && field.permissions.read == true && field.selected.length > 0
              && hiddenFieldsArr.indexOf(field_name) === - 1) {
            fields_filtered.push(field);
          }
        });
      });

      if (fields_filtered.length > 0) {
        field_groups_filtered.push({
          title: group.title,
          show_title: group.show_title,
          fields: fields_filtered
        });
      }

    });

    return field_groups_filtered;

  }

  updateReviewForm(fieldGroupData, fieldData) {

    let field_groups_filtered = [];

    for (let i = 0; i < fieldGroupData.length; i++) {

      let fields_filtered = [];

      for (let j = 0; j < fieldGroupData[i].fields.length; j++) {

        for (let k = 0; k < fieldData.length; k++) {
          if (fieldData[k].name === fieldGroupData[i].fields[j] && fieldData[k].permissions.write === true && fieldData[k].type !== 'formbuilder') {
            if (fieldData[k].control_by !== 0) {
              fieldData[k].show = false;
            } else {
              fieldData[k].show = true;
            }

            if (fieldData[k].options && fieldData[k].options.length > 0 && (fieldData[k].type === 'select' || fieldData[k].type === 'radiobuttons' || fieldData[k].type === 'selectmultiple' || fieldData[k].type === 'checkboxes')) {
              for (let l = 0; l < fieldData[k].options.length; l++) {
                fieldData[k].options[l].show = true;
              }
            }
            fields_filtered.push(fieldData[k]);
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

    return field_groups_filtered;

  }

  statusGroupFieldService(fieldGroupFiltered, id, status) {
    if (fieldGroupFiltered.length > 0) {
      for (let i = 0; i < fieldGroupFiltered.length; i++) {
        if (fieldGroupFiltered[i].groupid === id) {
          fieldGroupFiltered[i].show = (status === 'show') ? true : false;
        }
      }
      return fieldGroupFiltered;
    }
    return false;
  }

  statusFieldService(fieldGroupFiltered, id, status) {
    if (fieldGroupFiltered.length > 0) {
      for (let i = 0; i < fieldGroupFiltered.length; i++) {
        for (let j = 0; j < fieldGroupFiltered[i].fields.length; j++) {
          if (fieldGroupFiltered[i].fields[j].fieldid === id) {
            fieldGroupFiltered[i].fields[j].show = (status === 'show') ? true : false;
          }
        }
      }
      return fieldGroupFiltered;
    }
    return false;
  }

  /**
   * Function get data of relation field select
   */
  getValueOfSelectField(event, fieldid, relationOfFields) {

    let arrValue = [];
    let id;

    // If is multiselect option
    if (Array.isArray(event)) {

      if (relationOfFields.length > 0) {

        for (let i = 0; i < relationOfFields.length; i++) {

          if (relationOfFields[i].control_by === fieldid) {

            id = relationOfFields[i].id;

            if (relationOfFields[i].relation.length > 0) {

              for (let j = 0; j < relationOfFields[i].relation.length; j++) {

                if (event.length > 0) {

                  for (let k = 0; k < event.length; k++) {

                    if (relationOfFields[i].relation[j].control_by_value.indexOf(event[k]) !== -1) {
                      arrValue.push(relationOfFields[i].relation[j].value);
                    }

                  }

                }

              }

            }

          }

        }

        return {
          fieldId: id,
          arrValue: arrValue
        }

      }

      return false;

    } else {

      if (relationOfFields.length > 0) {

        for (let i = 0; i < relationOfFields.length; i++) {

          if (relationOfFields[i].control_by === fieldid) {

            id = relationOfFields[i].id;

            if (relationOfFields[i].relation.length > 0) {

              for (let j = 0; j < relationOfFields[i].relation.length; j++) {

                if (relationOfFields[i].relation[j].control_by_value.indexOf(event) !== -1) {
                  arrValue.push(relationOfFields[i].relation[j].value);
                }

              }

            }

          }

        }

        return {
          fieldId: id,
          arrValue: arrValue
        }

      }

      return false;

    }

  }

  /**
   * 
   */
  convertListingTypeData(arrValueSelected, listingTypeData) {

    if (listingTypeData.length > 0) {

      for (let i = 0; i < listingTypeData.length; i++) {

        if (listingTypeData[i].fields.length > 0) {

          for (let j = 0; j < listingTypeData[i].fields.length; j++) {

            if (listingTypeData[i].fields[j].fieldid === arrValueSelected.fieldId) {

              if (listingTypeData[i].fields[j].options.length > 0) {

                for (let k = 0; k < listingTypeData[i].fields[j].options.length; k++) {

                  if (arrValueSelected.arrValue.indexOf(listingTypeData[i].fields[j].options[k].value) !== -1) {
                    listingTypeData[i].fields[j].options[k].show = true;
                  } else {
                    listingTypeData[i].fields[j].options[k].show = false;
                  }

                }

              }

            }

          }

        }

      }

      return listingTypeData;

    }

    return false;

  }

  /**
   * Function get array not inside another array
   */
  getDataNotInArray(srcArr, desArr) {
    let arr = [];
    if (srcArr.length > 0) {
      for (let i = 0; i < srcArr.length; i++) {
        if (desArr.length > 0) {
          let arrFlag = [];
          for (let j = 0; j < desArr.length; j++) {
            if (desArr[j].listingId === srcArr[i].listingId) {
              arrFlag.push(srcArr[i].listingId);
            }
          }
          if (arrFlag.length === 0) {
            arr.push(srcArr[i].markerId);
          }
        }
      }
    }
    return arr;
  }

  /**
   * Get items in array
   */
  getItemsInArray(arr, posStart: number, posEnd: number) {
    if (arr.length >= posEnd) {
      let result = [];
      for (let i = 0; i < arr.length; i++) {
        if (i >= posStart && i <= posEnd) {
          result.push(arr[i]);
        }
      }
      return result;
    }
    return arr;
  }

  /**
   * Function convert html link
   */
  getUrl(html) {
    if (html) {
      let data = html.split('"');
      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          if (data[i].indexOf('http') >= 0) {
            return data[i];
          }
        }
      }
    }
  }

  /**
   * Replace image on iframe
   */
  replaceImage(dataJreviews, dataOrigami, dataJreviewsField, dataOrigamiField) {

    if (dataJreviews.length > 0) {
      dataJreviews.forEach(item => {

        if (dataOrigami.length > 0) {
          dataOrigami.forEach(el => {

            if (item[dataJreviewsField] === el[dataOrigamiField]) {
              item.image = el.image; 
            }

          });
        }

      });
    }

    return dataJreviews;

  }

  /**
   * Function get error when submit reviews
   */
  getErrorSubmit(fields) {
    
    let arr = [];

    if (Object.keys(fields).length > 0) {

      for (let key in fields) {

        if (key.indexOf('.') > -1) {

          let err = key.split('.');
          arr.push({
            name: err[1],
            status: fields[key][0]
          });

        } else {
          arr.push({
            name: key,
            status: fields[key][0]
          });
        }

      }

    }

    return arr;

  }

}
