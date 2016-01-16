var express = require('express');
var router = express.Router();
var stripe = require("stripe")("sk_test_Ml6gBO5QnQCyunoNEU9uvwT2");

/* GET home page. */
router.get('/', function(req, res, next) {
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

//Endpoint to show total revenue in the past week
router.get('/total_revenue', function(req, res, next) {
  var charges = getAllCharges();
  
  charges.then(function (value) {
    charges = value.data;
    var total_revenue = 0;

    var chargesLastWeek = getChargesLastWeek(charges);
    
    for (var key in chargesLastWeek) {
      if (chargesLastWeek.hasOwnProperty(key)) {
        total_revenue = total_revenue + chargesLastWeek[key].amount;
      }
    }

    res.send({ "total_revenue": total_revenue });
  });
});

//Endpoint to show total revenue in the past week
router.get('/total_declined', function(req, res, next) {
  var charges = getAllCharges();

  charges.then(function (value) {
    charges = value.data;
    var total_declined = 0;

    var chargesLastMonth = getChargesLastMonth(charges);

    for( var key in chargesLastMonth ) {
      if(chargesLastMonth[key].status != 'succeeded'){
        total_declined = total_declined + 1;
      }
    }

    res.send({ "total_declined": total_declined });
  });
});

// retrieve all charges via Stripe API
function getAllCharges() {
  var charges = stripe.charges.list(function(err, charges) {
    // asynchronously called
  });

  return charges;
}

// filter to return only the charges in the last week
function getChargesLastWeek(charges) {
  var chargesLastWeek = {};

  for (var key in charges) {
    if (charges.hasOwnProperty(key)) {
      var dateCreated = new Date(0);
      dateCreated.setUTCSeconds(charges[0].created);

      var dateLastWeek = new Date();
      dateLastWeek.setDate(dateLastWeek.getDate() - 7);

      if(dateCreated > dateLastWeek) {
        chargesLastWeek[key] = charges[key];
      }        
    }      
  }
  return chargesLastWeek;
}

// filter to return only the charges in the last month
function getChargesLastMonth(charges) {
  var chargesLastMonth = {};
    
  for( var key in charges ) {
    var dateCreated = new Date(0);
    var dateLastMonth = new Date();
    dateLastMonth.setMonth(dateLastMonth.getMonth() - 1);

    dateCreated.setUTCSeconds(charges[key].created);

    if(dateCreated.getMonth() == dateLastMonth.getMonth()){
      chargesLastMonth[key] = charges[key];
    }
  }
  return chargesLastMonth;
}

module.exports = router;
