(function() {

    var NQ_BASE_URI = 'http://nq-subscribe.new.cosdevx.com',
            NQ_OAUTH = '%@/api/auth',
            NQ_MDN_SEARCH = '%@/api/mdn/%@',
            NQ_MDN_AUTO_COMPLETE = '%@/search.php?key=auto-search&mdn=%@',
            NQ_MDN_ALL_LIST = '%@/api/mdn',
            NQ_MDN_RESEND = '%@/api/subscription/%@?notify=true',
            NQ_MDN_NEW_REQUEST = '%@/api/subscription/%@?activate=true',
            MIN_SEARCH = '2';

    return {
        requests: {
            authenticateAgent: function() {
                return this._getRequest(helpers.fmt(NQ_OAUTH, NQ_BASE_URI));
            },
            searchPage: function(mdn) {
                return this._getRequest(helpers.fmt(NQ_MDN_SEARCH, NQ_BASE_URI, mdn));
            },
            autoSearchPage: function(mdn) {
                return this._getRequest(helpers.fmt(NQ_MDN_AUTO_COMPLETE, NQ_BASE_URI, mdn));
            },
            getAllMDNList: function() {
                return this._getRequest(helpers.fmt(NQ_MDN_ALL_LIST, NQ_BASE_URI));
            },
            resendActivation: function(mdn) {
                return this._getRequest(helpers.fmt(NQ_MDN_RESEND, NQ_BASE_URI, mdn));
            },
            requestActivation: function(mdn) {
                return this._getRequest(helpers.fmt(NQ_MDN_NEW_REQUEST, NQ_BASE_URI, mdn));
            }

        },
        events: {
            'app.activated': 'appLoader',
            'click .search': function(event) {
                event.preventDefault();
                if (this.store('authenticated')) {
                    this.search(this.$('#mdn-search').val());
                } else {
                    services.notify(this.I18n.t('authentication'), 'error');
                }
            },
            'keyup .in-search': function(event) {
                if (this.store('authenticated')) {
                    this.autoSearch(this.$('#mdn-search').val());
                }
            },
            'click .clear': function(event) {
                event.preventDefault();
                this.$('#mdn-search').val('');
                this.$('#mdn-search').focus();
                this.switchTo('search-form');
            },
            'click .resend': function(event) {
                event.preventDefault();
                if (this.store('authenticated')) {
                    this.resend(this.$('#mdn-search').val());
                } else {
                    services.notify(this.I18n.t('authentication'), 'error');
                }
            },
            'click .request': function(event) {
                event.preventDefault();
                this.request(this.$('#mdn-search').val());
            }
        },
        resend: function(key) {
            this.switchTo("loader");
            this.ajax('resendActivation', key)
                    .done(function(data) {
                        if (200 === data.code) {
                            services.notify(data.message);
                            this._callSubscriptionView(data.subscription[0]);
                        } else if (200 !== data.code) {
                            services.notify(data.message, 'error');
                            this._callSubscriptionView(this.store('subscriptionDetails'));
                        }
                    }).fail(function(data) {
                services.notify(data.statusText, 'error');
                this._callSubscriptionView(this.store('subscriptionDetails'));
            });
        },
        request: function(key) {
            this.switchTo("loader");
            this.ajax('requestActivation', key)
                    .done(function(data) {
                        if (200 === data.code) {
                            services.notify(data.message);
                            this._callSubscriptionView(data.subscription[0]);
                        } else if (200 !== data.code) {
                            services.notify(data.message, 'error');
                            this._callSubscriptionView(this.store('subscriptionDetails'));
                        }
                    }).fail(function(data) {
                services.notify(data.statusText, 'error');
                this._callSubscriptionView(this.store('subscriptionDetails'));
            });
        },
        autoSearch: function(key) {
            var MDNLength = key.length;
            var minKey = MIN_SEARCH;
            if (MDNLength >= minKey) {
                if ('' === this.store('mdnList')) {
                    this._getAutoCompleteMDNList();
                }
                this.$("#mdn-search").autocomplete({
                    source: this.store('mdnList')
                });
            }
        },
        search: function(searchData) {
            if ('' !== searchData) {
                this.ajax('searchPage', searchData)
                        .done(function(data) {
                            if (data.hasOwnProperty('Success')) {
                                if (!data.Success) {
                                    this.switchTo("search-detail",
                                            {searchResult: data}
                                    );
                                }
                            } else {
                                this.store('subscriptionDetails', data[0]);
                                this._callSubscriptionView(data[0]);
                            }
                        }).fail(function(data) {
                    services.notify(data.statusText, 'error');
                });
            } else {
                services.notify(this.I18n.t('search'), 'error');
            }
        },
        appLoader: function(data) {
            var firstLoad = data && data.firstLoad;
            if (!firstLoad) {
                return;
            }

            if ('' !== this.settings.api_key) {
                this._onFirstLoad();
            } else {
                services.notify(this.I18n.t('oauth'), 'error');
            }
        },
        authenticate: function() {
            this.ajax('authenticateAgent')
                    .done(function(data) {
                        if (200 === data.code) {                            
                            this.store('authenticated', true);
                            this._getAutoCompleteMDNList();
                        } else {
                            this.store('authenticated', false);
                            services.notify(data.message, 'error');
                        }
                    }).fail(function(data) {
                services.notify(data.statusText, 'error');
            });
        },
        _getRequest: function(resource) {
            return {
                dataType: 'json',
                url: resource,
                type: 'GET',
                proxy_v2: true,
                headers: {
                    'Authorization': 'Basic ' + Base64.encode(helpers.fmt('api_key:%@', this.setting('api_key'))),
                    'API-ID': Base64.encode(helpers.fmt('%@', this.setting('api_id')))
                }
            };
        },
        _postRequest: function(data, resource) {
            return{
                dataType: 'json',
                data: data,
                processData: false,
                type: 'POST',
                proxy_v2: true,
                url: resource,
                headers: {
                    'Authorization': 'Basic ' + Base64.encode(helpers.fmt('api_key:%@', this.setting('api_key'))),
                    'API-ID': Base64.encode(helpers.fmt('%@', this.setting('api_id')))
                }
            };
        },
        _onFirstLoad: function() {
            this.store('authenticated', false);
            this.authenticate();
        },
        _getAutoCompleteMDNList: function() {
            if (this.store('authenticated')) {
                this.ajax('getAllMDNList')
                        .done(function(data) {
                            this.store('mdnList', data);
                        });
            }
        },
        _callSubscriptionView: function (subscription) {
            if ('1' === subscription.subscribe_status) {                
                subscription.subscribe_status = helpers.safeString('<span class="active">Active</span>');
                subscription.sendActivation = 1;
            } else if ('2' === subscription.subscribe_status) {
                subscription.subscribe_status = helpers.safeString('<span class="updated">Updated</span>');
            } else if ('3' === subscription.subscribe_status) {
                subscription.subscribe_status = helpers.safeString('<span class="cancelled">Cancelled</span>');
            } else {
                subscription.subscribe_status = helpers.safeString('<span class="inactive">Not Activated</span>');
            }
            this.switchTo("search-detail", {searchResult: [subscription]});    
        }
    };
}());
