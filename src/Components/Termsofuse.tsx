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

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-[#0e0d0b] text-[#f5f0e8]">
      <SEO title="Terms of Use" url="https://lux-d1ok.vercel.app/terms" />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C9A96E] mb-3">
          Legal
        </p>
        <h1 className="font-['Cormorant_Garamond'] text-4xl mb-2">
          Terms of Use
        </h1>
        <p className="text-xs text-[rgba(245,240,232,0.4)] mb-10">
          Last updated: June 19, 2026
        </p>

        <Section title="Acceptance of these terms">
          <p>
            By creating an account or using LuxStay, you agree to these Terms of
            Use. If you do not agree, please do not use the platform. LuxStay is
            currently operated as an individual / sole proprietorship; this
            section will be updated if that changes.
          </p>
        </Section>

        <Section title="Who can use LuxStay">
          <p>
            You must be at least 18 years old to create an account, list a
            property, or make a booking on LuxStay. By signing up, you confirm
            that the information you provide is accurate and that you have the
            legal right to enter into this agreement.
          </p>
        </Section>

        <Section title="Accounts and roles">
          <p>
            LuxStay has two account types:{" "}
            <strong className="text-[#f5f0e8]">Guest</strong> accounts, for
            browsing and booking properties, and{" "}
            <strong className="text-[#f5f0e8]">Host</strong> accounts, for
            listing properties. A third role, Administrator, is assigned
            internally and is never available through public signup.
          </p>
          <p>
            You are responsible for keeping your login credentials secure and
            for all activity that happens under your account.
          </p>
        </Section>

        <Section title="Listing a property (Hosts)">
          <p>
            Hosts must submit identity verification (government ID, selfie,
            proof of ownership, and a recent utility bill) before a listing can
            go live. LuxStay reviews submissions and may approve, reject, or
            request more information before a property is published. LuxStay
            reserves the right to remove any listing that violates these terms
            or is found to be fraudulent, misleading, or unsafe.
          </p>
          <p>
            Hosts are responsible for the accuracy of their listing details
            (price, photos, amenities, availability) and for honoring confirmed
            bookings.
          </p>
        </Section>

        <Section title="Making a booking (Guests)">
          <p>
            When you book a property, you agree to pay the full amount shown at
            checkout, including any taxes or fees displayed. Bookings are
            confirmed once payment is successfully processed through Paystack.
          </p>
        </Section>

        <Section title="Cancellations and refunds">
          <p>
            Guests may cancel a confirmed booking for a full refund up to{" "}
            <strong className="text-[#f5f0e8]">48 hours before check-in</strong>
            . Cancellations made within 48 hours of check-in are not eligible
            for a refund unless the host agrees otherwise. To request a
            cancellation, contact the host directly through LuxStay messaging or
            email{" "}
            <a
              href="mailto:support@luxstay.com"
              className="text-[#C9A96E] underline"
            >
              support@luxstay.com
            </a>
            .
          </p>
          <p>
            This policy may vary in the future on a per-listing basis; any such
            change will be clearly shown on the listing before booking.
          </p>
        </Section>

        <Section title="Payments and payouts">
          <p>
            All payments are processed securely through Paystack. On every
            completed booking, LuxStay retains a 10% platform fee, and the
            remaining 90% is credited to the host's LuxStay wallet. Hosts may
            request a withdrawal of their wallet balance to a linked bank
            account; withdrawal requests are reviewed manually before payment is
            released and may take 24–48 hours to process.
          </p>
        </Section>

        <Section title="Prohibited conduct">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>List a property you do not own or have authority to list</li>
            <li>Provide false identity or verification documents</li>
            <li>Use the platform for any unlawful purpose</li>
            <li>
              Attempt to bypass LuxStay's payment system to avoid platform fees
            </li>
            <li>
              Harass, threaten, or abuse other users through messaging or
              reviews
            </li>
            <li>
              Attempt to gain unauthorized access to another user's account or
              to administrator functions
            </li>
          </ul>
          <p>
            Violation of these terms may result in suspension or termination of
            your account.
          </p>
        </Section>

        <Section title="Reviews">
          <p>
            Only guests with a completed, paid booking may leave a review for
            that stay. Reviews must reflect a genuine experience. LuxStay may
            remove reviews that are fraudulent, abusive, or violate these terms.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            LuxStay acts as a platform connecting guests and hosts. We are not
            the owner or operator of any listed property and are not responsible
            for the condition of a property, the conduct of a host or guest, or
            any dispute arising between them, except as required by applicable
            law. We do, however, facilitate dispute resolution where reasonably
            possible.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these Terms of Use as LuxStay grows and adds new
            features. Continued use of the platform after changes are posted
            constitutes acceptance of the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms can be sent to{" "}
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

export default TermsOfUse;
