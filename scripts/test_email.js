const nodemailer = require('nodemailer');
// require('dotenv').config(); // Usaremos node --env-file=.env

async function main() {
    console.log('Iniciando prueba de envío de email...');
    console.log('Usuario SMTP:', process.env.SMTP_USER ? 'Configurado' : 'NO Configurado');
    console.log('Pass SMTP:', process.env.SMTP_PASS ? 'Configurado' : 'NO Configurado');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('ERROR: Faltan las variables de entorno SMTP_USER o SMTP_PASS en el archivo .env');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        console.log('Intentando enviar email a:', process.env.SMTP_USER);
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to self for testing
            subject: 'Prueba de Configuración de Email - Perfume Manager',
            text: 'Si estás leyendo esto, la configuración de email funciona correctamente.',
            html: '<b>Si estás leyendo esto, la configuración de email funciona correctamente.</b>'
        });

        console.log('¡Email enviado con éxito!');
        console.log('ID del mensaje:', info.messageId);
    } catch (error) {
        console.error('ERROR al enviar email:');
        console.error(error);
    }
}

main();
