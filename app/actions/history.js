export const FETCH_COMPLETE = 'arcid/history/FETCH_COMPLETE';
export const FETCH_START = 'arcid/history/FETCH_START';
export const OPTIMISTIC_ADD = 'arcid/history/OPTIMISTIC_ADD';

import _ from 'lodash';

import axios from 'axios';
import api from '../api';

const HISTORY_SIZE_LIMIT = 10;

export function refreshHistory() {
  return (dispatch, getState) => {
    dispatch({type: FETCH_START});

    const apiUrl = api.rootPath + api.arcid.getHistory;
    const reqParams = {
      limit: HISTORY_SIZE_LIMIT,
    };

    return axios.get(apiUrl, {params: reqParams})
      .then(resp => {
        const results = resp.data;
        return dispatch(setHistory(results));
      })
      .catch(err => {
        return dispatch({
          type: FETCH_COMPLETE,
          flights: [],
          error: 'An error occured fetching arcid history',
          rawError: err
        });
      });
  };
}

import {
  getFlights,
} from '../selectors/history';

const formatFlight = (item) => _.pick(item, ['ifplId', 'callsign', 'departure', 'destination', 'eobt', 'fetched']);

export function optimisticAdd(item) {
  return (dispatch, getState) => {
    const flight = formatFlight(item);

    return dispatch({
      type: OPTIMISTIC_ADD,
      flight,
    });
  }
}

export function setHistory(rawData) {
  return (dispatch, getState) => {


    return dispatch({
      type: FETCH_COMPLETE,
      flights: _.take(_.map(rawData, formatFlight), HISTORY_SIZE_LIMIT),
    });
  };
}

