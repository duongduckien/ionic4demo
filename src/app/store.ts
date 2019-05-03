import * as actions_name from './actions';
import { tassign } from 'tassign';

export interface IAppState {
  environment: string;
  settings: any;
  load_config: any;
  listing_type_config: any;
  goToSubCat: boolean;
  loginStatus: boolean;
  mapInputText: any;
  mapSelectedCategory: any;
  mapShowMessage: any;
  storeDirectories: any;
  storeCategories: any;
  listingFavoriteState: any;
};

export const INITIAL_STATE: IAppState = {
  environment: '',
  settings: {},
  load_config: [],
  listing_type_config: [],
  goToSubCat: false,
  loginStatus: false,
  mapInputText: '',
  mapSelectedCategory: '',
  mapShowMessage: { status: false, message: '' },
  storeDirectories: [],
  storeCategories: [],
  listingFavoriteState: {},
};

export function rootReducer(state: IAppState, action): IAppState {

  switch (action.type) {

    case actions_name.ENVIRONMENT: {
      return tassign(state, { environment: action.payload });
    }

    case actions_name.STORE_SETTINGS: {
      return tassign(state, { settings: action.payload });
    }

    case actions_name.LOAD_CONFIG:
      return tassign(state, { load_config: action.payload });

    case actions_name.LISTING_TYPE_CONFIG:
      return tassign(state, { listing_type_config: action.payload });

    case actions_name.GO_TO_SUB_CAT:
      return tassign(state, { goToSubCat: action.payload });

    case actions_name.SET_LOGGED_IN: {
      return tassign(state, { loginStatus: true });
    }

    case actions_name.SET_LOGGED_OUT: {
      return tassign(state, { loginStatus: false });
    }

    case actions_name.MAP_INPUT_TEXT: {
      return tassign(state, { mapInputText: action.payload });
    }

    case actions_name.MAP_CATEGORY_SELECT: {
      return tassign(state, { mapSelectedCategory: action.payload });
    }

    case actions_name.MAP_SHOW_MESSAGE: {
      return tassign(state, { mapShowMessage: action.payload });
    }

    case actions_name.STORE_DIRECTORIES: {
      return tassign(state, { storeDirectories: action.payload });
    }

    case actions_name.STORE_CATEGORIES: {
      return tassign(state, { storeCategories: action.payload });
    }

    case actions_name.UPDATE_LISTING_FAVORITE_STATE: {
      return tassign(state, { listingFavoriteState: action.payload });
    }
  }

  return state;

};
