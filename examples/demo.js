var sirenApi = new Backbone.Siren('root.url', options);

sirenApi.resolve('team/123');

// How can I subscribe to changes to this model?
// Do you subscribe to changes to a model or changes to a "channel"
// Does each push notification resolve to a url endpoint?

// Are push notifications fundamentally different from http requests (e.g., is there a 1 to 1 relationship between a notification and a url endpoint)

// would this be a "batch" operation?
	// If subscribed to a "loans" channel this is easy because you can get a collection of loans
	// If listening to changes in general, for all models this would require some concept of Batch (how would we implement the long polling fallback?)