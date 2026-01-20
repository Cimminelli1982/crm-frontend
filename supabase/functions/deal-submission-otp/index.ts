import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEYValue');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email via Resend
async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'RESEND_API_KEY not configured. Please add it in Supabase Dashboard → Project Settings → Functions → Secrets' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Deal Submission <noreply@cimminelli.com>',
        to: email,
        subject: 'Your verification code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">Verify your email</h2>
            <p style="color: #475569; font-size: 16px;">
              Use the following code to complete your deal submission:
            </p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">
                ${otp}
              </span>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              This code expires in 10 minutes.
            </p>
            <p style="color: #64748b; font-size: 14px;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return { success: false, error: `Resend API error: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: `Email sending failed: ${error.message}` };
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();

    if (path === 'send-otp' || url.pathname.includes('send-otp')) {
      // === SEND OTP ===
      const { email } = body;

      if (!email || !email.includes('@')) {
        return new Response(
          JSON.stringify({ error: 'Valid email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete any existing OTPs for this email
      await supabase
        .from('deal_submission_otp')
        .delete()
        .eq('email', email.toLowerCase());

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP
      const { error: insertError } = await supabase
        .from('deal_submission_otp')
        .insert({
          email: email.toLowerCase(),
          otp_code: otp,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Error storing OTP:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate verification code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send email
      const emailResult = await sendOTPEmail(email, otp);

      if (!emailResult.success) {
        console.error('Email sending failed:', emailResult.error);
        return new Response(
          JSON.stringify({ error: emailResult.error || 'Failed to send verification email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Verification code sent' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (path === 'verify-otp' || url.pathname.includes('verify-otp')) {
      // === VERIFY OTP ===
      const { email, otp } = body;

      if (!email || !otp) {
        return new Response(
          JSON.stringify({ error: 'Email and OTP are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from('deal_submission_otp')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('otp_code', otp)
        .eq('verified', false)
        .single();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ error: 'Invalid verification code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiration
      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Verification code has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark as verified
      await supabase
        .from('deal_submission_otp')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      // Check if email exists in CRM
      const { data: existingEmail } = await supabase
        .from('contact_emails')
        .select(`
          email_id,
          contact_id,
          contacts (
            contact_id,
            first_name,
            last_name,
            linkedin,
            job_role
          )
        `)
        .eq('email', email.toLowerCase())
        .single();

      let responseData: any = {
        verified: true,
        contact_id: null,
        contact: null,
        mobiles: [],
        cities: []
      };

      if (existingEmail?.contact_id) {
        responseData.contact_id = existingEmail.contact_id;
        responseData.contact = existingEmail.contacts;

        // Fetch mobiles
        const { data: mobiles } = await supabase
          .from('contact_mobiles')
          .select('mobile_id, mobile, type, is_primary')
          .eq('contact_id', existingEmail.contact_id);
        responseData.mobiles = mobiles || [];

        // Fetch cities
        const { data: cities } = await supabase
          .from('contact_cities')
          .select('entry_id, city_id, cities(city_id, name, country)')
          .eq('contact_id', existingEmail.contact_id);
        responseData.cities = (cities || []).map((c: any) => c.cities);
      }

      return new Response(
        JSON.stringify(responseData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint. Use /send-otp or /verify-otp' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
