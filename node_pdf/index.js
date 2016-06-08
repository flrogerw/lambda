var aws = require('aws-sdk');
var PDFDocument = require('pdfkit');
var s3 = new aws.S3({apiVersion : '2006-03-01',region : 'us-east-1'});
var current_bucket = 'node.image.upload';
var orderId = '56bd4a3f0cfbcb6508580659';

doc = new PDFDocument;
doc.registerFont('Marydale', './fonts/marydale.ttf');


/*

doc_options =
        size: 'legal'
        layout: 'landscape'
        info:
            Title: 'hello world'
            Author: 'me'

doc = new PDFDocument doc_options

doc.addPage
size: [612.00 , 1008.00]

*/

exports.main = function(event, context) {
    
    var order = JSON.parse(event.Records[0].Sns.Message);
    
   for( var i in order.images){
	   
	   createPDF(order.images[i], order.orderId);
	   
   }

   
   setTimeout(function(){
	   doc.end();
	   
	   var params = { Key : orderId+'/processed/final.pdf', Body : doc, Bucket : current_bucket, ContentType : 'application/pdf' }

	   s3.upload(params, function(err, response) {
	console.log( 'UPLOAD: '+err, response );
	 context.done();
	   });
	    	
	   
   }, 10000);
   
  
   
}

function createPDF(image, orderId){

var border = 20;
var pdf_image_width = 400;
var plot_width = ( image.format == 2 )? pdf_image_width: pdf_image_width * 1.2027;
var plot_height = ( image.format == 2 )?  pdf_image_width * 1.2027: pdf_image_width;
var scale = plot_height / image.plot_height;
var s3ImageParams = {Bucket: current_bucket, Key: orderId+'/processed/'+image.name};

var getImageBuffer = s3.getObject(s3ImageParams);
	
getImageBuffer.on('error', function(response){
	
	console.log('Error: '+ response.message);
});

getImageBuffer.on('success', function(response){
	
	doc.image(response.data.Body, border, border, {width: plot_width, height: plot_height});

	if( image.text != ''){

		var ribbon_height = (image.text_ribbon_height * image.image_scale) * scale;
		var ribbon_top = ( image.text_ribbon_y == 0 && image.text_ribbon_x == 0)? border + (plot_height - ribbon_height): border + ((image.plot_height - image.plot_ribbon_y) * scale);
		var ribbon_left = border + (image.plot_ribbon_x * scale);
		var font_size = (image.text_font_size * image.image_scale) * scale;
		var text_x = 0
		var text_y = ribbon_top + ((ribbon_height - font_size) / 6);
		

		if( image.text_ribbon_bg == "rgba(0,0,0,0.4)" ){
			
			doc.rect(ribbon_left, ribbon_top, plot_width, ribbon_height)
			.fillColor("black", 0.4)
			.fill();
		
			doc.font('Marydale') ///image.plot_ribbon_width
			   .fontSize(font_size)
			   .fillColor(image.text_font_color)
			   //.text(image.text, ((plot_width - doc.widthOfString(image.text))/2)+ border , text_y);
			   .text(image.text, ((plot_width - (image.plot_ribbon_width *scale))/2 + border) , text_y);
			
			}else{
				  
				
				doc.font('Marydale')
				   .fontSize(font_size)
				   .fillColor(image.text_font_color)
				   .text(image.text, ribbon_left, ribbon_top)
				}
			}
	   
	doc.addPage();
	
});		
getImageBuffer.send();
}
