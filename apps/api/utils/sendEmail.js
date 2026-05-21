

import nodemailer from "nodemailer"



export const sendEmails = async (email, subject, text, html) => {
	try {
		const transporter = nodemailer.createTransport({
			host: process.env.HOST,
			service: process.env.SERVICE,
			secure: Boolean(process.env.SECURE),
			
			auth: {
				user: process.env.USER,
				pass: process.env.PASS,
			}
		});
		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			text: text,
			html: html 
			// html: `<div>Send html cntent here</div>` //Come back
		});
		console.log(subject + " sent to " + email);
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};





export const sendTicket = async (email, subject, text, html) => {
	try {
	
// let toJson = JSON.stringify(html)
// const qr = null
// QRCode.toDataURL(toJson, function (err, url) {
// 	if (err) throw err
// 	const qr  = url
// 	 })

		const transporter = nodemailer.createTransport({
			host: process.env.HOST,
			service: process.env.SERVICE,
			secure: Boolean(process.env.SECURE),
			
			auth: {
				user: process.env.USER,
				pass: process.env.PASS,
			}
		});
		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			text: text,
			attachDataUrls: true,
			html: html
			// html: JSON.stringify(html)
		});
		console.log(subject + " sent download to " + email);
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};

