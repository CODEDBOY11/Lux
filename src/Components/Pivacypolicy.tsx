import SEO from "../seo";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-9">
    <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0e8] mb-3">
      {title}
    </h2>
    <div className="text-sm text-[rgba(245,240,232,0.65)] leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0e0d0b] text-[#f5f0e8]">
      <SEO title="Privacy Policy" url="https://lux-d1ok.vercel.app/privacy" />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C9A96E] mb-3">
          Legal
        </p>
        <h1 className="font-['Cormorant_Garamond'] text-4xl mb-2">
          Privacy Policy
        </h1>
        <p className="text-xs text-[rgba(245,240,232,0.4)] mb-10">
          Last updated: June 19, 2026
        </p>

        <Section title="Who we are">
          <p>
            LuxStay is operated as an individual / sole proprietorship. For any
            privacy questions, you can reach us at{" "}
            <a
              href="mailto:support@luxstay.com"
              className="text-[#C9A96E] underline"
            >
              support@luxstay.com
            </a>
            . As LuxStay grows, this section will be updated to reflect any
            formal business registration.
          </p>
        </Section>

        <Section title="What information we collect">
          <p>When you create an account, we collect:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>Name, email address, and phone number</li>
            <li>For hosts: property/company name and country</li>
            <li>
              Profile photo, if you sign in with Google or another provider
            </li>
          </ul>
          <p>When you make or receive a booking, we additionally collect:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>Check-in/check-out dates, guest count, special requests</li>
            <li>
              Payment confirmation details (we never see your card number — see
              "Payments" below)
            </li>
          </ul>
          <p>
            If you list a property, we collect identity verification documents
            (ID, selfie, proof of ownership, utility bill) solely to confirm you
            are a genuine host before your listing goes live.
          </p>
        </Section>

        <Section title="How we use your information">
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>To create and manage your account</li>
            <li>To process bookings and facilitate payment to hosts</li>
            <li>To verify host identity and property ownership</li>
            <li>To enable messaging between guests and hosts</li>
            <li>To send booking confirmations and account-related emails</li>
            <li>To detect and prevent fraud or abuse of the platform</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </Section>

        <Section title="Payments">
          <p>
            All payments on LuxStay are processed by{" "}
            <strong className="text-[#f5f0e8]">Paystack</strong>, a licensed
            payment processor. LuxStay does not store your card number, bank
            details, or CVV — these are handled entirely within Paystack's
            secure checkout. We only receive confirmation that a payment
            succeeded, along with a transaction reference.
          </p>
          <p>
            When a booking is paid, 90% of the amount is credited to the host's
            wallet and 10% is retained by LuxStay as a platform fee. Hosts can
            request a withdrawal to their bank account, which is manually
            reviewed before payout.
          </p>
        </Section>

        <Section title="Where your data is stored">
          <p>
            Account data, listings, bookings, and messages are stored using{" "}
            <strong className="text-[#f5f0e8]">Supabase</strong>, a database and
            authentication provider. Property photos and videos are stored using{" "}
            <strong className="text-[#f5f0e8]">Cloudinary</strong>, an image and
            video hosting service. Both providers maintain their own security
            and data protection standards, which you can review on their
            respective websites.
          </p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            LuxStay uses your browser's local session storage to keep you signed
            in and to remember temporary preferences (such as where to redirect
            you after logging in). We do not use third-party advertising cookies
            or trackers.
          </p>
        </Section>

        <Section title="Sharing with hosts and guests">
          <p>
            When you make a booking, your name, email, phone number, and booking
            details are shared with the host so they can prepare for your stay.
            Similarly, when you list a property, your name and response details
            are visible to guests who message or book with you. We do not share
            your information with any other guest or host beyond what is
            necessary to complete a booking.
          </p>
        </Section>

        <Section title="Your rights">
          <p>You can at any time:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>Request a copy of the data we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a
              href="mailto:support@luxstay.com"
              className="text-[#C9A96E] underline"
            >
              support@luxstay.com
            </a>
            . We will respond within a reasonable timeframe. Note that we may
            retain certain booking and payment records as required by law, even
            after an account is deleted.
          </p>
        </Section>

        <Section title="Children">
          <p>
            LuxStay is not intended for use by anyone under the age of 18. We do
            not knowingly collect information from minors.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this Privacy Policy as LuxStay grows and adds new
            features. Material changes will be reflected by updating the "Last
            updated" date above.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy can be sent to{" "}
            <a
              href="mailto:support@luxstay.com"
              className="text-[#C9A96E] underline"
            >
              support@luxstay.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
