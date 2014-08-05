(function() {

    var NQ_BASE_URI = 'http://nq-subscribe.new.cosdevx.com',
            NQ_OAUTH = '%@/api/auth',
            NQ_MDN_SEARCH = '%@/api/mdn/%@?vendor_id=%@',
            NQ_MDN_AUTO_COMPLETE = '%@/search.php?key=auto-search&mdn=%@',
            NQ_MDN_ALL_LIST = '%@/api/mdn',
            NQ_MDN_RESEND = '%@/api/subscription/%@?notify=true&device_detail_id=%@',
            NQ_MDN_NEW_REQUEST = '%@/api/subscription/%@?activate=true&device_detail_id=%@',
            NQ_MDN_CHANGE_REQUEST = '%@/api/retail/%@',
            NQ_SERIAL_CHANGE_REQUEST = '%@/api/retail/%@',
            MIN_SEARCH = '2';

    return {
        requests: {
            authenticateAgent: function() {
                return this._getRequest(helpers.fmt(NQ_OAUTH, NQ_BASE_URI));
            },
            searchPage: function(mdn, vendorId) {
                return this._getRequest(helpers.fmt(NQ_MDN_SEARCH, NQ_BASE_URI, mdn, vendorId));
            },
            autoSearchPage: function(mdn) {
                return this._getRequest(helpers.fmt(NQ_MDN_AUTO_COMPLETE, NQ_BASE_URI, mdn));
            },
            getAllMDNList: function() {
                return this._getRequest(helpers.fmt(NQ_MDN_ALL_LIST, NQ_BASE_URI));
            },
            resendActivation: function(mdn, id) {
                return this._getRequest(helpers.fmt(NQ_MDN_RESEND, NQ_BASE_URI, mdn, id));
            },
            requestActivation: function(mdn, id) {
                return this._getRequest(helpers.fmt(NQ_MDN_NEW_REQUEST, NQ_BASE_URI, mdn, id));
            },
            requestMdnChange: function(currentSubscription, mdn) {
                return this._postRequest(
                    currentSubscription, 
                    helpers.fmt(NQ_MDN_CHANGE_REQUEST, NQ_BASE_URI, mdn)
                );
            },
            requestMobileSerialChange: function(currentSubscription, mdn) {
                return this._postRequest(
                    currentSubscription, 
                    helpers.fmt(NQ_SERIAL_CHANGE_REQUEST, NQ_BASE_URI, mdn)
                );
            }
        },
        events: {
            'app.created': 'appLoader',
            'click .search': function(event) {
                event.preventDefault();
                if (this.store('authenticated')) {
                    this.search(this.$('#mdn-search').val(), 0);
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
            },
            'click .vendor': function(event) {
                event.preventDefault();
                var id = event.currentTarget.attributes[1].value;
                var subscription = _.find(this.store('subscriptions'), 
                    function(subscription) {
                        return subscription.id === id;
                    }
                );
                this.store('current-subscription', subscription);
                this._callSubscriptionView(subscription);
            },
            'click .change_mdn' : function(event) {
                event.preventDefault();
                this.changeMobileDeviceNumber(
                    this.store('current-subscription'), this.$("#mdn-search").val());
            },
            'click .change_serial' : function(event) {
                event.preventDefault();
                this.changeMobileSerialNumber(
                    this.store('current-subscription'), this.$("#mdn-search").val());
            }
        },
        
        resend: function(key) {
            this.switchTo("loader");
            var subscription = this.store('current-subscription');
            this.ajax('resendActivation', key, subscription.id)
                    .done(function(data) {
                        if (200 === data.code) {
                            services.notify(data.message);
                            this._callSubscriptionView(data.subscription[0]);
                        } else if (200 !== data.code) {
                            services.notify(data.message, 'error');
                            this._callSubscriptionView(this.store(key));
                        }
                    }).fail(function(data) {
                services.notify(data.statusText, 'error');
                this._callSubscriptionView(this.store(key));
            });
        },
        request: function(key) {
            this.switchTo("loader");
            var subscriptionData = this.store(key);
            this.ajax('requestActivation', key, subscriptionData.vendor_id)
                    .done(function(data) {
                        if (200 === data.code) {
                            services.notify(data.message);
                            this._callSubscriptionView(data.subscription[0]);
                        } else if (200 !== data.code) {
                            services.notify(data.message, 'error');
                            this._callSubscriptionView(this.store(key));
                        }
                    }).fail(function(data) {
                services.notify(data.statusText, 'error');
                this._callSubscriptionView(this.store(key));
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
        search: function(searchData, vendorId) {
            if ('' !== searchData) {
                this.ajax('searchPage', searchData, vendorId)
                        .done(function(data) {                                                        
                            if (!data.hasOwnProperty('code')) {                                
                                if (data.length > 1) {
                                    this.store('subscriptions', data);
                                    
                                    var partners = [];
                                    _.each(data, function(subscription) {
                                        var partner = {};
                                        partner['id'] = subscription.id;
                                        partner['name'] = subscription.carrier;                                        
                                        partners.push(partner);
                                    });                                    
                                    this.store('partner-list', partners);
                                    this._callSubscriptionView(partners);
                                } else {                                    
                                    this.store('current-subscription', data[0]);                                    
                                    this._callSubscriptionView(data[0]);
                                }
                            } else {                                
                                this.store('current-subscription', data[0]);
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
        changeMobileDeviceNumber : function () {
            this.ajax('requestMdnChange')
                    .done(function(data) {
                        if (200 === data.code) {                            
                            this.store('current-subscription', data[0]);
                            this._callSubscriptionView(data[0]);
                        }
                    }).fail(function(data) {
                services.notify(data.statusText, 'error');
            });
        },
        changeMobileSerialNumber : function () {
            this.ajax('requestMobileSerialChange')
                    .done(function(data) {
                        if (200 === data.code) {                            
                            this.store('current-subscription', data[0]);
                            this._callSubscriptionView(data[0]);
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
            
            subscription.isRetail = (null === subscription.channel_type)? 
                0 : ('Insurance' === subscription.channel_type)? 0 : 1;     
            if ('EXPIRED' !== subscription.status || 'CANCELLED' !== subscription.status) {                                
                subscription.resendActivation = 1;
            } else {
                subscription.resendActivation = 0;
            }
            this.switchTo("search-detail", {searchResult: [subscription]});    
        }
    };
}());
