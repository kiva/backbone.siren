buster.spec.expose();

var settingsSiren = {"properties":{"lastName":"castillo","firstName":"gabriel","id":363934,"email":"gcastillo@gmx.com","member_since":"2008-11-22T05:11:09Z","password":"@TODO Not sure how to do this yet"},"entities":[{"rel":["api.kiva.org/rels/stats"],"href":"api.kiva.org/lenders/gabrielcastillo/stats"},{"rel":["api.kiva.org/rels/address"],"properties":{"street":"1427 E 36th","city":"Oakland","state":"CA","zip":"94602","country":"USA"},"links":[{"self":"api.kiva.org/lenders/gabrielcastillo/address"}]},{"rel":["api.kiva.org/rels/profile"],"properties":{"name":"gcastillo","city":"Oakland","state/":"CA","country":"USA","occupation":"Web Developer","website":"seemunkygo.com","iLoanBecause":"me likey","describeWork":"its fun","lenderPageUrl":"//kiva.org/lender/gabrielcastillo"},"links":[{"self":"api.kiva.org/lenders/gabrielcastillo/profile"}]},{"rel":["api.kiva.org/rels/facebook"],"properties":{"automaticallPostToWall":["loans","repayments"],"facebookConnected":true,"facebookEmail":"uglymunky@gmail.com"},"links":[{"self":"api.kiva.org/lenders/gabrielcastillo/facebook-settings"}]},{"rel":["api.kiva.org/rels/credit-settings"],"properties":{"repayment":"deposit","inactivity":"donate","autolender":"never","monthlyDeposit":0,"monthlyDonation":0},"links":[{"self":"api.kiva.org/lenders/gabrielcastillo/credit-settings"}]},{"rel":["api.kiva.org/rels/autolending-settings"],"properties":{"when":"never","criteria":[],"limit":45,"donation":10},"links":[{"self":"api.kiva.org/lenders/gabrielcastillo/autolending-settings"}]}],"actions":[],"links":[{"self":"api.kiva.org/lenders/gabrielcastillo"}]};

describe('Siren Model', function () {
    it('provides access to an entities url', function () {
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