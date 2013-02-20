buster.spec.expose();

var settingsSiren = {"properties":{"lastName":"castillo","firstName":"gabriel","id":363934,"email":"gcastillo@gmx.com","member_since":"2008-11-22T05:11:09Z","password":"@TODO Not sure how to do this yet"},"entities":[{"rel":["api.kiva.org/rels/stats"],"href":"api.kiva.org/lenders/gabrielcastillo/stats"},{"rel":["api.kiva.org/rels/address"],"properties":{"street":"1427 E 36th","city":"Oakland","state":"CA","zip":"94602","country":"USA"},"links":[{"rel":["self"],"href":"api.kiva.org/lenders/gabrielcastillo/address"}]},{"rel":["api.kiva.org/rels/profile"],"properties":{"name":"gcastillo","city":"Oakland","state/":"CA","country":"USA","occupation":"Web Developer","website":"seemunkygo.com","iLoanBecause":"me likey","describeWork":"its fun","lenderPageUrl":"//kiva.org/lender/gabrielcastillo"},"links":[{"rel":["self"],"href":"api.kiva.org/lenders/gabrielcastillo/profile"}]},{"rel":["api.kiva.org/rels/facebook"],"properties":{"automaticallPostToWall":["loans","repayments"],"facebookConnected":true,"facebookEmail":"uglymunky@gmail.com"},"links":[{"rel":["self"],"href":"api.kiva.org/lenders/gabrielcastillo/facebook-settings"}]},{"rel":["api.kiva.org/rels/credit-settings"],"properties":{"repayment":"deposit","inactivity":"donate","autolender":"never","monthlyDeposit":0,"monthlyDonation":0},"links":[{"rel":["self"],"href":"api.kiva.org/lenders/gabrielcastillo/credit-settings"}]},{"rel":["api.kiva.org/rels/autolending-settings"],"properties":{"when":"never","criteria":[],"limit":45,"donation":10},"links":[{"rel":["self"],"href":"api.kiva.org/lenders/gabrielcastillo/autolending-settings"}]}],"actions":[],"links":[{"rel":["self"],"href":"api.kiva.org/lenders/gabrielcastillo"}]};

var loansCollectionSiren = {"properties":{"offset":4},"entities":[{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39032,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39032/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39032/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39922,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39922/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39922/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":521056,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/521056/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/521056/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/lenders/6282/loans?page=4"},{"rel":["previous"],"href":"api.kiva.org/lenders/6282/loans?page=3"},{"rel":["next"],"href":"api.kiva.org/lenders/6282/loans?page=5"}]};

describe('Siren Models', function () {
    it('provides access to an model\'s url', function () {
        var sirenModel = new Backbone.Siren.Model(settingsSiren);

        expect(sirenModel.url()).toEqual('api.kiva.org/lenders/gabrielcastillo');
    });

    it('provides access to an entities properties', function () {
        var sirenModel = new Backbone.Siren.Model(settingsSiren);

        expect(sirenModel.get('lastName')).toEqual('castillo');

        sirenModel.set('lastName', 'najlis');
        expect(sirenModel.get('lastName')).toEqual('najlis');
    });
});

describe('Siren Collections', function () {
    it('provides access to a collection\'s url', function () {
        var sirenCollection = new Backbone.Siren.Collection(loansCollectionSiren);

        expect(sirenCollection.url()).toEqual('api.kiva.org/lenders/6282/loans?page=4');
    });
});