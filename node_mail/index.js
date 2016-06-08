/**
 * Template Based Mailer - Lambda Function
 * 
 * Triggered by Insert into MailQueue Table in Dynamodb.
 * Uses Handlebars for Templating Emails.
 * Templates stored in S3 Bucket 'node.hbs.templates/email.templates' using .hbs extension.
 * Converts HTML Email into Plain Text.
 * Uses Remote Mail Relay.
 * Update Database with Response
 * 
 * Required DB Trigger Item:
 * 		
 * 		source: < Source of Email >, ( i.e. Makeable-Webhook )
 * 		hbsContext: < Data for Template >, ( i.e. {orderDate: '2016-12-12'} )
 * 		template: < Name of Template >, ( i.e. makeable.neworder -- no extension )
 * 		mailOtions: {
 * 			from: < From Address >,
 * 			to: < To Address >,
 * 			subject: < Email Subject >
 * 			}
 */

var nodemailer = require('nodemailer');
var aws = require('aws-sdk');
var handlebars = require('handlebars');
var htmlToText = require('nodemailer-html-to-text').htmlToText;

exports.main = function(event, context) {
	
	var s3 = new aws.S3({
		apiVersion : '2006-03-01',
		region : 'us-east-1'
	});
	
	var smtpConfig = {
		host : '52.26.195.198',
		port : 25,
		auth : {
			user : 'mailrelay@photoandgo.com',
			pass : 'm06Ar14u'
		}
	};

	try {
		
		var record = ( typeof event.Records[0].dynamodb.NewImage === 'undefined')? event.Records[0].dynamodb.OldImage:event.Records[0].dynamodb.NewImage;	
		var mailOptions = JSON.parse(record.mailOptions.S);
		var hbs_template = record.template.S;
		var hbsContext = JSON.parse(record.hbsContext.S);

		var s3params = {
			Bucket : 'node.hbs.templates',
			Key : 'email.templates/' + hbs_template + '.hbs'
		};

		s3.getObject(s3params, function(err, data) {
			
			if (err) {
				console.log(err);
				context.fail();
			} else {

				var transporter = nodemailer.createTransport(smtpConfig);
				var template = handlebars.compile(data.Body.toString('ascii'));
				mailOptions.html = template( hbsContext );
				transporter.use('compile', htmlToText({}))
				transporter.sendMail(mailOptions, function(error, info) {
					
					if (error){
						console.log(error);
						context.fail();
					}else{
						context.succeed();
					}
					
					transporter.close();
				});
			}
		});

	} catch (error) {
		console.log(error);
		context.fail();
	} 
};