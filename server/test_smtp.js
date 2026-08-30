import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'liverton.aguiar.sup@gmail.com',
    pass: 'egrfpnplrnbuykev',
  },
});

async function runTest() {
  console.log('Testing SMTP connection with Gmail...');
  try {
    await transporter.verify();
    console.log('✅ Conexão SMTP autenticada com sucesso no Gmail!');

    const res = await transporter.sendMail({
      from: '"PlannerFin - Suporte & Segurança" <liverton.aguiar.sup@gmail.com>',
      to: 'liverton.aguiar.sup@gmail.com',
      subject: 'Teste de Recuperação de Senha - PlannerFin (Código: 849201)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0f172a; border-radius: 16px; color: #ffffff; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: #007a4d; color: white; width: 44px; height: 44px; border-radius: 12px; font-size: 24px; font-weight: bold; line-height: 44px; text-align: center;">P</div>
            <h2 style="color: #ffffff; margin: 10px 0 4px 0;">PlannerFin</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">Recuperação e Alteração de Senha</p>
          </div>
          <div style="background: rgba(0,122,77,0.2); border: 1px solid #10b981; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #34d399; font-weight: bold; margin: 0 0 8px 0;">SEU CÓDIGO DE RECUPERAÇÃO:</p>
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ffffff;">849201</span>
          </div>
          <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 16px 0;">
            Você solicitou a alteração de senha da sua conta no <strong>PlannerFin</strong>.
          </p>
        </div>
      `,
    });

    console.log('✅ E-mail de teste enviado com sucesso! Message ID:', res.messageId);
  } catch (err) {
    console.error('❌ Falha no teste SMTP:', err);
  }
}

runTest();
