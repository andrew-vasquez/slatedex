import AppLink from "~/components/ui/AppLink";
import Breadcrumb from "@/components/ui/Breadcrumb";

const LAST_UPDATED = "February 18, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb
          items={[{ label: "Slatedex", href: "/" }, { label: "Terms of Service" }]}
          className="mb-6"
        />

        <div className="panel p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8 border-b pb-6" style={{ borderColor: "var(--border)" }}>
            <AppLink href="/" className="font-display text-2xl leading-none" style={{ letterSpacing: "-0.025em", textDecoration: "none" }}>
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </AppLink>
            <h1 className="font-display mt-3 text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              Terms of Service
            </h1>
            <p className="mt-1.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          {/* Introduction */}
          <div className="prose-section mb-6">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Welcome to Slatedex. By accessing or using our service, you agree to be bound by these Terms of Service. Please read them carefully before using the platform.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {/* 1. Acceptance */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account or using Slatedex in any way, you confirm that you are at least 13 years of age and agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.
              </p>
            </section>

            {/* 2. Description */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                2. Description of Service
              </h2>
              <p>
                Slatedex is a Pokémon team-planning tool that allows users to browse Pokémon by generation, build and save teams, analyze type coverage, and share their trainer profiles publicly. The service is provided free of charge, though we may introduce optional paid features in the future.
              </p>
              <p className="mt-2">
                Slatedex is an independent fan project and is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak, or The Pokémon Company. All Pokémon names, sprites, and related intellectual property are trademarks of their respective owners.
              </p>
            </section>

            {/* 3. User Accounts */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                3. User Accounts
              </h2>
              <ul className="list-disc list-outside pl-4 space-y-1.5">
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You must provide accurate information when creating your account.</li>
                <li>You may not create accounts for the purpose of abusing the service, spamming, or harassing other users.</li>
                <li>You may not share your account with others or use another person&apos;s account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            {/* 4. Acceptable Use */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                4. Acceptable Use
              </h2>
              <p className="mb-2">You agree not to use Slatedex to:</p>
              <ul className="list-disc list-outside pl-4 space-y-1.5">
                <li>Violate any applicable laws or regulations.</li>
                <li>Upload, post, or transmit any content that is offensive, defamatory, or harmful.</li>
                <li>Attempt to gain unauthorized access to other users&apos; accounts or our systems.</li>
                <li>Scrape, crawl, or otherwise extract data from the service in a way that places excessive load on our infrastructure.</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of our service.</li>
                <li>Use the service for any commercial purpose without our prior written consent.</li>
              </ul>
            </section>

            {/* 5. User Content */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                5. User Content
              </h2>
              <p>
                You retain ownership of content you create, such as team names and profile information. By submitting content to Slatedex, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and display that content in connection with operating and improving the service.
              </p>
              <p className="mt-2">
                You are solely responsible for the content you submit. We do not pre-screen user content but reserve the right to remove content that violates these Terms or that we find objectionable.
              </p>
            </section>

            {/* 6. Intellectual Property */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                6. Intellectual Property
              </h2>
              <p>
                The Slatedex name, logo, and original code are our intellectual property. Pokémon and all related names, characters, and imagery are property of Nintendo, Game Freak, and The Pokémon Company. Pokémon data is sourced from the open PokéAPI project.
              </p>
            </section>

            {/* 7. Disclaimers */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                7. Disclaimers and Limitation of Liability
              </h2>
              <p>
                Slatedex is provided &quot;as is&quot; without warranty of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or completely secure.
              </p>
              <p className="mt-2">
                To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service, even if we have been advised of the possibility of such damages.
              </p>
            </section>

            {/* 8. Termination */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                8. Termination
              </h2>
              <p>
                You may stop using Slatedex at any time. You may also request deletion of your account by contacting us. We reserve the right to suspend or terminate your access to the service at any time, with or without notice, for conduct that we determine violates these Terms or is otherwise harmful to other users, us, or third parties.
              </p>
            </section>

            {/* 9. Changes */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                9. Changes to These Terms
              </h2>
              <p>
                We may update these Terms from time to time. When we make significant changes, we will update the &quot;Last updated&quot; date at the top of this page. Continued use of the service after changes constitutes your acceptance of the revised Terms.
              </p>
            </section>

            {/* 10. Contact */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                10. Contact
              </h2>
              <p>
                If you have questions about these Terms, please reach out through our platform. We&apos;re a small indie project and will do our best to respond promptly.
              </p>
            </section>
          </div>

          {/* Footer nav */}
          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6" style={{ borderColor: "var(--border)" }}>
            <AppLink href="/" className="btn-secondary text-[0.72rem]">
              Back to Team Builder
            </AppLink>
            <AppLink href="/privacy" className="btn-secondary text-[0.72rem]">
              Privacy Policy
            </AppLink>
          </div>
        </div>
      </main>
    </div>
  );
}
