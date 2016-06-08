/**
 * Print.io WebHook
 * 
 * 
 * 
 */

var aws = require('aws-sdk');

exports.main = function(event, context){
	
	var docClient = new aws.DynamoDB.DocumentClient({region: 'us-west-2'});
	var insertId = (new Date).getTime();
	var email_template;
	var subTotal = 0;
	var grandTotal = 0;
	var discounts = 0;
	var batchRequest = { RequestItems: {}};
	
	
	
	if( typeof event.body.Meta.location !== 'undefined'){
		context.succeed(); // Finish
		context.done(); // Make sure we finish
	}else{
		
	event.body.Meta.location = 'Mobile App';	
	
	removeNulls(event.body);
	
	   var mailOptions = {
	    		
	    		from: 'Photo & Go <hello@photoandgo.com>',
	    		to: event.body.ShippingAddress.Email,
	    		bcc: 'confirmations@photoandgo.com' // CYA Email Address as per George 		
	    }
		 
		 request = docClient.get({ TableName : 'makeableConfirmation', Key: { _id: event.body.NiceId}});
		 
		 request.on('error', function(response) {
			 console.log(response.error.message);
			 context.fail(response.error.message);
			 context.done();
		 });
		 
		 request.on('success', function(response) { 
			 
			  switch(true){
			  
			  	case(typeof response.data.Item !== 'undefined'):
				  
				  	var shippedItems = [];
					mailOptions.subject = 'Photo & Go Order Status Update';
					email_template = 'makeable.shippedorder';
					var bad_carrier = /uspm/i;
					var shippedItems = event.body.Items.filter(function( obj ) {
						  return (obj.Status == 'Shipped' && typeof obj.TrackingUrl !== 'undefined');
						});
					
					if( shippedItems.length > 0 ){
						
					event.body.Items = shippedItems; 
					console.log('Shipped Length: '+shippedItems.length);
					
					batchRequest.RequestItems['mailQueue'] = [ {PutRequest: {  Item: {
					    id: insertId,
					    source: 'Makeable-Webhook',
					    mailOptions: mailOptions,
					    template: email_template,
					    hbsContext: { order: event.body, grandTotal: grandTotal.toFixed(2), subTotal: subTotal.toFixed(2) }
					}}} ]
					
					 docClient.batchWrite(batchRequest, function(err, data) { 
						 if(err){
							 console.log('FAIL: '+err);
							 context.fail(err);
						 } else{ context.succeed() }
					 });
					}else{context.succeed()}
					
					break;
				  
			  	default:
				  	
				  	batchRequest.RequestItems['makeableConfirmation'] = [ {PutRequest: {  Item: { _id: event.body.NiceId }}} ];
					mailOptions.subject = 'Photo & Go Order Confirmation';
					mailOptions.bcc = 'confirmations@photoandgo.com,dov@photoandgo.com,warren@photoandgo.com'; // CYA Email Address as per George 		
					email_template = 'makeable.neworder';
					for (i in event.body.Items) {
						subTotal += event.body.Items[i].Price.Price;
						discounts += event.body.Items[i].DiscountAmount.Price;
					}
					
					if( typeof event.body.DiscountAmount !== 'undefined'){
						
						discounts = event.body.DiscountAmount.Price;
					}
					
					grandTotal = ( event.body.ShippingTotal.Price + subTotal) - discounts;
					discounts = ( discounts > 0  )? discounts.toFixed(2): 0;
					
					 batchRequest.RequestItems['mailQueue'] = [ {PutRequest: {  Item: {
						    id: insertId,
						    source: 'Makeable-Webhook',
						    mailOptions: mailOptions,
						    template: email_template,
						    hbsContext: { order: event.body, grandTotal: grandTotal.toFixed(2), subTotal: subTotal.toFixed(2), discount: discounts }
						}}} ]
						
						 docClient.batchWrite(batchRequest, function(err, data) { 
							 if(err){
								 console.log('FAIL: '+err);
								 context.fail(err);
							 } else{ context.succeed() }
						 });
					break;
				  }
			});
		 request.send();
	}
}

function removeNulls(obj){
	  var isArray = obj instanceof Array;
	  for (var k in obj){
	    if (obj[k]===null || obj[k]==="") isArray ? obj.splice(k,1) : delete obj[k];
	    else if (typeof obj[k]=="object") removeNulls(obj[k]);
	  }
	}