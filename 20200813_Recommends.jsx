import React from "react"
import Axios from 'axios'
import axiosCancel from 'axios-cancelable';

import {ERROR_PROPS} from "../../../Constants";
import QueryString from "query-string";
import {setError} from '../../../modules/error';

const URL = '/ajax/chat/v1/recommend';

axiosCancel(Axios, {
    debug: false
});

export default (domains, keyword, {onRequest, onSuccess, onCancelable, onError, onFinally}) => {
    if (!onRequest(keyword)) {
        Axios.cancel(URL);
        return;
    }

    let recommendsRequest = {
        keyword: keyword,
        domains: domains.toArray().join(',')
    };

    Axios.post(URL, QueryString.stringify(recommendsRequest), {
        requestId: URL,
        responseType: 'json',
        timeout: 3000,
    })
        .then(response => {
            onSuccess && onSuccess(response.data);
        })
        .catch(error => {
            if (!Axios.isCancel(error)) {
                setError(error);

                if (!!Object.assign({}, error).response) {
                    const err = Object.assign({}, error).response.data;
                    onError && onError(ERROR_PROPS.get(err.code).message);
                }
            } else {
                onCancelable && onCancelable();
            }
        })
        .finally(() => {
            onFinally && onFinally();
        });
}
