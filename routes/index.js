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

//Endpoint to return a list of customers who have a credit card soon to expire
router.get('/customer_expiry_alert', function(req, res, next) {
  var customers = getAllCustomers();

  customers.then(function (value) {
    customersToAlert = getCustomerWithBadCardExpiry(value.data)

    res.send(customersToAlert);
  });
});

//Endpoint to return the highest paying customer based on all charges
router.get('/highest_paying_customer', function(req, res, next) {

  var charges = getAllCharges();

  charges.then(function (value) {
    charges = value.data;

    charges.sort(compareAmount);

      var customerId = charges[0].source.customer;
      var customer = getCustomer(customerId);
     
      customer.then(function (value) {
        res.send(value);
      });
    
  });
});

function compareAmount(a,b) {
  if (a.amount > b.amount)
    return -1;
  else if (a.amount < b.amount)
    return 1;
  else 
    return 0;
}

// retrieve all charges via Stripe API
function getAllCharges() {
  var charges = stripe.charges.list(function(err, charges) {
    // asynchronously called
  });

  return charges;
}

// retrieve a costumer by Id via Stripe API
function getCustomer(id) {
  var customer = stripe.customers.retrieve(id, function(err, customer) {
    // asynchronously called
  });

  return customer;
}

// retrieve all costumers via Stripe API
function getAllCustomers() {
  var customers = stripe.customers.list(function(err, customers) {
    // asynchronously called
  });

  return customers;
}

// filter to return only the charges in the last week
function getChargesLastWeek(charges) {
  var chargesLastWeek = {};

  for (var key in charges) {
      var dateCreated = new Date(0);
      dateCreated.setUTCSeconds(charges[0].created);

      var dateLastWeek = new Date();
      dateLastWeek.setDate(dateLastWeek.getDate() - 7);

      if(dateCreated > dateLastWeek) {
        chargesLastWeek[key] = charges[key];
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

//Filter customer list for thoese who have credit cards expiring within the next month 
function getCustomerWithBadCardExpiry(customers){
  var customersCardExpiry = {};

  var dateCardExpiry = new Date();
  var dateCurrent = new Date();

  for( var key in customers ) {
    if(customers[key].sources.data.length > 0){
      var expiry_month = customers[key].sources.data[0].exp_month;
      var expiry_year = customers[key].sources.data[0].exp_year;

      dateCardExpiry.setMonth(expiry_month - 1);
      dateCardExpiry.setYear(expiry_year);

      //check card expiry within one month
      if (dateCardExpiry.getYear() == dateCurrent.getYear()) {
        var monthDifference = dateCardExpiry.getMonth() - dateCurrent.getMonth();

        //expired cards won't be included
        if (monthDifference <= 1 & monthDifference >= 0) {
          customersCardExpiry[key] = customers[key];
        }
      }
    }
  }

  return customersCardExpiry;

}

module.exports = router;
