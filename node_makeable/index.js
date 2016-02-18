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
	
    var mailOptions = {
    		
    		from: 'Photo & Go <hello@photoandgo.com>',
    		to: 'rogerwilliams1962@hotmail.com', // event.body.BillingAddress.Email
    		bcc: 'roger@photoandgo.com' // CYA Email Address as per George 		
    }
         
   switch( event.body.Items[0].Status){

	case( 'New' ):
			
		mailOptions.subject = 'New Order on PhotoandGo.com';
		email_template = 'makeable.neworder';
		for (i in event.body.Items) {
			subTotal += event.body.Items[i].Price.Price;
		}
		break;
	
	default:
		
		var shippedItems = [];
		mailOptions.subject = 'Updated Photo & Go Order Status';
		email_template = 'makeable.shippedorder';
		
		var shippedItems = event.body.Items.filter(function( obj ) {
			  return obj.Status == 'Shipped';
			});
		
		if( shippedItems.length < 1 ){ context.succeed() }
		event.body.Items = shippedItems;
		break;
   }
  
    var dbRecord = { 
    	TableName: 'mailQueue',
    	Item: {
	    id: insertId,
	    source: 'Makeable-Webhook',
	    mailOptions:  JSON.stringify( mailOptions ),
	    template: email_template,
	    hbsContext: JSON.stringify({ order: event.body, subTotal: subTotal.toFixed(2) } )
	}};

    docClient.put(dbRecord, function(e, info) {
	  
		 if(e){
			 console.log(e);
			 context.fail(e);
		 } else{
			 console.log(info);
			 context.succeed();
		 }
	    });
}