(function() {

    var NQ_BASE_URI = 'http://nq-subscribe.new.cosdevx.com',
        NQ_OAUTH = "%@/authenticate.php",
        NQ_MDN_SEARCH = '%@/search.php?mdn=%@',
        NQ_MDN_AUTO_COMPLETE = '%@/search.php?key=auto-search&mdn=%@',
    	NQ_MDN_ALL_LIST = '%@/search.php?key=mdnList';

  return {
      requests: {
          authenticateAgent: function(email) {
              return this._getRequest(helpers.fmt(NQ_OAUTH, NQ_BASE_URI));
          },
          searchPage: function(mdn) {
              // An event will trigger when this request happens (L#40)
        	  return this._getRequest(helpers.fmt(NQ_MDN_SEARCH, NQ_BASE_URI, mdn));
              /*return {
                  url: 'http://nq-subscribe.new.cosdevx.com/search.php?mdn='+mdn,
                  type: 'GET',
                  dataType: 'json',
                  proxy_v2: true
              };*/
          },
          autoSearchPage: function(mdn) {
              // An event will trigger when this request happens (L#40)
        	  return this._getRequest(helpers.fmt(NQ_MDN_AUTO_COMPLETE, NQ_BASE_URI, mdn));
              /*return {
                  url: 'http://nq-subscribe.new.cosdevx.com/search.php?key=auto&mdn='+mdn,
                  type: 'GET',
                  dataType: 'json',
                  proxy_v2: true
              };*/
          },
          getAllMDNList: function() {
        	  return this._getRequest(helpers.fmt(NQ_MDN_ALL_LIST, NQ_BASE_URI));
          }

      },
      events: {
          'app.activated':'appLoader',
          'click .search': function (event) {
              event.preventDefault();
              this.search(this.$('#mdn-search').val());
          },
      	  'keyup .in-search':function (event) {
      		  this.autoSearch(this.$('#mdn-search').val());	  
      	  }
      },
      autoSearch : function(key) {
    	  var MDNLength = key.length;
    	  var minKey = '2';
    	  if (MDNLength >= minKey) {
    		  if ('' == this.store('mdnList')) {
    			  this._getAutoCompleteMDNList();
    		  } 
    		  this.$("#mdn-search").autocomplete({
	  				source : this.store('mdnList')
	  		  	});
    		/*  this.ajax('autoSearchPage', key)
    	 	  	.done(function(data) {
    	 	  		if ('' != data) {
    	 	  			this.$("#mdn-search").autocomplete({
    	 	  				source : data
    	 	  			});
    	 	  		}
    	 	  });*/
    	  }
      },
      search: function(searchData) {
          if ('' !== searchData) {
        	  this.ajax('searchPage', searchData)
                  	.done(function(data) {
                  		this.switchTo("search-detail",
                                 {searchResult: data}
                             );
                  }).fail(function(data) {
                      services.notify(data.statusText, 'error');
                  });
        	  
        	  Handlebars.registerHelper('status', function() {
        		    if (this.subscribe_status == '1') {
        		        return new Handlebars.SafeString(
        		        		'<span class="active">Active</span>'
        		        );
        		    } else if (this.subscribe_status == '2') {
        		        return new Handlebars.SafeString(
        		        		'<span class="updated">Updated</span>'
        		        );
        		    } else if (this.subscribe_status == '3') {
        		        return new Handlebars.SafeString(
        		        		'<span class="cancelled">Cancelled</span>'
        		        );
        		    } else {
        		    	return new Handlebars.SafeString(
        		        		'<span class="inactive">Not Activated</span>'
        		        );
        		    }
        		});        	  
 
          } else {
              services.notify(this.I18n.t('search.empty'), 'error');
          }
      },
      appLoader: function(data) {
          var firstLoad = data && data.firstLoad;
          if (!firstLoad) { return; }

          if ('' !== this.settings.api_key) {
              this._onFirstLoad();
          } else {
              services.notify(this.I18n.t('oauth.fail'), 'error');
          }
          /*var loggedInUser = this.currentUser().email();
          this.store('oauth_user',loggedInUser);
          if (this.authenticate(loggedInUser)) {
              this.switchTo("search-form");
          } else {
              services.notify(this.I18n.t('oauth.fail'), 'error');
          }*/
      },

      authenticate : function(apiKey) {
          var response
              = this.ajax('authenticateAgent', apiKey)
                  .done(function(data) {
                      if (data.success) {
                          return true;
                      }
                  }).fail(function(data) {
                      services.notify(data.statusText, 'error');
                  });
          return response;
      },

      _getRequest: function(resource) {
          return {
              dataType: 'json',
              url: resource,
              type: 'GET',
              proxy_v2 : true,
              headers: {
                  'Authorization': 'Basic ' + Base64.encode(helpers.fmt('apikey: %@', this.settings.api_key))
              }
          }
      },

      _postRequest: function(data, resource) {
          return{
              dataType: 'json',
              data: data,
              processData: false,
              type: 'POST',
              proxy_v2 : true,
              url: resource,
              headers: {
                  'Authorization': 'Basic ' + Base64.encode(helpers.fmt('apikey:%@', this.settings.api_key))
              }
          }
      },

      _onFirstLoad: function() {
          this.store('authenticated', true);
          this._getAutoCompleteMDNList(); return;
          if (this.authenticate(this.settings.api_key)) {
              this.store('authenticated', true);
              this._getAutoCompleteMDNList();
          }
      },

      _getAutoCompleteMDNList: function() {
          if (this.store('authenticated')) {
        	  this.ajax('getAllMDNList')
      	  		.done(function(data){
      	  			this.store('mdnList', data);
      	  		});
          }
      }
  };
}());
