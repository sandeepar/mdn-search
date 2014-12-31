(function() {

    var NQ_BASE_URI = 'http://sabo-subscribe.new.cosdevx.com/',
            NQ_OAUTH = '%@/api/auth',
            NQ_MDN_SEARCH = '%@/api/mdn/%@?vendor_id=%@',
            NQ_MDN_AUTO_COMPLETE = '%@/search.php?key=auto-search&mdn=%@',
            NQ_MDN_ALL_LIST = '%@/api/mdn',
            NQ_MDN_RESEND = '%@/api/subscription/%@?notify=true&shortened_code=%@',
            NQ_MDN_NEW_REQUEST = '%@/api/subscription/%@?activate=true&shortened_code=%@',
            NQ_MDN_CHANGE_REQUEST = '%@/api/retail/%@',
            NQ_SERIAL_CHANGE_REQUEST = '%@/api/retail/%@',
            MIN_SEARCH = '2';

    return {
        resources: {            
            MDN_PATTERN: /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/
        },
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
            resendActivation: function(deviceDetailId, shortenedCode) {
                return this._getRequest(helpers.fmt(NQ_MDN_RESEND, NQ_BASE_URI, deviceDetailId, shortenedCode));
            },
            requestActivation: function(deviceDetailId, shortenedCode) {
                return this._getRequest(helpers.fmt(NQ_MDN_NEW_REQUEST, NQ_BASE_URI, deviceDetailId, shortenedCode));
            },
            requestMdnChange: function(params, id) {
                return this._postRequest(
                    params, 
                    helpers.fmt(NQ_MDN_CHANGE_REQUEST, NQ_BASE_URI, id)
                );
            },
            requestMobileSerialChange: function(params, id) {
                return this._postRequest(
                    params, 
                    helpers.fmt(NQ_SERIAL_CHANGE_REQUEST, NQ_BASE_URI, id)
                );
            }
        },
        events: {
            'app.activated': 'appLoader',
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
                        return subscription.device_activation_id === id;
                    }
                );
                this.store('current-subscription', subscription);
                this._callSubscriptionView(subscription);
            },
            'click .change_mdn' : function(event) {
                event.preventDefault();
                var newMdn = this.$("#mdn-change").val();                
                if (this.resources.MDN_PATTERN.test(newMdn)) {
                    var subscription = this.store('current-subscription');                
                    var params = {
                        new_mdn:this.$("#mdn-change").val(),
                        mdn: subscription.mdn
                    };            
                    this.changeMobileDeviceNumber(params, subscription.id);
                } else {
                    services.notify(this.I18n.t('mdn-required'), 'error');
                }
            },
            'click .change_serial' : function(event) {
                event.preventDefault();
                if ('' !== this.$("#serial-change").val()) {
                    var subscription = this.store('current-subscription');                
                    var params = {
                        new_serial_number:this.$("#serial-change").val(),
                        mdn: subscription.mdn,
                        device_activation_id: subscription.device_activation_id
                    };
                    this.changeMobileSerialNumber(params, subscription.id);
                } else {
                    services.notify(this.I18n.t('serial-required'), 'error');
                }
            },
            'click .offer-group': function(event) {
                event.preventDefault();
                var offerGroup = event.currentTarget.attributes[1].value;                                
                this.store('selected-offer-group', offerGroup);
                var offerActivations = _.find(this.store('subscriptions'), 
                    function(subscription, key) {
                        return key === offerGroup;
                    }
                );
                this._callActivationCodeView(offerActivations);
            },
            'click .activation-code': function(event) {
                event.preventDefault();
                var activationCode = event.currentTarget.attributes[1].value;                
                var subscription = _.find(this.store('offer-activations'), 
                    function(activation, key) {
                        return activation.activation_code === activationCode;
                    }
                );                                
                this._callSubscriptionView(subscription);
            }
        },
        
        resend: function(key) {
            this.switchTo("loader");                   
            var subscription = this.store('current-subscription');
            
            this.ajax('resendActivation', subscription.id, subscription.shortened_code)
                .done(function(data) {
                    if (200 === data.code) {
                        services.notify(data.message);
                        var activationCodes = this._getActivationCodes(this.store('offer-activations'));                                                
                        this.switchTo("offer-groups", activationCodes);
                    } else if (200 !== data.code) {
                        services.notify(data.message, 'error');                        
                    }
                }).fail(function(data) {
                    services.notify(data.statusText, 'error');                    
                });
        },
        request: function(key) {
            this.switchTo("loader");
            var subscription = this.store('current-subscription');
            this.ajax('requestActivation', subscription.id, subscription.shortened_code)
                .done(function(data) {
                    if (200 === data.code) {
                        services.notify(data.message);
                        this.store('subscriptions', data.subscription);
                        this._callOfferGroupView(data.subscription);
                    } else if (200 !== data.code) {
                        services.notify(data.message, 'error');
                        this._callSubscriptionView(subscription);
                    }
                }).fail(function(data) {
                    services.notify(data.statusText, 'error');
                    this._callSubscriptionView(subscription);
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
                                this.store('subscriptions', data);
                                this._callOfferGroupView(data);
                            } else {                                                                
                                this.switchTo("search-detail", {searchResult: data});
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
        changeMobileDeviceNumber: function (params, id) {
            this.switchTo("loader");
            var postData = JSON.stringify(params);            
            this.ajax('requestMdnChange', postData, id)
                    .done(function(data) {
                        if (200 === data.code) {                            
                            services.notify(data.message);
                            this._callSubscriptionView(data.subscription[0]);
                        }
                    }).fail(function(data) {
                services.notify(data.statusText, 'error');
            });
        },
        changeMobileSerialNumber : function (params, id) {
            this.switchTo("loader");
            var postData = JSON.stringify(params);
            this.ajax('requestMobileSerialChange', postData, id)
                    .done(function(data) {
                        if (200 === data.code) {                            
                            services.notify(data.message);
                            this._callSubscriptionView(data.subscription[0]);
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
            subscription.isRetail = (null === subscription.channel_type) ?
                    0 : ("Insurance" === subscription.channel_type) ? 0 : 1;
            if ('EXPIRED' !== subscription.status || 'CANCELLED' !== subscription.status) {
                subscription.resendActivation = 1;
            } else {
                subscription.resendActivation = 0;
            }
            this.switchTo("search-detail", {searchResult: [subscription]});
        },
        _getMobileDeviceOffers: function(data) {
            var offers = [];            
            _.each(data, function(v, offerGroupName) {                 
                offers.push(offerGroupName);
            });
            
            return {offers : offers};
        },
        _getActivationCodes: function(subscriptions) {
            var activationCodes = [];
            var subscription = {};            
            var resendActivationFlag;
            _.each(subscriptions, function(activations, key) {
                subscription.id = activations.id;
                subscription.shortened_code = activations.shortened_code;
                subscription.device_ctivation_id = activations.device_activation_id;
                activationCodes.push(activations.activation_code);
                if ('EXPIRED' === activations.status || 'CANCELLED' === activations.status) {                    
                    resendActivationFlag = 0;
                } else {
                    resendActivationFlag = 1;
                }                
            });
            this.store('current-subscription', subscription);
            return {activationCodes : activationCodes, resendActivation : resendActivationFlag};
        },
        _callActivationCodeView: function (offerActivations) {
            this.store('offer-activations', offerActivations);
            var activationCodes = this._getActivationCodes(offerActivations);                                                
            this.switchTo("offer-groups", activationCodes);
        },
        _callOfferGroupView : function (data) {
            var offers;
            offers = this._getMobileDeviceOffers(data);
            this.store('offer-list', offers);
            this.switchTo("offer-groups", offers);
        }
    };
}());
