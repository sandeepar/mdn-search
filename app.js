(function() {
	
  return {
      requests: {
          authenticateAgent: function() {
              // An event will trigger when this request happens (L#40)
              return {
                  url: 'http://nq.com/api/v2/auth/agent.php',
                  type: 'POST',
                  data: {
                      "ticket_id": []
                  }
              };
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
    	  console.log(this);
    	  //document.getElementById('abc').style.display='none';
    	  
		  //this.installation.dataStore.closet.clear();
          console.log(this.currentUser());
      }
  };
}());
