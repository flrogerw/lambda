var aws = require('aws-sdk');
var spawn = require('child_process').spawn;
var Buffers = require('buffers');
var unmarshalItem = require('dynamodb-marshaler').unmarshalItem;
var image_count = 0;
var image_array_length = 0;
var current_bucket = 'node.image.upload';
var sns = new aws.SNS();
var s3 = new aws.S3({apiVersion : '2006-03-01',region : 'us-east-1'});
var processParams = {Subject: "Generate-PDF",TopicArn: "arn:aws:sns:us-west-2:444069510228:Generate-PDF"};

var orderId = '56bd4a3f0cfbcb6508580659';


exports.main = function(event, context) {

	
	if(event.Records[0].eventName != 'INSERT'){
		console.log('Non-Insert Event');
		context.done();
	}else{
		
		var record = ( typeof event.Records[0].dynamodb.NewImage === 'undefined')? event.Records[0].dynamodb.OldImage:event.Records[0].dynamodb.NewImage;
		var record = unmarshalItem(record);
		image_array_length = record.images.length;
		processParams.Message = JSON.stringify( {orderId: orderId, images: record.images} );
		
		for (i in record.images) {

			convertImage(record.images[i], context);
		}
	}
};

var convertImage = function(ci, context) {
	
	var buffer = new Buffers();
	var convert_args = [
			'-',
			'-crop',
			ci.plot_width + 'x' + ci.plot_height + '+' + ci.plot_x + '+'
					+ ci.plot_y ];

	switch (ci.effect) {

	case ('blackwhite'):
		convert_args.push(' -colorspace', 'Gray', '-brightness-contrast', '+5');
		break;

	case ('sepia'):
		convert_args.push('-sepia-tone', '78%', '-brightness-contrast', '+2');
		break;
	}
	
	// -fill '#0008' -draw 'rectangle 5,128,114,145' 
    // -fill white   -annotate +10+141 'Faerie Dragon' 

	convert_args.push('-resize', '500x500', '-');

	var convert = spawn("convert", convert_args);

	s3.getObject({
		Bucket : current_bucket,
		Key : orderId + '/' + ci.name
	}).createReadStream().pipe(convert.stdin);
	convert.stdout.on('data', buffer.push.bind(buffer));
	convert.stdout.on('end', function() {

		s3.upload({
			Bucket : current_bucket,
			Key : orderId + '/processed/' + ci.name,
			Body : buffer
		}, function(err, data) {
			if (err) {
				context.fail(err);
			} else {
				image_count++;
				if (image_count == image_array_length) {
					 sns.publish(processParams, context.done);
				}
			}
		});
	});
};