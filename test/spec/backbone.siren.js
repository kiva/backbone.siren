buster.spec.expose();

var settingsSiren = {"class":["order"],"properties":{"orderNumber":42,"itemCount":3,"status":"pending"},"entities":[{"class":["items","collection"],"rel":["http://x.io/rels/order-items"],"href":"http://api.x.io/orders/42/items"},{"class":["info","customer"],"rel":["http://x.io/rels/customer"],"properties":{"customerId":"pj123","name":"Peter Joseph"},"links":[{"rel":["self"],"href":"http://api.x.io/customers/pj123"}]}],"actions":[{"name":"add-item","title":"Add Item","method":"POST","href":"http://api.x.io/orders/42/items","type":"application/x-www-form-urlencoded","fields":[{"name":"orderNumber","type":"hidden","value":"42"},{"name":"productCode","type":"text"},{"name":"quantity","type":"number"}]}],"links":[{"rel":["self"],"href":"http://api.x.io/orders/42"},{"rel":["previous"],"href":"http://api.x.io/orders/41"},{"rel":["next"],"href":"http://api.x.io/orders/43"}]};

var loansCollectionSiren = {"properties":{"offset":4},"entities":[{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39032,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39032/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39032/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39922,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39922/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39922/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":521056,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/521056/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/521056/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/lenders/6282/loans?page=4"},{"rel":["previous"],"href":"api.kiva.org/lenders/6282/loans?page=3"},{"rel":["next"],"href":"api.kiva.org/lenders/6282/loans?page=5"}]};

describe('Siren Models: ', function () {
    var sirenModel;

    beforeEach(function () {
        sirenModel = new Backbone.Siren.Model(settingsSiren);
    });

    it('provides access to a model\'s url via .url()', function () {
        expect(sirenModel.url()).toEqual('http://api.x.io/orders/42');
    });


    it('provides access to a model\'s class via .classes()', function () {
        expect(sirenModel.classes()).toEqual(['order']);
    });


    it('determine\'s if a model has a given "class"', function () {
        expect(sirenModel.hasClass('wtf')).toBe(false);
        expect(sirenModel.hasClass('order')).toBe(true);
    });


    it('provides access to a model\'s rel via .rel()', function () {
        expect(sirenModel.rel()).not.toBeDefined();
    });


    it('provides access to a model\'s title via .title()', function () {
        expect(sirenModel.title()).not.toBeDefined();
    });


    it('provides access to a model\'s actions via .actions()', function () {
        var actions = sirenModel.actions();

        expect($.isArray(actions)).toBe(true);
        expect(actions[0].name).toBe('add-item');
    });


    it('sets siren "properties" to the standard Backbone Model\'s "attributes" hash', function () {
        var expectedProperties = {
            orderNumber: 42
            , itemCount: 3
            , status: "pending"
        };

        expect(sirenModel.attributes).toMatch(expectedProperties);
    });


    it('get\'s all "properties" for a given "action" via .getAllByAction()', function () {
        var expectedProperties = {
            orderNumber: 42
        };

        expect(sirenModel.getAllByAction('add-item')).toMatch(expectedProperties);
    });


    it('parses all "actions" for a given entity via .parseActions()', function () {
        var actions = sirenModel.parseActions();

        expect(actions[0].name).toBe('add-item');
    });
});

describe('Siren Collections', function () {
    it('provides access to a collection\'s url', function () {
        var sirenCollection = new Backbone.Siren.Collection(loansCollectionSiren);

        expect(sirenCollection.url()).toEqual('api.kiva.org/lenders/6282/loans?page=4');
    });
});