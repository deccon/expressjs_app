var express = require('express');
var router = express.Router();
var stripe = require("stripe")("sk_test_Ml6gBO5QnQCyunoNEU9uvwT2");

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', 
  { 
	     title: 'Stripe - ExpressJs App'
  });

});

router.get('/balance', function(req, res, next) {
  var balance = stripe.balance.retrieve(function(err, balance) {
    // asynchronously called
  });

  balance.then(function (value) {
    var stripe_balance = value.available[0].amount;
    
    res.render('index', { 
        title: 'Stripe - ExpressJs App',
        balance: stripe_balance
    });
  });
});

module.exports = router;
