(function() {
	/*
	NOTE: 
	- fetched property: it allows to check if the model has been already fetched
	- stopFetching method: it allows to abort a fetch in progress
	*/
	Backbone.MuseModel= Backbone.Model.extend({
		constructor: function() {
			Backbone.Model.prototype.constructor.apply(this, arguments);

			this._xhr= null;
			this.fetched= false;
		},

		stopFetching: function() {
    		if(this._xhr && (this.fetched == false))
        			this._xhr.abort();
		},

		fetch: function(opts) {
			var self= this;
			var succFnc= (opts)? opts.success : null;
			var args;

			this.fetched= false;

			args= _.extend({}, opts, {
					success: function() {
						self.fetched= true;
						if(_.isFunction(succFnc))
							succFnc();
					}
				});

			this._xhr= Backbone.Model.prototype.fetch.apply(this, [args]);

			return this._xhr;
		}
	});

	/*
	NOTE: 
	- fetched property: it allows to check if the collection has been already fetched
	- stopFetching method: it allows to abort a fetch request in progress
	*/
	Backbone.MuseCollection= Backbone.Collection.extend({
		constructor: function() {
			Backbone.Collection.prototype.constructor.apply(this, arguments);

			this._xhr= null;
			this.fetched= false;
		},

		stopFetching: function() {
        	if(this._xhr && (this.fetched == false))
            	this._xhr.abort();
		},

		fetch: function(opts) {
			var self= this;
			var succFnc= (opts)? opts.success : null;
			var args;

			this.fetched= false;

			args= _.extend({}, opts, {
					success: function() {
						self.fetched= true;
						if(_.isFunction(succFnc))
							succFnc();
					}
				});

			this._xhr= Backbone.Collection.prototype.fetch.apply(this, [args]);

			return this._xhr;
		}		
	});

	/*
	NOTE: 
	- NEW FEATURES: hierachical subviews, detach and attach of views, multiple collections and models per view, models and collections fetching management (it aborts all the fetching in progress if removed or detached)

	- _childrenViews: object that gathers all the View's subviews. Add here all the subViews that belong directly to this view
	- models: additional models associated to the view. Add here all the models that are not the main one related to the view (this.model)
	- collections: additional collections associated to the view. Add here all the collections that are not the main ones related to the view (this.collection)
	- getChildrenViews: it returns the object that contains all the children subviews.
	- detach(stopFetching, noRecursive): it stops any DOM event or Backbone.Event listening on the view. If stopFetching==true any fetching in progress will be aborted. If norecursive==true the subviews won't be detached but they can still be detached manually (getChildrenViews -> detach)
	- _start: callback triggered after the attacching phase. This is called:
		1. after executing the initialization function for a new MuseView
		2. after calling "attach". This function should be overriden in order to execute the code needed for starting the view each time it is attached. Useful for inserting the needed "listento" to run the view properly
	- _stop: callback triggered after detaching the view (detach() or remove() called). if some ".on" is set in the middle of the code and it is not included properly in the events, this callback can be useful to "off" it.
	- remove(stopFetching): it removes both the main view and all its subviews. By doing it, it stops every fetching in progress both on in main view and in all its subviews by calling detach(true)
	*/
	Backbone.MuseView= Backbone.View.extend({
		constructor: function() {
			/*
				hierarchical subviews
			*/
			this._childrenViews= {};
			this.models= {};
			this.collections= {};

			if(arguments[0])
				this.parentView= arguments[0].parentView;

			Backbone.View.prototype.constructor.apply(this, arguments);

			this.attach();
		},

		getChildrenViews: function() {
			return this._childrenViews;
		},

		stopFetching: function() {
			var model;

        	if(this.model && (this.model instanceof Backbone.MuseModel))
        		this.model.stopFetching();

        	if(this.collection && (this.collection instanceof Backbone.MuseCollection))
        		this.collection.stopFetching();

        	for(model in this.models) {
        		try{
        			this.models[model].stopFetching();
        		}catch(e){}
        	}

        	for(collection in this.collections) {
        		this.collections[collection].stopFetching();
        	}
		},

		detach: function(stopFetching, noRecursive) {
			if(typeof noRecursive === "undefined")
				noRecursive= false;

			this.stopListening();
			this.undelegateEvents();
			this._stopLstnMyEvts();
			this._stop();

			if(stopFetching)
				this.stopFetching();

			if(! noRecursive)
				_.each(this._childrenViews, function(el, index, list) {
						el.detach(stopFetching);
					});
		},

		_start: function() { },		


		_stop: function() { },

		attach: function(el) {
			this.delegateEvents();
			this._startListening();
			this._start();

			if(typeof el === "object")
				this.setElement($(el));
		},

		remove: function(stopFetching) {
			this.detach(stopFetching, true);

			_.each(this._childrenViews, function(el, index, list) {
					el.remove(stopFetching);
				});
     	
        	return Backbone.View.prototype.remove.apply(this);
	    }		
	});
})();
