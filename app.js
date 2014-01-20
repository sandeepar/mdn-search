(function() {

    var NQ_BASE_URI = 'http://nq.com/api/v2',
        NQ_OAUTH = "%@/authenticate.php",
        NQ_MDN_SEARCH = '%@/search.php?mdn=%@',
        NQ_MDN_AUTO_COMPLETE = '%@/mdn-auto-complete.php?mdn=%@';

  return {
      requests: {
          authenticateAgent: function(email) {
              return this._getRequest(helpers.fmt(NQ_OAUTH, NQ_BASE_URI));
          },
          searchPage: function(mdn) {
              // An event will trigger when this request happens (L#40)
              return {
                  url: 'http://nq-subscribe.new.cosdevx.com/search.php?mdn='+mdn,
                  type: 'GET',
                  dataType: 'json',
                  proxy_v2: true
              };
          },
          autoSearchPage: function(mdn) {
              // An event will trigger when this request happens (L#40)
              return {
                  url: 'http://nq-subscribe.new.cosdevx.com/search.php?key=auto&mdn='+mdn,
                  type: 'GET',
                  dataType: 'json',
                  proxy_v2: true
              };
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
    	  this.$('#abc').css('display','none');
    	  var MDNLength = key.length;
    	  var minKey = '4';
    	  if (MDNLength >= minKey) {
    		  data = [{"a":"abc","a":"sds"}];
    		  //data = '<li>dsd</li><li>ssds</li>';
    		  console.log(MDNLength);
    		  //this.ajax('autoSearchPage', key)
    	 	  //	.done(function(data) {
    	 	  	//	if ('' != data) {
    	 	  			this.$('#abc').css('display','block');
    	 	  			var d = JSON.parse(data);
    	 	  			//console.log(d.length);
    	 	  			this.$('#abc').html(data);
    	 	  	//	}
    	 	  //});
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
      appLoader: function() {
          var loggedInUser = this.currentUser().email();
          if (this.authenticate(loggedInUser)) {
              this.switchTo("search-form");
          } else {
              services.notify(this.I18n.t('oauth.fail'), 'error');
          }
      },

      authenticate : function(agentEmailId) {

          if ('' !== this.store('oauth_user')) {
              var result
                  = (this.store('oauth_user') == agentEmailId)? true : false;
              return result;
          } else {
              this.ajax('authenticateAgent', this.currentUser().email())
                  .done(function(data) {
                      if (data.success) {
                          this.store(
                              {'oauth_user': this.currentUser().email()}
                          );
                      }
                  }).fail(function(data) {
                      services.notify(data.statusText, 'error');
                  });
          }
      },

      _getRequest: function(resource) {
          return {
              dataType: 'json',
              url: resource,
              type: 'GET',
              headers: {
                  'Authorization': 'Basic ' + Base64.encode(helpers.fmt('%@:%@', this.store('username'), this.settings.api_key))
              }
          }
      },

      _postRequest: function(data, resource) {
          return{
              dataType: 'json',
              data: data,
              processData: false,
              type: 'POST',
              url: resource,
              headers: {
                  'Authorization': 'Basic ' + Base64.encode(helpers.fmt('%@:%@', this.store('oauth_user'), this.settings.api_key))
              }
          }
      }
  };
}());
