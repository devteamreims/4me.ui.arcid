import _ from 'lodash';


export const START = 'arcid/profile/START';
export const COMPLETE = 'arcid/profile/COMPLETE';
export const FAIL = 'arcid/profile/FAIL';

import axios from 'axios';
import api from '../api';

import {
  optimisticAdd,
} from './history';

import {
  clearResults
} from './query';

import {
  clear as clearAutocomplete,
} from './autocomplete';

import {
  isFlightInHistory,
} from '../selectors/history';

import {
  hasMultipleResults,
} from '../selectors/query';


export function getProfile(flight, forceRefresh = false) {
  return (dispatch, getState) => {
    const ifplId = _.get(flight, 'ifplId');
    if(!ifplId) {
      return;
    }

    dispatch(start(ifplId));

    // Clear queries, unless we have multiple results
    if(!hasMultipleResults(getState())) {
      dispatch(clearResults());
    }

    dispatch(clearAutocomplete());


    const apiUrl = api.rootPath + api.arcid.searchProfile;
    const reqParams = {ifplId};

    if(forceRefresh) {
      Object.assign(reqParams, {forceRefresh: true});
    }

    // If our flight is not in history, optimisticly add it
    const addToHistory = !isFlightInHistory(ifplId)(getState());
    console.log('Should we push to history ?');
    console.log(`addToHistory : ${addToHistory} || forceRefresh ${forceRefresh}`);

    if(addToHistory || forceRefresh) {
      dispatch(optimisticAdd(flight));
    }

    return axios.get(apiUrl, {params: reqParams})
      .then((response) => {
        const results = response.data;

        if(_.isEmpty(results)) {
          return dispatch(errorNotFound(ifplId));
        }

        return dispatch(complete(results));

      })
      .catch((err) => {
        if(err.status = 404) {
          return dispatch(error(`${ifplId} : Flight plan not found`, err));
        }
        return dispatch(error(null, err));
      });
  }
}

export function errorNotFound(ifplId, callsign = '') {
  return (dispatch, getState) => {
    dispatch(error());
  };
}

export function error(err, rawError) {
  return {
    type: FAIL,
    error: err || 'Could not contact arcid backend',
    rawError
  };
}

export function start(ifplId) {
  return (dispatch, getState) => {
    dispatch({
      type: START,
      ifplId
    });
  };
}

export function complete(profile = {}) {
  let {
    ifplId,
    callsign,
    departure,
    destination,
    eobt,
    delay,
    pointProfile,
    airspaceProfile,
    fetched,
  } = profile;

  return (dispatch, getState) => {
    dispatch({
      type: COMPLETE,
      ifplId,
      callsign,
      departure,
      destination,
      eobt,
      delay,
      pointProfile,
      airspaceProfile,
      fetched
    });
  };
}
